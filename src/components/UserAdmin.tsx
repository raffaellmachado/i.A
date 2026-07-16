import React, { useEffect, useState } from "react";
import { Shield, User as UserIcon, Trash2, ArrowLeft, Users, AlertCircle, Sparkles, UserPlus } from "lucide-react";
import { User } from "../types";

interface UserAdminProps {
  currentUser: User;
  onBack: () => void;
}

export default function UserAdmin({ currentUser, onBack }: UserAdminProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for creating a user
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        headers: {
          "x-user-id": currentUser.id,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao carregar lista de usuários.");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setError("Todos os campos são obrigatórios para cadastrar um novo usuário.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar usuário.");

      setSuccess(`Usuário "${data.name}" cadastrado com sucesso!`);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
      await fetchUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: 'admin' | 'user') => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/users/${targetUserId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao atualizar nível do usuário");

      setSuccess(`Nível do usuário "${data.name}" atualizado para ${newRole === 'admin' ? 'Administrador' : 'Normal'} com sucesso!`);
      await fetchUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!window.confirm("Tem certeza de que deseja excluir este usuário definitivamente?")) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/users/${targetUserId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUser.id,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao excluir usuário.");

      setSuccess("Usuário excluído com sucesso!");
      await fetchUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div id="user-admin-view" className="flex-1 bg-white dark:bg-zinc-900 overflow-y-auto h-screen text-slate-800 dark:text-zinc-100">
      {/* Header Panel */}
      <div id="user-admin-header" className="px-8 py-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-from-admin"
            onClick={onBack}
            className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Administração de Usuários
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Gerencie quem pode criar agentes de IA personalizados ou quem possui acesso de visualização de dados.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        {error && (
          <div id="admin-error-banner" className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div id="admin-success-banner" className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Permissions guidelines */}
        <div className="bg-slate-50/40 dark:bg-zinc-800/30 border border-slate-200/60 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm mb-2">Entendendo as Permissões Operacionais:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
            <div className="bg-white dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex gap-3">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 dark:text-zinc-100 block mb-1">Administrador (Admin)</span>
                Acesso completo ao sistema. Pode conversar com todos os agentes, criar novos agentes de IA, editar instruções operacionais, anexar pastas de dados, e alterar papéis de outros usuários.
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex gap-3">
              <UserIcon className="w-5 h-5 text-slate-500 dark:text-zinc-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 dark:text-zinc-100 block mb-1">Normal (User)</span>
                Acesso apenas para consumo de IA. Pode iniciar conversas, perguntar dados operacionais à IA usando a base de conhecimento anexada, mas é <strong>bloqueado de criar ou editar agentes</strong> de IA.
              </div>
            </div>
          </div>
        </div>

        {/* User Registration Form Card */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-950 dark:text-white text-sm mb-4 flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Cadastrar Novo Usuário
          </h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Nome do Usuário
              </label>
              <input
                id="admin-create-name"
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Ex: Ana Souza"
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                id="admin-create-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Ex: ana@empresa.com"
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <input
                id="admin-create-password"
                type="text"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Senha provisória"
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Nível de Permissão (Role)
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  id="admin-create-role-user"
                  onClick={() => setNewUserRole('user')}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    newUserRole === 'user'
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Normal (User)
                </button>
                <button
                  type="button"
                  id="admin-create-role-admin"
                  onClick={() => setNewUserRole('admin')}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    newUserRole === 'admin'
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin (Criador)
                </button>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                id="admin-create-submit"
                disabled={createLoading}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {createLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserPlus className="w-4.5 h-4.5" />
                    Registrar e Salvar Conta
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Users List Table */}
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50/80 dark:bg-zinc-800/80 px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Lista de Contas Cadastradas</span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{users.length} usuários</span>
          </div>

          {loading && users.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <span>Carregando usuários...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/80 dark:divide-zinc-800">
              {users.map((user) => {
                const isSelf = user.id === currentUser.id;
                return (
                  <div key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        user.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm">{user.name}</span>
                          {isSelf && (
                            <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-zinc-400 block mt-0.5">{user.email}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-1">Criado em: {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {/* Role selection dropdown/buttons */}
                      <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-1 border border-slate-200 dark:border-zinc-700">
                        <button
                          id={`set-user-role-${user.id}`}
                          onClick={() => handleUpdateRole(user.id, 'user')}
                          disabled={isSelf}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                            user.role === 'user'
                              ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 shadow-sm'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300'
                          } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Normal
                        </button>
                        <button
                          id={`set-admin-role-${user.id}`}
                          onClick={() => handleUpdateRole(user.id, 'admin')}
                          disabled={isSelf}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                            user.role === 'admin'
                              ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                              : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                          } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Admin
                        </button>
                      </div>

                      {/* Delete account button */}
                      <button
                        id={`delete-user-btn-${user.id}`}
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isSelf}
                        className={`p-2 bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-900 rounded-xl transition cursor-pointer ${
                          isSelf ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                        title={isSelf ? "Você não pode excluir sua própria conta enquanto logado" : "Excluir conta definitivamente"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
