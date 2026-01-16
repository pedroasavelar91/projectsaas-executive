import React, { useState } from 'react';
import { User, UserRole, Sector } from '../types';

interface TeamManagementProps {
  sectors: Sector[];
  onUpdateSectors: (sectors: Sector[]) => void;
  team: User[];
  onUpdateTeam: (team: User[]) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ sectors, onUpdateSectors, team, onUpdateTeam }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.USER, selectedSectors: [] as string[] });

  // Simulated Logs for Production Audit
  const [logs, setLogs] = useState([
    { id: 1, action: 'Sincronização iniciada', time: 'Há 2 min', type: 'system' },
    { id: 2, action: 'Membro João Santos atualizado', time: 'Há 15 min', type: 'user' },
  ]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    // Ideally this would invite the user via email. 
    // Since we don't have an email service, we just add it to the view.
    // Real auth user must sign up themselves.
    const user: User = {
      id: Math.random().toString(36).substring(7),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: `https://picsum.photos/seed/${newUser.name}/100/100`,
      joinedAt: new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      corporation: 'Corporação Unificada',
      sectors: newUser.selectedSectors
    };
    const updatedTeam = [...team, user];
    onUpdateTeam(updatedTeam);
    setLogs([{ id: Date.now(), action: `Novo acesso: ${user.name}`, time: 'Agora', type: 'auth' }, ...logs]);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role: UserRole.USER, selectedSectors: [] });
  };

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;
    const updatedSectors = [...sectors, { id: 's' + (sectors.length + 1), name: newSectorName }];
    onUpdateSectors(updatedSectors);
    setNewSectorName('');
  };

  const toggleSectorInUser = (sectorId: string) => {
    setNewUser(prev => ({
      ...prev,
      selectedSectors: prev.selectedSectors.includes(sectorId)
        ? prev.selectedSectors.filter(id => id !== sectorId)
        : [...prev.selectedSectors, sectorId]
    }));
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Governança de Usuários ({team.length})</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm font-bold">person_add</span>
                Novo Acesso
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Nome / Portal</th>
                    <th className="px-8 py-4">Alocação</th>
                    <th className="px-8 py-4">Nível</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar} className="size-9 rounded-full object-cover border" alt="" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{member.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1">
                          {member.sectors.map(sId => (
                            <span key={sId} className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold rounded uppercase border border-slate-200">
                              {sectors.find(s => s.id === sId)?.name || sId}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${member.role === UserRole.ADMIN ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {member.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-8">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Logs de Auditoria (Produção)
            </h3>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`size-2 rounded-full ${log.type === 'system' ? 'bg-blue-400' : 'bg-emerald-400'}`}></div>
                    <span className="text-xs font-bold text-slate-600">{log.action}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-8">
            <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-widest">Setores Estratégicos</h3>
            <div className="flex flex-col gap-3 mb-6">
              {sectors.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group border border-slate-100">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{s.name}</span>
                  <button className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddSector} className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs focus:ring-1 focus:ring-primary outline-none"
                placeholder="Novo setor..."
                value={newSectorName}
                onChange={e => setNewSectorName(e.target.value)}
              />
              <button type="submit" className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-all">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </form>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">database</span>
              <h4 className="text-xs font-black text-primary uppercase tracking-widest">Base de Dados</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
              Todas as alterações são gravadas em tempo real no cache persistente e sincronizadas com o banco de dados centralizado da corporação.
            </p>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-bold text-emerald-600 uppercase">Sincronizado</span>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Novo Acesso</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddUser} className="flex flex-col gap-5">
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm" placeholder="Nome Completo" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm" placeholder="E-mail Corporativo" type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setores de Atuação</label>
                <div className="flex flex-wrap gap-2">
                  {sectors.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSectorInUser(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${newUser.selectedSectors.includes(s.id)
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}>
                <option value={UserRole.USER}>Acesso Colaborador</option>
                <option value={UserRole.ADMIN}>Administrador Estratégico</option>
              </select>
              <button type="submit" className="bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary-dark transition-all transform active:scale-95 uppercase text-xs tracking-widest">
                Confirmar e Habilitar Acesso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
