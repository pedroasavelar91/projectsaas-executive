
import React, { useState } from 'react';
import { TodoItem } from '../types';

interface TodoListProps {
  todos: TodoItem[];
  onAdd: (todo: TodoItem) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onAdd, onToggle, onDelete }) => {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* Pagination & Filter State */
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('pending');

  /* New State for Modal */
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter and Pagination Logic
  const filteredTodos = todos.filter(t => {
    if (filterTab === 'pending') return !t.completed;
    if (filterTab === 'completed') return t.completed;
    return true;
  });

  const paginatedTodos = filteredTodos.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);
  const totalPages = Math.ceil(filteredTodos.length / pagination.limit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    onAdd({
      id: crypto.randomUUID(),
      text: newTodo,
      completed: false,
      dueDate: dueDate || undefined
    });
    setNewTodo('');
    setDueDate('');
    setIsModalOpen(false); // Close modal
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const blanks = Array(firstDay).fill(null);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 animate-in fade-in">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined text-slate-400">chevron_left</span>
          </button>
          <h3 className="text-lg font-bold text-slate-800 capitalize">{monthNames[month]} {year}</h3>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {blanks.map((_, i) => <div key={`blank-${i}`} className="h-10"></div>)}
          {daysArray.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasTodo = todos.some(t => t.dueDate === dateStr && !t.completed);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            const isSelected = selectedDate === dateStr;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold relative transition-all cursor-pointer border 
                   ${isSelected ? 'bg-primary text-white border-primary shadow-lg scale-110 z-10' :
                    isToday ? 'border-primary text-primary bg-primary/5' : 'border-slate-100 text-slate-700 hover:bg-slate-50'}`}
              >
                {day}
                {hasTodo && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`}></div>}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-50">
          <p className="text-xs text-slate-400 font-medium text-center">Dias com pontos vermelhos possuem tarefas pendentes.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Minhas Tarefas</h2>
          <p className="text-slate-400 font-medium text-sm mt-1">Gerencie suas pendências pessoais</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nova Tarefa
          </button>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="material-symbols-outlined text-sm font-bold">list</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="material-symbols-outlined text-sm font-bold">calendar_month</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">

        {/* Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 scale-in-center">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Nova Tarefa</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="O que precisa ser feito?"
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Prazo (Opcional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-600 font-medium"
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 bg-slate-900 text-white font-bold rounded-xl py-3 hover:bg-slate-800 transition-all shadow-lg">Criar Tarefa</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewMode === 'list' ? (
          <div>
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => { setFilterTab('pending'); setPagination({ ...pagination, page: 1 }); }}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all ${filterTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                A Fazer ({todos.filter(t => !t.completed).length})
              </button>
              <button
                onClick={() => { setFilterTab('completed'); setPagination({ ...pagination, page: 1 }); }}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all ${filterTab === 'completed' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Concluído ({todos.filter(t => t.completed).length})
              </button>
              <button
                onClick={() => { setFilterTab('all'); setPagination({ ...pagination, page: 1 }); }}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all ${filterTab === 'all' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Todas
              </button>
            </div>

            <div className="divide-y divide-slate-50 min-h-[300px]">
              {paginatedTodos.length === 0 ? (
                <div className="p-12 text-center h-full flex flex-col justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-slate-300">check_circle</span>
                  </div>
                  <h3 className="text-slate-900 font-bold mb-1">Nada por aqui!</h3>
                  <p className="text-slate-400 text-sm">Nenhuma tarefa encontrada nesta aba.</p>
                </div>
              ) : (
                paginatedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="group flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <button
                      onClick={() => onToggle(todo.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${todo.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 text-transparent hover:border-emerald-500'
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-all ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}>
                        {todo.text}
                      </p>
                      {todo.dueDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">event</span>
                          {new Date(todo.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onDelete(todo.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 p-4 border-t border-slate-100">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-all text-slate-500"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Página {pagination.page} de {totalPages}
                </span>
                <button
                  disabled={pagination.page === totalPages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-all text-slate-500"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-slate-50">
            {renderCalendar()}
            <div className="mt-8 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-widest">
                  {selectedDate ? `Tarefas de ${selectedDate.split('-').reverse().join('/')}` : 'Pendentes este mês'}
                </h4>
                {selectedDate && (
                  <button onClick={() => setSelectedDate(null)} className="text-xs font-black text-primary hover:underline">
                    VER TODOS
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {todos.filter(t => {
                  if (t.completed) return false;
                  if (!t.dueDate) return false;
                  if (selectedDate) return t.dueDate === selectedDate;
                  return new Date(t.dueDate).getMonth() === currentDate.getMonth();
                }).map(todo => (
                  <div key={todo.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md">
                    <span className={`text-xs font-bold w-12 text-center rounded p-1 ${selectedDate ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-500'}`}>
                      {todo.dueDate?.split('-')[2]}/{todo.dueDate?.split('-')[1]}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{todo.text}</span>
                    <div className="ml-auto flex gap-1">
                      <button onClick={() => onToggle(todo.id)} className="p-1 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors" title="Concluir">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                      <button onClick={() => onDelete(todo.id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Excluir">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
                {todos.filter(t => !t.completed && t.dueDate && (selectedDate ? t.dueDate === selectedDate : new Date(t.dueDate).getMonth() === currentDate.getMonth())).length === 0 && (
                  <div className="text-center py-6 text-slate-400">
                    <span className="material-symbols-outlined text-2xl mb-2 opacity-50">event_available</span>
                    <p className="text-xs italic">Nenhuma pendência para {selectedDate ? 'este dia' : 'este mês'}.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
