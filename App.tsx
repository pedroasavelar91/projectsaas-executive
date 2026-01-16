
import React, { useState, useEffect } from 'react';
import { AppView, User, UserRole, Task, TodoItem, Sector } from './types';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Kanban from './components/Kanban';
import Timeline from './components/Timeline';
import AIAssistant from './components/AIAssistant';
import TeamManagement from './components/TeamManagement';
import Profile from './components/Profile';
import TodoList from './components/TodoList';
import { api } from './lib/api';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Authentication & Data Loading
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !currentUser) { // Only fetch if we don't have a user
        handleAuthUser(session.user.id);
      } else if (!session) {
        setCurrentView(AppView.LOGIN);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only react to specific events to prevent loops
      if (event === 'SIGNED_IN' && session) {
        handleAuthUser(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentView(AppView.LOGIN);
        // Clear data on logout
        setTasks([]);
        setTeam([]);
        setTodos([]);
        setSectors([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Run once. Dependency array empty is correct.

  const handleAuthUser = async (userId: string) => {
    if (isSyncing) return; // Prevent double sync
    setIsSyncing(true);
    const data = await api.fetchInitialData();

    if (data) {
      setSectors(data.sectors);
      setTeam(data.team);
      setTasks(data.tasks);
      setTodos(data.todos);

      // Find current user in team
      const me = data.team.find(u => u.id === userId);
      if (me) {
        setCurrentUser(me);
        // Only set view if currently at login, to prevent resetting view while working
        setCurrentView(prev => prev === AppView.LOGIN ? AppView.DASHBOARD : prev);
      } else {
        console.warn('User profile not found in fetched team.');
      }
    }
    setIsSyncing(false);
  };

  const handleUpdateProfile = (name: string, avatar: string) => {
    if (currentUser) {
      const updated = { ...currentUser, name, avatar };
      setCurrentUser(updated);
      const newTeam = team.map(u => u.id === updated.id ? updated : u);
      setTeam(newTeam);
      api.team.save(newTeam);
    }
  };

  const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updated = { ...task, status: newStatus };
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      api.tasks.update(updated);
    }
  };

  const handleAddTask = async (task: Task) => {
    // 1. Optimistic Update
    setTasks(prev => [...prev, task]);

    // 2. API Call (Must include corporation)
    if (!currentUser) return;
    try {
      const savedTask = await api.tasks.create(task, currentUser.corporation);
      // Replace optimistic ID with real UUID from DB
      setTasks(prev => prev.map(t => t.id === task.id ? savedTask : t));
    } catch (e) {
      console.error("Failed to save task", e);
      // Revert optimistic update? Or show error.
      alert("Erro ao salvar projeto. Tente novamente.");
      setTasks(prev => prev.filter(t => t.id !== task.id));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    try {
      await api.tasks.delete(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error("Failed to delete task", e);
      alert("Erro ao excluir projeto.");
    }
  };


  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    api.tasks.update(updatedTask);
  };

  // Todo Handlers
  const handleAddTodo = (todo: TodoItem) => {
    setTodos(prev => [todo, ...prev]);
    api.todos.save(todo);
  };

  const handleToggleTodo = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      const updated = { ...todo, completed: !todo.completed };
      setTodos(prev => prev.map(t => t.id === id ? updated : t));
      api.todos.save(updated);
    }
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    api.todos.delete(id);
  };

  // Admin Handlers
  const handleUpdateSectors = (newSectors: Sector[]) => {
    setSectors(newSectors);
    api.sectors.save(newSectors);
  };

  const handleDeleteSector = async (sectorId: string) => {
    if (!confirm("Tem certeza? Isso pode afetar tarefas vinculadas.")) return;
    try {
      await api.sectors.delete(sectorId);
      setSectors(prev => prev.filter(s => s.id !== sectorId));
    } catch (e) {
      console.error("Failed to delete sector", e);
      alert("Erro ao excluir setor.");
    }
  };

  const handleUpdateTeam = (newTeam: User[]) => {
    setTeam(newTeam);
    api.team.save(newTeam); // Note: RLS might block if updating others
  };

  const visibleTasks = tasks.filter(t =>
    currentUser?.sectors.includes(t.sectorId) ||
    currentUser?.role === UserRole.ADMIN ||
    t.projectLeadId === currentUser?.id ||
    t.subTasks.some(st => st.userId === currentUser?.id)
  );

  const renderView = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard tasks={visibleTasks} team={team} />;
      case AppView.PROJECTS:
        return <Kanban
          tasks={visibleTasks}
          onMoveTask={handleMoveTask}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask} // New Prop
          sectors={sectors}
          team={team}
          currentUser={currentUser}
        />;
      case AppView.TIMELINE:
        return <Timeline
          tasks={visibleTasks}
          todos={todos}
          onUpdateTask={handleUpdateTask}
          sectors={sectors}
          team={team}
          currentUser={currentUser}
        />;
      case AppView.TEAM_MANAGEMENT:
        return currentUser.role === UserRole.ADMIN ? (
          <TeamManagement
            sectors={sectors}
            onUpdateSectors={handleUpdateSectors}
            onDeleteSector={handleDeleteSector} // New prop
            team={team}
            onUpdateTeam={handleUpdateTeam}
          />
        ) : <Dashboard tasks={visibleTasks} team={team} />;
      case AppView.PROFILE:
        return <Profile user={currentUser} onUpdate={handleUpdateProfile} />;
      case AppView.TODO:
        return <TodoList
          todos={todos}
          onAdd={handleAddTodo}
          onToggle={handleToggleTodo}
          onDelete={handleDeleteTodo}
        />;
      default:
        return <Dashboard tasks={visibleTasks} team={team} />;
    }
  };

  if (currentView === AppView.LOGIN) {
    return <Login
      onLogin={() => { }} // Session listener handles redirect
      onForgotPassword={() => setCurrentView(AppView.FORGOT_PASSWORD)}
    />;
  }

  if (currentView === AppView.FORGOT_PASSWORD) {
    return <ForgotPassword onBack={() => setCurrentView(AppView.LOGIN)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Layout
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={currentUser}
        tasks={visibleTasks}
        isSyncing={isSyncing}
      >
        {renderView()}
      </Layout>

      <button
        onClick={() => setIsAIOpen(!isAIOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
      >
        <span className="material-symbols-outlined font-bold">auto_awesome</span>
      </button>

      {isAIOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 border-l border-slate-200 animate-in slide-in-from-right duration-300">
          <AIAssistant onClose={() => setIsAIOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default App;
