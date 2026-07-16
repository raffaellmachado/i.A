export interface KnowledgeFile {
  name: string;
  size: number;
  content: string; // File text content
}

export interface AIAgent {
  id: string;
  name: string;
  model: string; // e.g. 'gemini-3.5-flash', 'gemini-3.1-pro-preview'
  description: string;
  systemInstruction: string;
  temperature: number;
  createdAt: string;
  knowledgeFiles: KnowledgeFile[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export const SUPPORTED_MODELS = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash (Gratuito / Rápido)',
    isPaid: false,
    description: 'Excelente para tarefas rápidas, respostas imediatas e consumo geral de conhecimento.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Pago / Avançado)',
    isPaid: true,
    description: 'Ideal para raciocínio complexo, análise profunda de dados grandes e instruções detalhadas.',
  },
];

