
import React, { useState, useMemo } from 'react';
import { Task, TodoItem, Sector, User, Comment } from '../types';

interface TimelineProps {
  tasks: Task[];
  todos: TodoItem[];
  onUpdateTask: (task: Task) => void;
  sectors: Sector[];
  team: User[];
  currentUser: User;
}

const Timeline: React.FC<TimelineProps> = ({ tasks, todos, onUpdateTask, sectors, team, currentUser }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'on-track' | 'completed'>('all');
  const [commentText, setCommentText] = useState('');

  const filteredItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const items = [
      ...tasks.map(t => ({
        id: t.id,
        name: t.title,
        owner: t.assignee?.name || team.find(u => u.id === t.projectLeadId)?.name || 'N/A',
        status: t.status,
        type: 'task',
        date: t.dueDate,
        originalTask: t
      })),
      ...todos.map(todo => ({
        id: todo.id,
        name: `[PESSOAL] ${todo.text}`,
        owner: 'Você',
        status: todo.completed ? 'Concluído' : 'Pendente',
        type: 'todo',
        date: todo.dueDate,
        originalTask: null
      }))
    ];

    return items.filter(item => {
      const itemDate = new Date(item.date);
      const isCompleted = item.status === 'Concluído';
      const isOverdue = !isCompleted && itemDate < now;

      if (filter === 'overdue') return isOverdue;
      if (filter === 'on-track') return !isCompleted && !isOverdue;
      if (filter === 'completed') return isCompleted;
      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks, todos, filter, team]);

  const displayTasks = filteredItems.map((item, i) => ({
    ...item,
    progress: item.status === 'Concluído' ? '100%' : '25%',
    start: `${20 + i * 40}px`,
    width: `${140 + (i % 3) * 40}px`,
    color: item.status === 'Concluído' ? 'bg-slate-900' : (new Date(item.date) < new Date() ? 'bg-red-500' : 'bg-primary')
  }));

  const updateSubTaskProgress = (stId: string, val: number) => {
    if (!selectedTask) return;
    const updatedSubTasks = selectedTask.subTasks.map(st => 
      st.id === stId ? { ...st, progress: val } : st
    );
    const updated = { ...selectedTask, subTasks: updatedSubTasks };
    onUpdateTask(updated);
    setSelectedTask(updated);
  };

  const handleAddComment = () => {
    if (!selectedTask || !commentText.trim()) return;
    const newComment: Comment = {
      id: Math.random().toString(36).substring(7),
      author: currentUser.name,
      avatar: currentUser.avatar,
      text: commentText,
      timestamp: 'Agora mesmo'
    };
    onUpdateTask({ ...selectedTask, comments: [...(selectedTask.comments || []), newComment] });
    setCommentText('');
  };

  const handleDateChange = (id: string, newDate: string, type: string) => {
    if (type === 'task') {
      const task = tasks.find(t => t.id === id);
      if (task) {
        onUpdateTask({ ...task, dueDate: newDate });
      }
    }
    // Note: TodoItem update would require passing setTodo to props, 
    // but for now we focus on Tasks as requested for "Kanban-like" features.
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="px-8 py-6 flex flex-col md:flex-row md:items-end justify-between shrink-0 bg-white gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cronograma Unificado</h3>
          <p className="text-slate-500 text-sm mt-0.5">Gestão temporal com edição via calendário</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          {[
            { id: 'all', label: 'Todos', icon: 'list' },
            { id: 'overdue', label: 'Atrasados', icon: 'error' },
            { id: 'on-track', label: 'Em Dia', icon: 'check_circle' },
            { id: 'completed', label: 'Concluídos', icon: 'verified' }
          ].map(f => (
            <button 
              key={f.id} 
              onClick={() => setFilter(f.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                filter === f.id ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden border-t border-slate-100">
        <div className="w-[380px] border-r border-slate-100 flex flex-col flex-shrink-0">
          <div className="h-10 flex items-center px-6 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
            <div className="w-full">Responsável / Descrição</div>
            <div className="w-32 text-right">Calendário / Prazo</div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {displayTasks.map((task, i) => (
              <div 
                key={i} 
                className="h-16 flex items-center px-6 border-b border-slate-50 transition-colors group hover:bg-slate-50"
              >
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => task.originalTask && setSelectedTask(task.originalTask)}
                >
                  <p className="text-[13px] font-bold text-slate-700 truncate">{task.name}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{task.owner}</p>
                </div>
                <div className="w-32 flex justify-end group/date">
                   {task.type === 'task' ? (
                     <div className="relative">
                        <input 
                          type="date"
                          value={task.date}
                          onChange={(e) => handleDateChange(task.id, e.target.value, 'task')}
                          className="bg-transparent border-none text-[10px] font-black text-slate-600 focus:ring-0 outline-none w-[100px] text-right cursor-pointer hover:text-primary transition-colors"
                        />
                        <span className="material-symbols-outlined text-[12px] text-slate-300 absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/date:opacity-100">calendar_month</span>
                     </div>
                   ) : (
                     <span className="text-[10px] font-black text-slate-400">
                        {new Date(task.date).toLocaleDateString('pt-BR')}
                     </span>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar bg-white">
          <div className="min-w-[1500px] h-full flex flex-col bg-[length:40px_40px] bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px)]">
            <div className="h-10 border-b border-slate-100 flex bg-slate-50">
              {Array.from({ length: 5 }).map((_, w) => (
                <div key={w} className="w-[300px] border-r flex items-center px-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Semana {w + 1}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 relative">
              {displayTasks.map((task, i) => (
                <div key={i} className="h-16 flex items-center relative">
                  <div 
                    onClick={() => task.originalTask && setSelectedTask(task.originalTask)}
                    className={`absolute h-8 rounded-lg flex items-center px-2 shadow-sm border border-black/5 ${task.color} cursor-pointer hover:scale-[1.02] transition-all z-20`}
                    style={{ left: `${new Date(task.date).getDate() * 40}px`, width: task.width }}
                  >
                    <span className="text-[10px] font-bold ml-1 truncate text-white uppercase tracking-tight">{task.status}</span>
                  </div>
                </div>
              ))}
              <div className="absolute top-0 bottom-0 left-[480px] w-px bg-red-500 z-10 opacity-30"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal Reused from Kanban for consistency */}
      {selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-black text-slate-900 mb-6">{selectedTask.title}</h2>
              <div className="mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Designados e Performance</h3>
                <div className="grid grid-cols-1 gap-3">
                  {selectedTask.subTasks.map(st => (
                    <div key={st.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img src={st.userAvatar} className="size-6 rounded-full object-cover" />
                          <span className="text-xs font-bold">{st.userName}</span>
                        </div>
                        <span className="text-xs font-black text-primary">{st.progress}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={st.progress} onChange={e => updateSubTaskProgress(st.id, parseInt(e.target.value))} className="w-full accent-primary" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Atividade</h3>
                <div className="flex flex-col gap-4 mb-4">
                  {selectedTask.comments?.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="size-7 rounded-full bg-slate-200"></div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex-1 text-xs">
                        <span className="font-bold">{c.author}</span>: {c.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                   <input value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 bg-slate-50 border rounded-xl px-4 py-2 text-xs" placeholder="Novo comentário..." />
                   <button onClick={handleAddComment} className="bg-primary text-white p-2 rounded-xl"><span className="material-symbols-outlined text-sm">send</span></button>
                </div>
              </div>
            </div>
            <div className="w-72 bg-slate-50 p-8 border-l flex flex-col gap-8">
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 self-end"><span className="material-symbols-outlined">close</span></button>
              
              <div className="mt-4">
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                <div className="text-sm font-bold text-slate-900">{selectedTask.status}</div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Prazo de Entrega (Calendário)</label>
                <div className="relative group">
                  <input 
                    type="date" 
                    value={selectedTask.dueDate}
                    onChange={(e) => {
                      const updated = { ...selectedTask, dueDate: e.target.value };
                      onUpdateTask(updated);
                      setSelectedTask(updated);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
