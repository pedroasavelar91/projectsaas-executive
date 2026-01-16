
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area 
} from 'recharts';
import { Task, TeamActivity, User } from '../types';

interface DashboardProps {
  tasks: Task[];
  team: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, team }) => {
  const statusCounts = [
    { name: 'A fazer', value: tasks.filter(t => t.status === 'A fazer').length, color: '#F1F5F9' },
    { name: 'Em curso', value: tasks.filter(t => t.status === 'Em curso').length, color: '#FF6B0066' },
    { name: 'Revisão', value: tasks.filter(t => t.status === 'Revisão').length, color: '#cbd5e1' },
    { name: 'Concluído', value: tasks.filter(t => t.status === 'Concluído').length, color: '#FF6B00' },
  ];

  // Performance calculations
  const userPerformance = team.map(u => {
    const assignedSubTasks = tasks.flatMap(t => t.subTasks).filter(st => st.userId === u.id);
    const avgProgress = assignedSubTasks.length > 0 
      ? Math.round(assignedSubTasks.reduce((acc, st) => acc + st.progress, 0) / assignedSubTasks.length)
      : 0;
    
    return {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      progress: avgProgress,
      tasksCount: assignedSubTasks.length
    };
  }).sort((a, b) => b.progress - a.progress);

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Projetos Ativos', value: tasks.length, icon: 'folder_open', color: 'bg-primary/10 text-primary' },
          { label: 'Entrega Média', value: `${Math.round(tasks.reduce((acc, t) => acc + (t.status === 'Concluído' ? 100 : t.subTasks.reduce((s, st) => s + st.progress, 0) / (t.subTasks.length || 1)), 0) / (tasks.length || 1))}%`, icon: 'trending_up', color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Alertas Atraso', value: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Concluído').length, icon: 'warning', color: 'bg-red-50 text-red-500' },
          { label: 'Colaboradores', value: team.length, icon: 'groups', color: 'bg-slate-100 text-slate-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
            <div className={`size-10 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
              <span className="material-symbols-outlined text-xl">{stat.icon}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Main Chart */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-soft">
            <h4 className="text-lg font-extrabold text-slate-900 mb-8">Fluxo de Entregas por Status</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                    {statusCounts.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Individual Performance */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-soft">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-extrabold text-slate-900">Desempenho Individual</h4>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baseado em sub-tarefas</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userPerformance.map(up => (
                <div key={up.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                  <img src={up.avatar} className="size-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-bold text-slate-800">{up.name}</span>
                      <span className="text-xs font-black text-primary">{up.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all" style={{ width: `${up.progress}%` }}></div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{up.tasksCount} Atribuições Ativas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-soft flex flex-col gap-6">
          <h4 className="text-lg font-extrabold text-slate-900 border-b pb-4">Mix Corporativo</h4>
          <div className="space-y-6">
            {team.slice(0, 5).map(u => {
              const completedCount = tasks.flatMap(t => t.subTasks).filter(st => st.userId === u.id && st.progress === 100).length;
              return (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={u.avatar} className="size-8 rounded-full" />
                    <span className="text-xs font-bold">{u.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded">
                    {completedCount} CONCLUÍDAS
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
