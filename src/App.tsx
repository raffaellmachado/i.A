import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import AgentForm from "./components/AgentForm";
import LoginScreen from "./components/LoginScreen";
import UserAdmin from "./components/UserAdmin";
import { Chat, AIAgent, User } from "./types";
import { AlertCircle } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'create-agent' | 'user-admin'>('chat');
  const [agentToEdit, setAgentToEdit] = useState<AIAgent | null>(null);
  const [selectedAgentIdForNewChat, setSelectedAgentIdForNewChat] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem("gemini_studio_theme");
    return saved === "dark" ? "dark" : "light";
  });

  // Sync theme with document class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("gemini_studio_theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Restore user session on mount
  useEffect(() => {
    const saved = localStorage.getItem("gemini_user_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
      } catch (err) {
        console.error("Falha ao restaurar sessão:", err);
      }
    }
  }, []);

  // Fetch initial data once user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchAgents();
      fetchChats();
    }
  }, [currentUser]);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Falha ao carregar agentes");
      const data = await res.json();
      setAgents(data);
      if (data.length > 0 && !selectedAgentIdForNewChat) {
        setSelectedAgentIdForNewChat(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro ao se conectar com o servidor. Verifique se o backend está ativo.");
    }
  };

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error("Falha ao carregar histórico de conversas");
      const data = await res.json();
      // Sort chats newest first
      setChats(data.sort((a: Chat, b: Chat) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("gemini_user_session", JSON.stringify(user));
    setError(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("gemini_user_session");
    setActiveChatId(null);
    setActiveView('chat');
    setAgentToEdit(null);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveView('chat');
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        if (activeChatId === chatId) {
          setActiveChatId(null);
        }
        await fetchChats();
      }
    } catch (err) {
      console.error("Erro excluindo conversa:", err);
    }
  };

  const handleNewChat = async () => {
    if (!selectedAgentIdForNewChat && agents.length > 0) {
      setSelectedAgentIdForNewChat(agents[0].id);
    }

    const agentId = selectedAgentIdForNewChat || (agents.length > 0 ? agents[0].id : null);
    if (!agentId) {
      setError("Crie pelo menos um Agente de IA para iniciar uma conversa.");
      return;
    }

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (res.ok) {
        const newChat = await res.json();
        await fetchChats();
        setActiveChatId(newChat.id);
        setActiveView('chat');
        setError(null);
      }
    } catch (err) {
      console.error("Erro criando nova conversa:", err);
    }
  };

  const handleNewChatWithAgent = async (agentId: string) => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (res.ok) {
        const newChat = await res.json();
        await fetchChats();
        setActiveChatId(newChat.id);
        setActiveView('chat');
        setError(null);
      }
    } catch (err) {
      console.error("Erro criando nova conversa com o agente:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId) return;

    // Optimistically add user's message immediately
    const tempUserId = `msg-${Date.now()}-user-temp`;
    const tempUserMsg = {
      id: tempUserId,
      role: "user" as const,
      text,
      createdAt: new Date().toISOString()
    };

    setChats(prevChats => 
      prevChats.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, tempUserMsg]
          };
        }
        return chat;
      })
    );

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Falha ao enviar mensagem");
      }

      await fetchChats();
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      setError(`Erro ao responder: ${err.message || err}`);
      // Revert the optimistic message if it failed
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: chat.messages.filter(m => m.id !== tempUserId)
            };
          }
          return chat;
        })
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (currentUser?.role !== 'admin') {
      setError("Apenas administradores podem excluir agentes.");
      return;
    }

    if (agents.length <= 1) {
      setError("Não é possível excluir o único agente de IA ativo no sistema. Crie outro primeiro.");
      return;
    }

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUser.id
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Falha ao excluir agente");
      }

      await fetchAgents();
      // If we deleted the agent that was selected for new chats, select another one
      if (selectedAgentIdForNewChat === agentId) {
        const remainingAgents = agents.filter(a => a.id !== agentId);
        if (remainingAgents.length > 0) {
          setSelectedAgentIdForNewChat(remainingAgents[0].id);
        } else {
          setSelectedAgentIdForNewChat("");
        }
      }
      setError(null);
    } catch (err: any) {
      console.error("Erro excluindo agente:", err);
      setError(`Erro ao excluir agente: ${err.message || err}`);
    }
  };

  const handleSwitchToCreateAgent = (agent?: AIAgent) => {
    if (currentUser?.role !== 'admin') {
      setError("Apenas administradores podem criar ou editar agentes.");
      return;
    }
    setAgentToEdit(agent || null);
    setActiveView('create-agent');
  };

  const handleSaveAgent = async (agentData: Partial<AIAgent>) => {
    if (!currentUser) {
      setError("Sessão inválida. Por favor, faça login novamente.");
      return;
    }

    try {
      let res;
      if (agentData.id) {
        // Edit Mode
        res = await fetch(`/api/agents/${agentData.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "x-user-id": currentUser.id
          },
          body: JSON.stringify(agentData),
        });
      } else {
        // Create Mode
        res = await fetch("/api/agents", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-user-id": currentUser.id
          },
          body: JSON.stringify(agentData),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Falha ao salvar agente de IA no servidor");
      }

      const savedAgent = await res.json();
      await fetchAgents();
      
      // Auto-select the newly created or edited agent for future conversations
      setSelectedAgentIdForNewChat(savedAgent.id);
      setActiveView('chat');
      setAgentToEdit(null);
      setError(null);
    } catch (err: any) {
      console.error("Erro salvando agente:", err);
      throw err;
    }
  };

  // Render Login screen if not authenticated
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  return (
    <div id="app-root-container" className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 font-sans text-slate-800 dark:text-zinc-100 antialiased transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        agents={agents}
        activeView={activeView}
        onSwitchToCreateAgent={handleSwitchToCreateAgent}
        onDeleteAgent={handleDeleteAgent}
        onSelectAgentForNewChat={setSelectedAgentIdForNewChat}
        selectedAgentIdForNewChat={selectedAgentIdForNewChat}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchToUserAdmin={() => setActiveView('user-admin')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Panel Area */}
      <main id="main-content-panel" className="flex-1 flex flex-col h-screen overflow-hidden relative bg-white dark:bg-zinc-900 transition-colors duration-200">
        {error && (
          <div id="global-error-toast" className="absolute top-4 left-4 right-4 z-50 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex items-center justify-between shadow-lg max-w-xl mx-auto animate-bounce-short">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              id="btn-close-error"
              onClick={() => setError(null)}
              className="text-xs font-semibold text-red-600 hover:underline shrink-0 ml-4 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {activeView === 'chat' && (
          <ChatWindow
            activeChat={activeChat}
            agents={agents}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            onNewChatWithAgent={handleNewChatWithAgent}
          />
        )}

        {activeView === 'create-agent' && (
          <AgentForm
            agentToEdit={agentToEdit}
            onSaveAgent={handleSaveAgent}
            onCancel={() => {
              setActiveView('chat');
              setAgentToEdit(null);
            }}
          />
        )}

        {activeView === 'user-admin' && (
          <UserAdmin
            currentUser={currentUser}
            onBack={() => setActiveView('chat')}
          />
        )}
      </main>
    </div>
  );
}
