
import React, { useState } from 'react';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onUpdate: (name: string, avatar: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaved, setIsSaved] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setPassError('As senhas não coincidem.');
      return;
    }
    setPassError('');
    onUpdate(name, avatar);
    setIsSaved(true);
    setPassword('');
    setConfirmPassword('');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-[600px] mx-auto w-full">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="bg-mesh-orange h-32 relative">
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full">
            <div className="relative group">
              <img src={avatar} className="size-24 rounded-full object-cover border-4 border-white shadow-lg" alt="" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <span className="material-symbols-outlined">edit</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        </div>
        
        <div className="pt-16 p-8 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
              <p className="text-slate-500 font-medium">{user.role} • {user.corporation}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome de Exibição</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3 px-4 text-sm text-slate-400 outline-none cursor-not-allowed"
                  value={user.email}
                  readOnly
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">lock</span>
                Alterar Senha
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                  <input 
                    type="password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Deixe em branco para manter a atual"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                  <input 
                    type="password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                {passError && <p className="text-xs text-red-500 font-bold ml-1">{passError}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button 
                type="submit"
                className="bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95"
              >
                Salvar Perfil
              </button>
              {isSaved && (
                <span className="text-emerald-500 text-sm font-bold flex items-center gap-1 animate-in fade-in">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Atualizado com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
