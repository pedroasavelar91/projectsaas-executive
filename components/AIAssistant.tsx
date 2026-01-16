
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou seu assistente de Gerenciamento Empresarial. Como posso auxiliar na sua produtividade hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Always use the named parameter for apiKey and obtain it from process.env.API_KEY.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: 'Você é um assistente de Gerenciamento Empresarial especializado em governança, eficiência corporativa e análise de performance. Forneça respostas executivas, precisas e profissionais.',
          temperature: 0.7,
        }
      });

      // Directly access .text property, do not call as a method.
      const aiText = response.text || 'Desculpe, não consegui processar sua solicitação agora.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA central. Verifique sua conexão.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-none text-sm">IA Empresarial</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1">Conectado ao Sistema</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-primary text-white font-medium rounded-tr-none shadow-md' 
                : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none animate-pulse">
              <div className="flex gap-1.5">
                <div className="size-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="size-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                <div className="size-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-100">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Solicite uma análise ou relatório..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all placeholder:text-slate-400"
            rows={2}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-3 bottom-3 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
