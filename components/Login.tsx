
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
  onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      onLogin(); // App.tsx will detect session change, but this callback can be used for UI transition if needed
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col lg:flex-row bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between p-16 bg-mesh-orange overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="z-10 flex items-center gap-3">
          <div className="size-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined font-bold text-2xl">corporate_fare</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Gerenciamento <span className="text-primary">Empresarial</span></h2>
        </div>

        <div className="z-10 max-w-md">
          <h1 className="text-5xl font-black leading-tight mb-6 text-white">
            Excelência operacional em cada <span className="text-primary italic">detalhe</span> estratégico.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Potencialize a governança do seu negócio com ferramentas integradas de alta performance e dashboards em tempo real.
          </p>
        </div>

        {/* Professional Business Background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <img
            alt="Business Professional"
            className="w-full h-full object-cover mix-blend-overlay"
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
          />
        </div>

        <div className="z-10 flex items-center gap-4 text-xs font-medium uppercase tracking-widest text-slate-400">
          <span className="w-8 h-[2px] bg-primary"></span>
          Sistema de Gestão de Alta Performance
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-24 bg-white">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="lg:hidden flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-4xl">corporate_fare</span>
              <h2 className="text-2xl font-extrabold text-slate-800">Gerenciamento Empresarial</h2>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">Portal do Colaborador</h2>
            <p className="text-slate-500">Acesse suas diretrizes e projetos corporativos.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 flex items-center gap-2">
                <span className="material-symbols-outlined icon-filled">error</span>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Usuário / E-mail</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">person</span>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="Seu e-mail corporativo"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                >
                  Recuperar acesso
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" type="button">visibility</button>
              </div>
            </div>

            <button
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-primary py-4 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary-dark uppercase tracking-wide disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              type="submit"
            >
              {loading ? (
                <>
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Autenticando...
                </>
              ) : 'AUTENTICAR NO PORTAL'}
            </button>
          </form>

          <footer className="mt-auto flex flex-col items-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex gap-6">
              <a className="hover:text-primary transition-colors" href="#">Suporte Corporativo</a>
              <a className="hover:text-primary transition-colors" href="#">Privacidade</a>
            </div>
            <p>© 2024 Gerenciamento Empresarial. Todos os direitos reservados.</p>
            <p className="text-slate-300">v1.2.0 • Production</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
