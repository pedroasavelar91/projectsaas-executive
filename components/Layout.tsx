import React, { useState, useMemo } from 'react';
import { AppView, User, UserRole, Task } from '../types';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  user: User | null;
  tasks?: Task[];
  isSyncing?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView, user, tasks = [], isSyncing = false }) => {
  const isAdmin = user?.role === UserRole.ADMIN;
  const [showNotifications, setShowNotifications] = useState(false);

  // ... (notifications logic)

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // App.tsx auth listener will handle redirection
  };

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Painel', icon: 'dashboard', adminOnly: false },
    { id: AppView.PROJECTS, label: 'Kanban', icon: 'view_kanban', adminOnly: false },
    { id: AppView.TIMELINE, label: 'Cronograma', icon: 'calendar_today', adminOnly: false },
    { id: AppView.TODO, label: 'Minhas Tarefas', icon: 'checklist', adminOnly: false },
    { id: AppView.TEAM_MANAGEMENT, label: 'Corporação', icon: 'corporate_fare', adminOnly: true },
  ];

  const deadlineAlerts = useMemo(() => {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (48 * 60 * 60 * 1000));

    return tasks
      .filter(t => t.status !== 'Concluído')
      .filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate <= twoDaysFromNow && dueDate >= now;
      })
      .map(t => ({
        id: `alert-${t.id}`,
        text: `Prazo vencendo: "${t.title}"`,
        time: "Urgente",
        icon: "warning",
        urgent: true
      }));
  }, [tasks]);

  const staticNotifications = [
    { id: 1, text: "Base de dados sincronizada", time: "Agora", icon: "cloud_done", urgent: false },
  ];

  const allNotifications = [...deadlineAlerts, ...staticNotifications];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <aside className="w-64 flex-shrink-0 border-r border-slate-100 bg-white flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <div className="bg-primary size-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined font-bold">corporate_fare</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-slate-900 text-sm font-extrabold leading-tight tracking-tight">Gerenciamento</h1>
              <h1 className="text-primary text-sm font-extrabold leading-tight tracking-tight">Empresarial</h1>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems
              .filter(item => !item.adminOnly || isAdmin)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${currentView === item.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:bg-surface hover:text-primary'
                    }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-6">
          <button
            onClick={() => setCurrentView(AppView.PROFILE)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${currentView === AppView.PROFILE ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-primary'
              }`}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-sm">Meu Perfil</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-slate-500 hover:bg-red-50 hover:text-red-500"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Sair</span>
          </button>

          <div className="flex items-center gap-3 px-2 py-3 bg-surface rounded-xl border border-slate-100 mt-2">
            <img
              src={user?.avatar || "https://picsum.photos/seed/default/100/100"}
              className="size-10 rounded-full border-2 border-primary/20 object-cover"
              alt="User"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate text-slate-900">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                {user?.role === UserRole.ADMIN ? 'Administrador' : 'Usuário'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-md px-8 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              {navItems.find(i => i.id === currentView)?.label || (currentView === AppView.PROFILE ? 'Meu Perfil' : 'Dashboard')}
            </h2>
            {isSyncing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full animate-pulse">
                <span className="material-symbols-outlined text-[10px] text-emerald-500">sync</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gravando Dados</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-full hover:bg-surface text-slate-400 hover:text-primary transition-colors relative border border-transparent hover:border-slate-200"
              >
                <span className="material-symbols-outlined">notifications</span>
                {allNotifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Notificações</h3>
                    <button className="text-[10px] text-primary font-bold uppercase">Limpar</button>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {allNotifications.length === 0 ? (
                      <p className="text-center py-4 text-xs text-slate-400 font-medium">Nenhuma notificação no momento.</p>
                    ) : (
                      allNotifications.map((n, i) => (
                        <div key={i} className={`flex gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer ${n.urgent ? 'bg-orange-50/50' : ''}`}>
                          <div className={`p-2 rounded-lg ${n.urgent ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                            <span className="material-symbols-outlined text-sm">{n.icon}</span>
                          </div>
                          <div className="flex-1 flex flex-col">
                            <p className={`text-xs font-semibold ${n.urgent ? 'text-primary' : 'text-slate-700'}`}>{n.text}</p>
                            <span className="text-[10px] text-slate-400 mt-0.5">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
