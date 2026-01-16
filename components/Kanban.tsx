
import React, { useState } from 'react';
import { Task, Sector, User, Comment, SubTask } from '../types';

interface KanbanProps {
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: Task['status']) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void; // New prop
  sectors: Sector[];
  team: User[];
  currentUser: User;
}

const Kanban: React.FC<KanbanProps> = ({
  tasks,
  onMoveTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask, // Destructure
  sectors,
  team,
  currentUser
}) => {
  const columns: Task['status'][] = ['A fazer', 'Em curso', 'Revisão', 'Concluído'];

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  // New project state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskLead, setNewTaskLead] = useState('');
  const [newTaskSectors, setNewTaskSectors] = useState<string[]>([]);
  const [newTaskStartDate, setNewTaskStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSubTasks, setNewSubTasks] = useState<{ userId: string, desc: string }[]>([]);

  // Filter Users based on selected sectors
  const validUsers = newTaskSectors.length > 0
    ? team.filter(u => u.sectors.some(s => newTaskSectors.includes(s)))
    : team;

  const getPriorityStyle = (p: Task['priority']) => {
    switch (p) {
      case 'Alta': return 'bg-primary text-white';
      case 'Baixa': return 'bg-blue-100 text-blue-700';
      case 'Média': return 'bg-amber-100 text-amber-700';
      case 'Crítica': return 'bg-red-500 text-white';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || newTaskSectors.length === 0) {
      alert("Preencha o título e selecione pelo menos um setor.");
      return;
    }

    const finalLead = newTaskLead || validUsers[0]?.id || currentUser.id;
    const editingId = (window as any).editingTaskId;

    if (editingId) {
      // Update Logic
      const updatedTask: Task = {
        id: editingId,
        title: newTaskTitle,
        description: newTaskDesc,
        status: tasks.find(t => t.id === editingId)?.status || 'A fazer',
        priority: 'Média',
        projectLeadId: finalLead,
        subTasks: newSubTasks.map(st => {
          const u = team.find(ut => ut.id === st.userId);
          return {
            id: st.userId.includes('-') && st.userId.length > 10 ? crypto.randomUUID() : crypto.randomUUID(), // Ensure ID
            userId: st.userId,
            userName: u?.name || 'Unknown',
            userAvatar: u?.avatar || '',
            taskDescription: st.desc,
            progress: 0
          };
        }),
        sectors: newTaskSectors,
        sectorId: newTaskSectors[0],
        startDate: newTaskStartDate,
        dueDate: newTaskDueDate,
        comments: tasks.find(t => t.id === editingId)?.comments || []
      };
      onUpdateTask(updatedTask);
      (window as any).editingTaskId = null;
    } else {
      // Create Logic
      const task: Task = {
        id: crypto.randomUUID(),
        title: newTaskTitle,
        description: newTaskDesc,
        status: 'A fazer', // Default status for new tasks
        priority: 'Média',
        projectLeadId: finalLead,
        subTasks: newSubTasks.map(st => {
          const u = team.find(ut => ut.id === st.userId);
          return {
            id: crypto.randomUUID(),
            userId: st.userId,
            userName: u?.name || 'Unknown',
            userAvatar: u?.avatar || '',
            taskDescription: st.desc,
            progress: 0
          };
        }),
        sectors: newTaskSectors,
        sectorId: newTaskSectors[0],
        startDate: newTaskStartDate,
        dueDate: newTaskDueDate,
        comments: []
      };
      onAddTask(task);
    }

    setIsCreateModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskLead('');
    setNewTaskSectors([]);
    setNewSubTasks([]);
    setNewTaskStartDate(new Date().toISOString().split('T')[0]);
    setNewTaskDueDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddComment = () => {
    if (!selectedTask || !commentText.trim()) return;
    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: currentUser.name,
      avatar: currentUser.avatar,
      text: commentText,
      timestamp: 'Agora mesmo',
      author_id: currentUser.id
    };
    const updated = { ...selectedTask, comments: [...(selectedTask.comments || []), newComment] };
    onUpdateTask(updated);
    setSelectedTask(updated); // Update local state immediately
    setCommentText('');
  };

  const updateSubTaskProgress = (stId: string, val: number) => {
    if (!selectedTask) return;
    const updatedSubTasks = selectedTask.subTasks.map(st =>
      st.id === stId ? { ...st, progress: val } : st
    );
    const updated = { ...selectedTask, subTasks: updatedSubTasks };
    onUpdateTask(updated);
    setSelectedTask(updated);
  };

  const calculateTotalProgress = (t: Task) => {
    if (!t.subTasks.length) return 0;
    const sum = t.subTasks.reduce((acc, st) => acc + st.progress, 0);
    return Math.round(sum / t.subTasks.length);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: Add a class to the element being dragged for visual feedback
    // e.currentTarget.classList.add('opacity-50'); 
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onMoveTask(taskId, status);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white/50">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Quadro de Projetos</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestão Compartilhada</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all">
          <span className="material-symbols-outlined text-lg">add_task</span>
          <span>Criar Projeto</span>
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-8 custom-scrollbar">
        <div className="flex gap-6 h-full items-start">
          {columns.map((col) => (
            <div
              key={col}
              className="w-[320px] flex-shrink-0 bg-kanban-bg rounded-xl p-3 flex flex-col max-h-full transition-colors drag-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
            >
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4 px-2 select-none">{col}</h3>
              <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar min-h-[100px]">
                {tasks.filter(t => t.status === col).map(task => {
                  const progress = calculateTotalProgress(task);
                  const lead = team.find(u => u.id === task.projectLeadId);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-primary/50 transition-all group cursor-grab active:cursor-grabbing hover:shadow-md"
                    >
                      <h4 className="text-sm font-bold text-slate-900 mb-3">{task.title}</h4>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
                        <div className={`h-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {task.subTasks.slice(0, 3).map(st => (
                            <img key={st.id} src={st.userAvatar} className="size-6 rounded-full border-2 border-white ring-1 ring-slate-100 object-cover" title={st.userName} />
                          ))}
                          {task.subTasks.length > 3 && (
                            <div className="size-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">+{task.subTasks.length - 3}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                          <span className="material-symbols-outlined text-[10px] text-slate-400">person</span>
                          <span className="text-[9px] font-bold text-slate-500 truncate max-w-[60px]">{lead?.name.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedTask.title}</h2>
              <p className="text-sm text-slate-500 mb-8">{selectedTask.description}</p>

              <div className="mb-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Designados e Tarefas</h3>
                <div className="grid grid-cols-1 gap-3">
                  {selectedTask.subTasks.map(st => (
                    <div key={st.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <img src={st.userAvatar} className="size-8 rounded-full object-cover" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{st.userName}</p>
                            <p className="text-[10px] text-slate-500">{st.taskDescription}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-primary">{st.progress}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" step="5"
                        value={st.progress}
                        onChange={(e) => updateSubTaskProgress(st.id, parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Comentários</h3>
                <div className="flex flex-col gap-4 mb-6">
                  {selectedTask.comments?.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <img src={c.avatar} className="size-8 rounded-full object-cover" />
                      <div className="bg-slate-50 p-3 rounded-xl flex-1 border border-slate-100">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold">{c.author}</span>
                          <span className="text-[9px] text-slate-400">{c.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none" rows={1} placeholder="Escreva..." />
                  <button onClick={handleAddComment} className="bg-primary text-white p-2 rounded-xl"><span className="material-symbols-outlined text-sm">send</span></button>
                </div>
              </div>
            </div>

            <div className="w-72 bg-slate-50 border-l p-8 flex flex-col gap-6">
              <button onClick={() => setSelectedTask(null)} className="self-end text-slate-400"><span className="material-symbols-outlined">close</span></button>

              {(currentUser.id === selectedTask.projectLeadId || currentUser.role === 'ADMIN') && (
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setNewTaskTitle(selectedTask.title);
                    setNewTaskDesc(selectedTask.description || '');
                    setNewTaskLead(selectedTask.projectLeadId);
                    setNewTaskStartDate(selectedTask.startDate || new Date().toISOString().split('T')[0]);
                    setNewTaskDueDate(selectedTask.dueDate || new Date().toISOString().split('T')[0]);
                    setNewSubTasks(selectedTask.subTasks.map(st => ({ userId: st.userId, desc: st.taskDescription })));
                    setNewTaskSectors(selectedTask.sectors || (selectedTask.sectorId ? [selectedTask.sectorId] : []));
                    // Store ID to know it's update
                    if (typeof window !== 'undefined') (window as any).editingTaskId = selectedTask.id;
                    setSelectedTask(null);
                  }}
                  className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-300 transition-colors"
                >
                  Editar Projeto
                </button>
              )}

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Líder do Projeto</label>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                  <img src={team.find(u => u.id === selectedTask.projectLeadId)?.avatar} className="size-6 rounded-full" />
                  <span className="text-xs font-bold truncate">{team.find(u => u.id === selectedTask.projectLeadId)?.name}</span>
                </div>
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
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">calendar_month</span>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja finalizar este projeto?')) {
                      onMoveTask(selectedTask.id, 'Concluído');
                      setSelectedTask(null);
                    }
                  }}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
                >
                  Finalizar Projeto
                </button>

                {(currentUser.id === selectedTask.projectLeadId || currentUser.role === 'ADMIN') && (
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja EXCLUIR este projeto? Esta ação é irreversível.')) {
                        onDeleteTask(selectedTask.id);
                        setSelectedTask(null);
                      }
                    }}
                    className="w-full py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                  >
                    Excluir Projeto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 scale-in-center overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-xl font-black text-slate-900">Novo Projeto Corporativo</h3>
            <div className="flex flex-col gap-4">
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full border-slate-200 bg-slate-50 rounded-xl py-3 px-4 text-sm" placeholder="Título do Projeto" />
              <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="w-full border-slate-200 bg-slate-50 rounded-xl py-3 px-4 text-sm resize-none" placeholder="Contexto e Objetivos" rows={3} />

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setores Envolvidos (Selecione um ou mais)</label>
                <div className="flex flex-wrap gap-2">
                  {sectors.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (newTaskSectors.includes(s.id)) {
                          setNewTaskSectors(newTaskSectors.filter(id => id !== s.id));
                        } else {
                          setNewTaskSectors([...newTaskSectors, s.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${newTaskSectors.includes(s.id)
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {newTaskSectors.length === 0 && <p className="text-[10px] text-red-500 font-bold">* Selecione ao menos um setor para ver os responsáveis.</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-slate-100">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Líder Responsável</label>
                  <select value={newTaskLead} onChange={e => setNewTaskLead(e.target.value)} className="w-full border-slate-200 bg-slate-50 rounded-xl py-2 px-4 text-sm" disabled={validUsers.length === 0}>
                    <option value="">{validUsers.length > 0 ? 'Selecione...' : 'Sem usuários no setor'}</option>
                    {validUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Data de Início</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newTaskStartDate}
                      onChange={e => setNewTaskStartDate(e.target.value)}
                      className="w-full border-slate-200 bg-slate-50 rounded-xl py-2 px-4 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Prazo de Entrega</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={e => setNewTaskDueDate(e.target.value)}
                      className="w-full border-slate-200 bg-slate-50 rounded-xl py-2 px-4 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Time e Atribuições Individuais</h4>
                <div className="flex flex-col gap-3">
                  {newSubTasks.map((st, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select value={st.userId} onChange={e => {
                        const copy = [...newSubTasks];
                        copy[i].userId = e.target.value;
                        setNewSubTasks(copy);
                      }} className="w-32 text-xs border-slate-100 bg-slate-50 rounded-lg" disabled={validUsers.length === 0}>
                        <option value="">Selecione...</option>
                        {validUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                      <input value={st.desc} onChange={e => {
                        const copy = [...newSubTasks];
                        copy[i].desc = e.target.value;
                        setNewSubTasks(copy);
                      }} className="flex-1 text-xs border-slate-100 bg-slate-50 rounded-lg" placeholder="Tarefa individual..." />
                      <button onClick={() => setNewSubTasks(newSubTasks.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><span className="material-symbols-outlined text-sm">remove_circle</span></button>
                    </div>
                  ))}
                  <button onClick={() => setNewSubTasks([...newSubTasks, { userId: validUsers[0]?.id || '', desc: '' }])} className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline" disabled={validUsers.length === 0}>
                    <span className="material-symbols-outlined text-sm">add_circle</span> Adicionar Integrante
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                <button onClick={handleCreateTask} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Publicar Projeto</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;
