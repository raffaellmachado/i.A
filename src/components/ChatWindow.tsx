import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, FileText, Sparkles, AlertCircle, HelpCircle, User, MessageSquare, ArrowRight } from "lucide-react";
import { Chat, AIAgent, Message } from "../types";
import ExtracttaLogo from "./ExtracttaLogo";

interface ChatWindowProps {
  activeChat: Chat | null;
  agents: AIAgent[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  onNewChatWithAgent: (agentId: string) => void;
}

// Simple regex-based markdown-like formatter to support nice headers, bold, code blocks, lists, and tables!
function formatMessageText(text: string) {
  if (!text) return "";

  // Split into paragraphs/lines
  const lines = text.split("\n");
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const elements = lines.map((line, idx) => {
    // Handle code block toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const code = codeBlockContent.join("\n");
        codeBlockContent = [];
        return (
          <pre key={idx} className="bg-slate-900 dark:bg-black text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto my-3 border border-slate-800 shadow-inner">
            <code>{code}</code>
          </pre>
        );
      } else {
        inCodeBlock = true;
        return null;
      }
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return null;
    }

    // Handle lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = line.trim().substring(2);
      return (
        <li key={idx} className="ml-5 list-disc text-sm leading-relaxed text-slate-700 dark:text-slate-300 my-1">
          {parseInlineFormatting(content)}
        </li>
      );
    }

    // Handle numbered lists
    if (/^\d+\.\s/.test(line.trim())) {
      const content = line.trim().replace(/^\d+\.\s/, "");
      return (
        <li key={idx} className="ml-5 list-decimal text-sm leading-relaxed text-slate-700 dark:text-slate-300 my-1">
          {parseInlineFormatting(content)}
        </li>
      );
    }

    // Handle Blockquotes
    if (line.trim().startsWith("> ")) {
      const content = line.trim().substring(2);
      return (
        <blockquote key={idx} className="border-l-4 border-indigo-500 bg-slate-50 dark:bg-slate-800/50 pl-4 py-1.5 pr-2 my-2 rounded-r-lg text-sm text-slate-600 dark:text-slate-400 italic">
          {parseInlineFormatting(content)}
        </blockquote>
      );
    }

    // Handle headers
    if (line.trim().startsWith("#")) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const content = line.replace(/^#+\s*/, "");
      const sizeClass = level === 1 ? "text-xl font-bold mt-4 mb-2 text-slate-900 dark:text-white" : level === 2 ? "text-lg font-bold mt-3 mb-1.5 text-slate-900 dark:text-white" : "text-sm font-bold mt-2 mb-1 text-slate-800 dark:text-slate-100";
      return (
        <h4 key={idx} className={`${sizeClass} tracking-tight`}>
          {parseInlineFormatting(content)}
        </h4>
      );
    }

    // Empty lines
    if (line.trim() === "") {
      return <div key={idx} className="h-2"></div>;
    }

    // Standard paragraph
    return (
      <p key={idx} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 my-1.5">
        {parseInlineFormatting(line)}
      </p>
    );
  });

  return <div className="space-y-1">{elements.filter(el => el !== null)}</div>;
}

// Sub-helper to parse Bold `**text**` and Inline Code `` `code` ``
function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex pattern to extract bold (**), italic (*), and inline code (`)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index} className="italic text-slate-800 dark:text-slate-200">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100 font-mono text-xs rounded border border-slate-200 dark:border-zinc-700">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function ChatWindow({
  activeChat,
  agents,
  onSendMessage,
  isSending,
  onNewChatWithAgent,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeAgent = activeChat ? agents.find((a) => a.id === activeChat.agentId) : null;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, isSending]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isSending) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Welcome State: when no chat is open
  if (!activeChat) {
    return (
      <div id="welcome-chat-view" className="flex-1 bg-white dark:bg-zinc-900 flex flex-col justify-between h-screen overflow-y-auto text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center text-center">
          
          {/* Logo Brand Animation */}
          <div id="welcome-logo" className="flex justify-center mb-8">
            <ExtracttaLogo size="xl" />
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-4xl">
            Crie seu Universo de Agentes de IA
          </h2>
          <p className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Selecione um dos agentes operacionais abaixo para iniciar uma nova conversa personalizada ou crie um novo agente no menu esquerdo para ingerir seus próprios dados!
          </p>

          {/* Grid of Agents to start Chat */}
          <div id="welcome-agents-grid" className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 text-left max-w-3xl mx-auto">
            {agents.map((agent) => (
              <div
                key={agent.id}
                id={`welcome-agent-card-${agent.id}`}
                onClick={() => onNewChatWithAgent(agent.id)}
                className="group border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-5 rounded-2xl shadow-sm hover:shadow transition duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{agent.name}</span>
                    </div>
                    {agent.model === "gemini-3.5-flash" ? (
                      <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full shrink-0">
                        GRATUITO
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">
                        AVANÇADO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed truncate-2-lines mb-3">
                    {agent.description || "Nenhuma descrição fornecida."}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                    <FileText className="w-3 h-3" />
                    <span>
                      {agent.knowledgeFiles.length === 1
                        ? "1 doc de conhecimento"
                        : `${agent.knowledgeFiles.length} docs de conhecimento`}
                    </span>
                  </div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform duration-150">
                    Conversar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Guide */}
          <div className="mt-12 p-5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto flex items-start gap-3 text-left">
            <HelpCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Como Inserir Base de Dados no Agente?</span>
              Basta clicar em <strong>"Criar Novo Agente"</strong> no menu esquerdo (ou clicar em <strong>"Editar"</strong> em qualquer um da lista) e usar o botão de <strong>"Selecionar Pasta"</strong> para escolher um diretório no seu computador contendo seus relatórios ou dados em formato de texto (.txt, .md, .csv). O agente consumirá esses arquivos como inteligência integrada!
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 text-center text-[10px] text-slate-400 dark:text-zinc-500">
          Gemini Agent Studio v1.0 • Desenvolvido com express-backend e react-frontend
        </div>
      </div>
    );
  }

  // Active Chat State: when a chat conversation is selected
  return (
    <div id="active-chat-view" className="flex-1 bg-white dark:bg-zinc-900 flex flex-col justify-between h-screen relative text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Active Chat Header */}
      <div id="chat-header" className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden mr-4">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="truncate text-left">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate leading-tight">
              {activeChat.title}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate font-medium flex items-center gap-1.5">
              <span>Agente: <strong className="text-slate-600 dark:text-slate-300">{activeAgent ? activeAgent.name : "IA Desconhecida"}</strong></span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span>Modelo: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{activeAgent ? activeAgent.model : "gemini-3.5-flash"}</strong></span>
            </p>
          </div>
        </div>

        {/* Display Knowledge base summary if available */}
        {activeAgent && activeAgent.knowledgeFiles && activeAgent.knowledgeFiles.length > 0 && (
          <div id="knowledge-badge-summary" className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>{activeAgent.knowledgeFiles.length} documento(s) de conhecimento ativos</span>
          </div>
        )}
      </div>

      {/* Messages Stream Area */}
      <div id="messages-container" className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/20 dark:bg-slate-900/10">
        
        {/* AI Agent System Instruction Welcome Message */}
        <div className="flex gap-4 max-w-3xl mr-auto">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 shrink-0">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/50 dark:border-zinc-700/50 rounded-2xl rounded-tl-none px-4 py-3 shadow-inner">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase mb-1">Mensagem do Sistema</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
              Iniciando sessão com o agente "{activeAgent?.name}". Instruções de comportamento e base operacional configuradas. Envie um prompt para iniciar.
            </p>
            {activeAgent && activeAgent.knowledgeFiles && activeAgent.knowledgeFiles.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px] text-slate-500 dark:text-slate-400">
                📚 <strong>Pasta de Conhecimento Ativa:</strong> {activeAgent.knowledgeFiles.map(f => f.name).join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Conversation Message List */}
        {activeChat.messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              id={`message-bubble-${message.id}`}
              className={`flex gap-4 max-w-4xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${
                  isUser
                    ? "bg-slate-800 dark:bg-indigo-600"
                    : "bg-indigo-600 dark:bg-slate-800 border dark:border-slate-700"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-1 ml-1">
                  {isUser ? "Você" : activeAgent ? activeAgent.name : "Agente IA"}
                </span>
                <div
                  className={`rounded-2xl px-5 py-3.5 shadow-sm border ${
                    isUser
                      ? "bg-slate-800 dark:bg-indigo-650 text-white border-slate-700 dark:border-indigo-600 rounded-tr-none"
                      : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 border-slate-200/70 dark:border-zinc-700 rounded-tl-none"
                  }`}
                >
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    {formatMessageText(message.text)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loader Indicator when generating response */}
        {isSending && (
          <div id="ai-loading-bubble" className="flex gap-4 max-w-2xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-zinc-800 border dark:border-zinc-700 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mb-1 ml-1">
                {activeAgent ? activeAgent.name : "Agente IA"} está respondendo
              </span>
              <div className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-zinc-700 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-400 italic">Analisando base de conhecimento e consultando Gemini...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Box Panel */}
      <div id="prompt-input-panel" className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
          <textarea
            id="textarea-prompt-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Envie uma mensagem para o agente "${activeAgent?.name}"... (Pressione Enter para enviar)`}
            rows={2}
            className="w-full pl-4 pr-16 py-3 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 resize-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            disabled={isSending}
          />
          <button
            type="submit"
            id="btn-send-prompt"
            disabled={!inputText.trim() || isSending}
            className={`absolute right-3 top-3 p-3 rounded-xl transition shadow-sm ${
              inputText.trim() && !isSending
                ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
            }`}
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2.5">
          Os dados de conhecimento anexados ao agente são processados no servidor de forma segura e não expõem suas informações.
        </p>
      </div>

    </div>
  );
}
