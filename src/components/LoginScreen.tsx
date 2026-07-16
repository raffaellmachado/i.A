import React, { useState } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { User } from "../types";
import ExtracttaLogo from "./ExtracttaLogo";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("E-mail e senha são obrigatórios.");
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "E-mail ou senha inválidos.");

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-screen w-screen h-screen flex items-center justify-center bg-slate-100 p-4">
      <div id="login-card" className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col p-8 relative">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>

        {/* Brand */}
        <div id="login-brand" className="text-center mb-8 mt-2">
          <ExtracttaLogo size="lg" className="justify-center mb-2" />
          <h2 className="text-lg font-bold text-slate-700 dark:text-zinc-300 tracking-tight mt-1">Agent Studio</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plataforma de Agentes de IA Customizados</p>
        </div>

        {/* Informational Hint Badge */}
        <div id="login-info-hint" className="mb-6 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800 block mb-1">
            💡 Acesso Inteligente por E-mail:
          </span>
          Seu papel é atribuído automaticamente: e-mails com <span className="font-semibold text-indigo-600">"admin"</span> no nome ou o e-mail do proprietário entram como <span className="font-semibold text-indigo-600">Administrador</span> (com permissão para criar e gerenciar agentes). Outros e-mails entram como <span className="font-semibold text-slate-700">Normal</span> (apenas conversam).
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-col gap-1 text-[11px] text-slate-400">
            <div>• Exemplo Admin: <span className="font-mono text-slate-600 select-all">admin@gemini.com</span> (senha: admin)</div>
            <div>• Exemplo Normal: <span className="font-mono text-slate-600 select-all">user@gemini.com</span> (senha: user)</div>
          </div>
        </div>

        {/* Forms feedback */}
        {error && (
          <div id="login-error" className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              E-mail de Acesso
            </label>
            <input
              id="login-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <input
              id="login-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha de acesso"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              required
            />
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar na Plataforma
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
