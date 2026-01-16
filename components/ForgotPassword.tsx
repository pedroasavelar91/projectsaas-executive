
import React, { useState } from 'react';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-3xl font-bold">lock_reset</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Recuperar Senha</h2>
          <p className="text-slate-500 text-sm">Insira seu e-mail corporativo para receber as instruções de redefinição.</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">E-mail corporativo</label>
              <input 
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                placeholder="nome@empresa.com.br" 
                type="email"
                required
              />
            </div>
            <button className="w-full rounded-lg bg-primary py-4 text-sm font-extrabold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all" type="submit">
              ENVIAR LINK DE RECUPERAÇÃO
            </button>
          </form>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex flex-col items-center text-center gap-3">
            <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
            <p className="text-emerald-700 text-sm font-medium">Link enviado com sucesso! Verifique sua caixa de entrada (e a pasta de spam).</p>
          </div>
        )}

        <button 
          onClick={onBack}
          className="flex items-center justify-center gap-2 text-slate-500 hover:text-primary font-bold text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voltar para o Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
