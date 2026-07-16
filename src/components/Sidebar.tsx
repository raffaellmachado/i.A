import React from "react";
import { MessageSquare, Plus, Bot, Trash2, Sparkles, FolderOpen, FileText, LogOut, Shield, User as UserIcon, Users, Sun, Moon } from "lucide-react";
import { Chat, AIAgent, User } from "../types";
import ExtracttaLogo from "./ExtracttaLogo";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
  agents: AIAgent[];
  activeView: 'chat' | 'create-agent' | 'user-admin';
  onSwitchToCreateAgent: (agentToEdit?: AIAgent) => void;
  onDeleteAgent: (agentId: string) => void;
  onSelectAgentForNewChat: (agentId: string) => void;
  selectedAgentIdForNewChat: string;
  currentUser: User;
  onLogout: () => void;
  onSwitchToUserAdmin: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  agents,
  activeView,
  onSwitchToCreateAgent,
  onDeleteAgent,
  onSelectAgentForNewChat,
  selectedAgentIdForNewChat,
  currentUser,
  onLogout,
  onSwitchToUserAdmin,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const isAdmin = currentUser.role === 'admin';

  return (
    <aside id="sidebar-container" className="w-80 border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex flex-col h-screen text-slate-800 dark:text-zinc-200 transition-colors duration-200">
      
      {/* Brand Header */}
      <div id="sidebar-header" className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ExtracttaLogo size="sm" />
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Theme Toggle Button */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleTheme}
            className="p-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl transition cursor-pointer"
            title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick Access to Users Admin for Administrators */}
          {isAdmin && (
            <button
              id="btn-switch-user-admin"
              onClick={onSwitchToUserAdmin}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                activeView === 'user-admin'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400'
                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300'
              }`}
              title="Administração de Usuários"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* User Session Info Header */}
      <div id="sidebar-user-session" className="px-5 py-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {currentUser.role === 'admin' ? (
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg" title="Administrador">
              <Shield className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="p-1.5 bg-slate-600 text-white rounded-lg" title="Usuário Comum">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="truncate text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[9px] font-bold tracking-wider text-slate-500 dark:text-zinc-400 uppercase mt-0.5">
              {currentUser.role === 'admin' ? "ADMINISTRADOR" : "USUÁRIO NORMAL"}
            </p>
          </div>
        </div>

        <button
          id="btn-sidebar-logout"
          onClick={onLogout}
          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 border border-transparent hover:border-red-200 dark:hover:border-red-900 rounded-lg transition shrink-0 cursor-pointer"
          title="Deslogar e Sair"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Select Agent for Quick Chat */}
      <div id="agent-quick-select" className="px-5 pt-4 pb-1">
        <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 text-left">
          Agente Ativo para Nova Conversa
        </label>
        <select
          id="select-agent-new-chat"
          value={selectedAgentIdForNewChat}
          onChange={(e) => onSelectAgentForNewChat(e.target.value)}
          className="w-full px-3 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.model === "gemini-3.5-flash" ? "Flash" : "Pro"})
            </option>
          ))}
        </select>
      </div>

      {/* Primary Action Buttons */}
      <div id="sidebar-primary-actions" className="p-4 space-y-2 border-b border-slate-200 dark:border-zinc-800">
        <button
          id="btn-new-chat"
          onClick={onNewChat}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Conversa
        </button>

        {isAdmin ? (
          <button
            id="btn-create-agent-view"
            onClick={() => onSwitchToCreateAgent()}
            className={`w-full py-2.5 px-4 border text-slate-700 dark:text-zinc-300 font-medium text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeView === 'create-agent'
                ? 'bg-slate-200 border-slate-300 dark:bg-zinc-800 dark:border-zinc-700'
                : 'bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 shadow-sm'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Criar Novo Agente
          </button>
        ) : (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed text-center">
            🔒 Criação e edição de agentes são restritas aos Administradores do sistema.
          </div>
        )}
      </div>

      {/* Conversas Recentes / Chat History */}
      <div id="chats-history-section" className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Histórico de Conversas
          </h3>
          {chats.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-400 dark:text-zinc-500 italic">
              Nenhuma conversa recente.
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => {
                const chatAgent = agents.find((a) => a.id === chat.agentId);
                const isActive = activeView === 'chat' && activeChatId === chat.id;
                return (
                  <div
                    key={chat.id}
                    id={`chat-item-${chat.id}`}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden w-full mr-2">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500"}`} />
                      <div className="truncate flex flex-col text-left">
                        <span className="truncate">{chat.title}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal truncate">
                          {chatAgent ? chatAgent.name : "Agente de IA"}
                        </span>
                      </div>
                    </div>
                    <button
                      id={`delete-chat-${chat.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded transition duration-150 cursor-pointer"
                      title="Excluir conversa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gerenciamento de Agentes (List to Edit/View) */}
        <div>
          <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            {isAdmin ? "Gerenciar Seus Agentes" : "Agentes Disponíveis"}
          </h3>
          <div className="space-y-1">
            {agents.map((agent) => (
              <div
                key={agent.id}
                id={`agent-item-${agent.id}`}
                className="group flex items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                onClick={() => {
                  if (isAdmin) {
                    onSwitchToCreateAgent(agent);
                  }
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                  <div className="truncate flex flex-col text-left">
                    <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">{agent.name}</span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal truncate">
                      {agent.model === "gemini-3.5-flash" ? "Gemini Flash" : "Gemini Pro"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {agent.knowledgeFiles.length > 0 && (
                    <span className="text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0" title="Possui Base de Conhecimento">
                      <FileText className="w-2.5 h-2.5" />
                      {agent.knowledgeFiles.length}
                    </span>
                  )}
                  {isAdmin ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer">
                        Editar
                      </span>
                      <button
                        id={`delete-agent-${agent.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAgent(agent.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded transition duration-150 cursor-pointer"
                        title="Excluir Agente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500">Ativo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Status Panel */}
      <div id="sidebar-footer" className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
          <span>STATUS DA API</span>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
            <span>PRONTO</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-800 rounded-lg p-2 border border-slate-200 dark:border-zinc-700">
          Olá, <span className="font-bold text-slate-700 dark:text-zinc-200">{currentUser.name}</span>! Você está rodando no modo de acesso <span className="font-semibold text-slate-700 dark:text-zinc-200">{currentUser.role === 'admin' ? "Administrador" : "Normal"}</span>.
        </div>
      </div>
    </aside>
  );
}
