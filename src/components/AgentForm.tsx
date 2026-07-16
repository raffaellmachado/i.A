import React, { useState, useEffect, useRef } from "react";
import { Bot, Save, FileText, FolderOpen, Trash2, ArrowLeft, Sliders, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { AIAgent, KnowledgeFile, SUPPORTED_MODELS } from "../types";

interface AgentFormProps {
  agentToEdit: AIAgent | null;
  onSaveAgent: (agentData: Partial<AIAgent>) => Promise<void>;
  onCancel: () => void;
}

const TEMPLATES = [
  {
    label: "Assistente Geral Focado",
    desc: "Para responder perguntas gerais de forma curta e precisa.",
    instruction: "Você é um assistente geral focado em produtividade. Suas respostas devem ser precisas, diretas ao ponto e sempre formatadas com markdown legível. Evite floreios desnecessários.",
    temp: 0.5,
  },
  {
    label: "Especialista em Suporte Técnico",
    desc: "Para instruir usuários passo a passo com paciência.",
    instruction: "Você é o Técnico de Suporte de TI. Seu papel é explicar conceitos complexos de tecnologia de forma simples, paciente e didática. Use metáforas e forneça guias passo a passo.",
    temp: 0.3,
  },
  {
    label: "Criativo de Marketing & Copywriting",
    desc: "Para gerar ideias de campanhas e textos persuasivos.",
    instruction: "Você é um Copywriter e Diretor de Criação de Marketing altamente experiente. Crie textos persuasivos, títulos chamativos, e-mails de conversão e posts sociais com ganchos fortes.",
    temp: 0.9,
  },
];

export default function AgentForm({ agentToEdit, onSaveAgent, onCancel }: AgentFormProps) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("gemini-3.5-flash");
  const [description, setDescription] = useState("");
  const [systemInstruction, setSystemInstruction] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load agent if we are in Edit Mode
  useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name);
      setModel(agentToEdit.model);
      setDescription(agentToEdit.description);
      setSystemInstruction(agentToEdit.systemInstruction);
      setTemperature(agentToEdit.temperature);
      setKnowledgeFiles(agentToEdit.knowledgeFiles || []);
    } else {
      // Set default values for New Agent
      setName("");
      setModel("gemini-3.5-flash");
      setDescription("");
      setSystemInstruction(TEMPLATES[0].instruction);
      setTemperature(TEMPLATES[0].temp);
      setKnowledgeFiles([]);
    }
    setErrorMessage("");
    setSuccessMessage("");
  }, [agentToEdit]);

  // Apply Template
  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setSystemInstruction(template.instruction);
    setTemperature(template.temp);
    setSuccessMessage(`Modelo "${template.label}" aplicado com sucesso!`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Process selected files (reads actual file contents on the client side!)
  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsReadingFiles(true);
    setErrorMessage("");
    const loadedFiles: KnowledgeFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Basic extension/type validation
      const isText = 
        file.type.startsWith("text/") || 
        file.name.endsWith(".txt") || 
        file.name.endsWith(".md") || 
        file.name.endsWith(".json") || 
        file.name.endsWith(".csv") || 
        file.name.endsWith(".xml") || 
        file.name.endsWith(".ts") || 
        file.name.endsWith(".js") || 
        file.name.endsWith(".html") || 
        file.name.endsWith(".css");

      if (!isText) {
        // Skip binary files silently or with warning
        continue;
      }

      // Limit file size to 2MB per file to keep payloads reasonable
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("Alguns arquivos excederam o limite de 2MB e foram ignorados.");
        continue;
      }

      try {
        const textContent = await readFileAsText(file);
        loadedFiles.push({
          name: file.name,
          size: file.size,
          content: textContent,
        });
      } catch (err) {
        console.error("Erro ao ler arquivo:", file.name, err);
      }
    }

    if (loadedFiles.length > 0) {
      setKnowledgeFiles((prev) => {
        // Filter out duplicates based on filename
        const filteredPrev = prev.filter(pf => !loadedFiles.some(lf => lf.name === pf.name));
        return [...filteredPrev, ...loadedFiles];
      });
      setSuccessMessage(`${loadedFiles.length} documento(s) carregado(s) com sucesso!`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } else {
      setErrorMessage("Nenhum arquivo de texto legível (.txt, .md, .csv, .json, etc.) foi encontrado.");
    }
    setIsReadingFiles(false);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const removeFile = (indexToRemove: number) => {
    setKnowledgeFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Por favor, digite o nome do agente.");
      return;
    }

    try {
      await onSaveAgent({
        id: agentToEdit?.id,
        name,
        model,
        description,
        systemInstruction,
        temperature,
        knowledgeFiles,
      });
      setSuccessMessage("Agente de IA salvo com sucesso!");
    } catch (err: any) {
      setErrorMessage(`Erro ao salvar agente: ${err.message || err}`);
    }
  };

  return (
    <div id="agent-form-view" className="flex-1 bg-white dark:bg-zinc-900 overflow-y-auto h-screen text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Header Panel */}
      <div id="agent-form-header" className="px-8 py-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-chat"
            onClick={onCancel}
            className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            title="Voltar para a conversa"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
              {agentToEdit ? "Editar Agente de IA" : "Criar Novo Agente de IA"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure as diretrizes operacionais, o modelo do Gemini e anexe uma pasta de conhecimento.
            </p>
          </div>
        </div>
        <button
          id="btn-save-agent-submit"
          onClick={handleSubmit}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition duration-200 flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Salvar Agente
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {errorMessage && (
          <div id="form-error-banner" className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div id="form-success-banner" className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Identidade */}
          <div id="form-section-identity" className="bg-slate-50/40 dark:bg-zinc-800/40 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              1. Identidade e Atribuição
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Nome do Agente <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Analista de Vendas, Copywriter Financeiro"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Descrição Curta
                </label>
                <input
                  id="input-agent-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Auxilia com pitches de vendas e relatórios trimestrais."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Inteligência / Model selection */}
          <div id="form-section-intelligence" className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              2. Modelo de IA & Motor Tecnológico
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUPPORTED_MODELS.map((m) => {
                const isSelected = model === m.id;
                return (
                  <div
                    key={m.id}
                    id={`model-card-${m.id}`}
                    onClick={() => setModel(m.id)}
                    className={`p-5 rounded-2xl border-2 transition duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20"
                        : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</span>
                        {m.isPaid ? (
                          <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            PAGO (AVANÇADO)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            GRATUITO (TESTES)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{m.description}</p>
                    </div>
                    {m.isPaid && (
                      <div className="mt-4 text-[10px] text-slate-500 dark:text-slate-400 italic bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-lg p-2 leading-relaxed">
                        ⚠️ Requer chave paga. Se você não possuir chave, o sistema simula o modelo perfeitamente!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pasta de Conhecimento / Data Consumption */}
          <div id="form-section-knowledge" className="bg-slate-50/40 dark:bg-zinc-800/40 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  3. Base de Conhecimento do Agente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selecione uma pasta inteira de dados ou arquivos individuais. A IA consumirá estes dados como memória local.
                </p>
              </div>

              {/* Hidden directory/folder and file inputs */}
              <input
                ref={folderInputRef}
                id="input-folder-selector"
                type="file"
                className="hidden"
                /* @ts-ignore - webkitdirectory and directory are non-standard but fully supported */
                webkitdirectory=""
                directory=""
                multiple
                onChange={(e) => processFiles(e.target.files)}
              />
              <input
                ref={fileInputRef}
                id="input-files-selector"
                type="file"
                className="hidden"
                multiple
                onChange={(e) => processFiles(e.target.files)}
              />

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-select-folder"
                  onClick={() => folderInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-xl border border-indigo-200 dark:border-indigo-900 transition flex items-center gap-1.5 cursor-pointer"
                  disabled={isReadingFiles}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  {isReadingFiles ? "Processando..." : "Selecionar Pasta"}
                </button>
                <button
                  type="button"
                  id="btn-select-files"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
                  disabled={isReadingFiles}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isReadingFiles ? "Processando..." : "Anexar Arquivos"}
                </button>
              </div>
            </div>

            {/* Knowledge files display list */}
            {knowledgeFiles.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-zinc-800/30">
                Nenhum documento de conhecimento carregado. Use os botões acima para selecionar sua pasta de documentos de consumo de dados (.txt, .md, .csv, .json).
              </div>
            ) : (
              <div id="loaded-files-grid" className="bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl overflow-hidden shadow-inner max-h-60 overflow-y-auto">
                <div className="bg-slate-50 dark:bg-zinc-900 px-4 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-700 flex justify-between">
                  <span>Documentos Ingeridos ({knowledgeFiles.length})</span>
                  <span>Tamanho Total: {Math.round(knowledgeFiles.reduce((acc, f) => acc + f.size, 0) / 1024)} KB</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-zinc-700">
                  {knowledgeFiles.map((file, idx) => (
                    <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition">
                      <div className="flex items-center gap-2 overflow-hidden mr-4">
                        <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">({Math.round(file.size / 102.4) / 10} KB)</span>
                      </div>
                      <button
                        type="button"
                        id={`remove-knowledge-file-${idx}`}
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition"
                        title="Remover arquivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: System instructions / Guidelines */}
          <div id="form-section-instructions" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  4. Instruções Operacionais de Sistema
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Estas instruções dizem à IA exatamente quem ela é, qual o tom de voz desejado e como deve responder.
                </p>
              </div>

              {/* Templates selector pills */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">Preencher com:</span>
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-lg transition cursor-pointer"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="textarea-system-instructions"
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="Digite aqui as diretrizes operacionais do agente. Ex: 'Você é um bot de suporte amigável...'"
              rows={5}
              className="w-full px-4 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 shadow-inner"
              required
            />
          </div>

          {/* Section 5: Criatividade Slider */}
          <div id="form-section-parameters" className="bg-slate-50/40 dark:bg-zinc-800/40 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                5. Nível de Criatividade (Temperature)
              </h3>
              <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                {temperature}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Valores mais baixos (como 0.2) geram respostas super objetivas e focadas na base de conhecimento. Valores mais altos (como 0.9) geram respostas mais ricas e criativas.
            </p>

            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-400 uppercase shrink-0">Preciso (0.1)</span>
              <input
                id="input-temperature-slider"
                type="range"
                min="0.1"
                max="1.5"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-semibold text-slate-400 uppercase shrink-0">Criativo (1.5)</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
