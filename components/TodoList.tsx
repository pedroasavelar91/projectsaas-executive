
import React, { useState } from 'react';
import { TodoItem } from '../types';

interface TodoListProps {
  todos: TodoItem[];
  onAdd: (todo: TodoItem) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onAdd, onToggle, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !newDueDate) return;
    const item: TodoItem = {
      id: Math.random().toString(36).substring(7), // Temp ID, or let DB generate? 
      // If we let DB generate, we need to wait for response. 
      // For optimistic UI, using a temp ID is fine if we handle it, but here we use string IDs.
      text: newTodo,
      completed: false,
      dueDate: newDueDate
    };
    onAdd(item);
    setNewTodo('');
    setNewDueDate('');
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">checklist</span>
            Minhas Tarefas Pessoais
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nova Tarefa
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {todos.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-slate-400 gap-4">
              <div className="bg-slate-50 p-6 rounded-full">
                <span className="material-symbols-outlined text-5xl">task_alt</span>
              </div>
              <p className="font-bold text-lg">Sua lista está vazia!</p>
              <p className="text-sm font-medium">Use o botão acima para começar seu dia.</p>
            </div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className="group flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                <button
                  onClick={() => onToggle(todo.id)}
                  className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 shadow-inner'
                    }`}
                >
                  {todo.completed && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                </button>
                <div className="flex-1 flex flex-col">
                  <span className={`text-sm font-bold transition-all ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {todo.text}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-[12px] text-slate-400">event</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prazo: {new Date(todo.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all hover:bg-white rounded-lg"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Todo Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 scale-in-center">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_square</span>
                Nova Tarefa Pessoal
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={addTodo} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  placeholder="O que precisa ser feito?"
                  rows={3}
                  required
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Prazo de Conclusão</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList;
