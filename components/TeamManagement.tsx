
import React, { useState } from 'react';
import { User, UserRole, Sector } from '../types';
import { api } from '../lib/api';

interface TeamManagementProps {
  sectors: Sector[];
  onUpdateSectors: (sectors: Sector[]) => void;
  onDeleteSector: (sectorId: string) => void;
  team: User[];
  onUpdateTeam: (team: User[]) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ sectors, onUpdateSectors, onDeleteSector, team, onUpdateTeam }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null); // New state for editing
  const [newSectorName, setNewSectorName] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.USER, selectedSectors: [] as string[] });

  // Add state for current user/corp - assuming first user is representative of context or handled by parent
  const [corporationName, setCorporationName] = useState(team[0]?.corporation || 'Minha Corporação');
  const [isEditingCorp, setIsEditingCorp] = useState(false);

  // Handlers
  const handleUpdateCorpName = async () => {
    if (!corporationName.trim()) return;
    try {
      const adminId = team.find(u => u.role === UserRole.ADMIN)?.id;
      if (adminId) {
        await api.team.updateCorporationName(corporationName, adminId);
        setIsEditingCorp(false);
        onUpdateTeam(team.map(u => u.id === adminId ? { ...u, corporation: corporationName } : u));
      }
    } catch (e) {
      console.error("Failed to update corp name", e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    try {
      await api.team.delete(userId);
      onUpdateTeam(team.filter(u => u.id !== userId));
    } catch (e) {
      console.error("Failed to delete user", e);
      alert("Erro ao excluir usuário.");
    }
  };

  const handleEditUser = (user: User) => {
    setNewUser({
      name: user.name,
      email: user.email,
      password: '', // Password not editable here
      role: user.role,
      selectedSectors: user.sectors
    });
    setEditingUserId(user.id);
    setShowAddModal(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUserId) {
      // Update Logic
      try {
        await api.team.update(editingUserId, {
          name: newUser.name,
          role: newUser.role as UserRole,
          sectors: newUser.selectedSectors
        });
        alert("Usuário atualizado com sucesso!");
        onUpdateTeam(team.map(u => u.id === editingUserId ? { ...u, name: newUser.name, role: newUser.role as UserRole, sectors: newUser.selectedSectors } : u));
        setShowAddModal(false);
        setEditingUserId(null);
        setNewUser({ name: '', email: '', password: '', role: UserRole.USER, selectedSectors: [] });
      } catch (e) {
        console.error(e);
        alert("Erro ao atualizar usuário.");
      }
      return;
    }

    if (!newUser.password || newUser.password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      // Call create instead of invite
      await api.team.create(newUser, corporationName);

      alert(`Usuário criado com sucesso!\n\nCredenciais de Acesso:\nE-mail: ${newUser.email}\nSenha: ${newUser.password}`);

      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: UserRole.USER, selectedSectors: [] });

      // Optimistic Update (Temporary until refresh)
      const tempUser: User = {
        id: 'temp-' + Date.now(),
        name: newUser.name || newUser.email.split('@')[0],
        email: newUser.email,
        role: newUser.role as UserRole,
        avatar: '',
        joinedAt: new Date().toLocaleDateString(),
        corporation: corporationName,
        sectors: newUser.selectedSectors,
        status: 'APPROVED' // Enforced as approved since created by admin
      };
      onUpdateTeam([...team, tempUser]);

    } catch (e: any) {
      console.error("Create user failed", e);
      alert("Erro ao criar usuário: " + (e.message || "Verifique se o email já existe."));
    }
  };

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;
    const updatedSectors = [...sectors, {
      id: 's' + (sectors.length + 1) + '-' + Date.now(), // Better ID uniqueness
      name: newSectorName,
      corporation: corporationName // CRITICAL: Pass corporation
    }];
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
      {/* Header with Corp Name Edit */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {isEditingCorp ? (
            <div className="flex items-center gap-2">
              <input
                value={corporationName}
                onChange={e => setCorporationName(e.target.value)}
                className="text-2xl font-black text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1"
              />
              <button onClick={handleUpdateCorpName} className="text-green-600 hover:text-green-700 font-bold text-sm">SALVAR</button>
            </div>
          ) : (
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{corporationName}</h2>
          )}
          <button onClick={() => setIsEditingCorp(!isEditingCorp)} className="text-slate-400 hover:text-primary">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
      </div>

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
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar || 'https://i.pravatar.cc/150'} className="size-9 rounded-full object-cover border" alt="" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{member.name || 'Usuário'}</span>
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
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleEditUser(member)}
                          className="text-slate-300 hover:text-primary transition-colors mr-2"
                          title="Editar Usuário"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          title="Remover Usuário"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <button
                    onClick={() => onDeleteSector(s.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
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
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6 scale-in-center">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">{editingUserId ? 'Editar Usuário' : 'Novo Acesso'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingUserId(null); }} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddUser} className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Nome Completo (Opcional)" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50" placeholder="E-mail Corporativo" type="email" required disabled={!!editingUserId} value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                {!editingUserId && (
                  <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Senha de Acesso (Min. 6 caracteres)" type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} minLength={6} />
                )}
              </div>

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

              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}>
                <option value={UserRole.USER}>Acesso Colaborador</option>
                <option value={UserRole.ADMIN}>Administrador Estratégico</option>
              </select>
              <button type="submit" className="bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary-dark transition-all transform active:scale-95 uppercase text-xs tracking-widest">
                {editingUserId ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
