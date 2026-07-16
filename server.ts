import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { AIAgent, Chat, Message, User } from "./src/types";

const app = express();
const PORT = 3000;

// Enable large JSON payloads for folder/file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Data persistence paths
const DATA_DIR = path.join(process.cwd(), "data-store");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");
const CHATS_FILE = path.join(DATA_DIR, "chats.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data-store directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Seed Users (Simulated User Store with Passwords)
interface SavedUser extends User {
  password?: string;
}

const DEFAULT_USERS: SavedUser[] = [
  {
    id: "user-admin-1",
    name: "Admin Master",
    email: "admin@gemini.com",
    role: "admin",
    password: "admin",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-normal-1",
    name: "Usuário Padrão",
    email: "user@gemini.com",
    role: "user",
    password: "user",
    createdAt: new Date().toISOString()
  }
];

// Helper to read/write Users
function getUsers(): SavedUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro lendo usuários, usando sementes:", err);
  }
  saveUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

function saveUsers(users: SavedUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro salvando usuários:", err);
  }
}

// Default Seed Agents
const DEFAULT_AGENTS: AIAgent[] = [
  {
    id: "agent-default-1",
    name: "Assistente Geral",
    model: "gemini-3.5-flash",
    description: "Um assistente inteligente, amigável e focado em produtividade.",
    systemInstruction: "Você é o Assistente Geral, um copiloto de IA altamente inteligente, gentil e útil. Responda de forma clara e objetiva.",
    temperature: 0.7,
    createdAt: new Date().toISOString(),
    knowledgeFiles: [],
  },
  {
    id: "agent-default-2",
    name: "Analista de Dados Financeiros",
    model: "gemini-3.5-flash",
    description: "Especialista em analisar relatórios de faturamento, métricas e planilhas.",
    systemInstruction: "Você é um Analista Financeiro Sênior. Sua função é responder a perguntas de forma analítica, estruturada e com foco em métricas comerciais de faturamento ou investimentos.",
    temperature: 0.2,
    createdAt: new Date().toISOString(),
    knowledgeFiles: [
      {
        name: "exemplo_conhecimento.txt",
        size: 210,
        content: "Metas de Faturamento 2026:\n- Q1: R$ 150k (Foco em marketing digital)\n- Q2: R$ 220k (Expansão do time comercial)\n- Q3: R$ 310k (Lançamento da nova versão)\n- Q4: R$ 450k (Campanha de vendas corporativas)"
      }
    ],
  }
];

// Helper to read/write Agents
function getAgents(): AIAgent[] {
  try {
    if (fs.existsSync(AGENTS_FILE)) {
      const data = fs.readFileSync(AGENTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro lendo agentes, usando sementes:", err);
  }
  // Write default seed agents
  saveAgents(DEFAULT_AGENTS);
  return DEFAULT_AGENTS;
}

function saveAgents(agents: AIAgent[]) {
  try {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro salvando agentes:", err);
  }
}

// Helper to read/write Chats
function getChats(): Chat[] {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const data = fs.readFileSync(CHATS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro lendo conversas:", err);
  }
  return [];
}

function saveChats(chats: Chat[]) {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro salvando conversas:", err);
  }
}

// Lazy initialization of Gemini to prevent startup crash if API key is not present
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Middleware to authorize request as admin
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    res.status(401).json({ error: "Sessão inválida ou não autenticada." });
    return;
  }
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Apenas usuários Administradores têm permissão para criar ou editar agentes." });
    return;
  }
  next();
}

// API Routes

// --- Auth Routes ---
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios" });
    return;
  }

  const users = getUsers();
  const lowerEmail = email.toLowerCase().trim();
  let user = users.find(u => u.email.toLowerCase() === lowerEmail);

  if (!user) {
    // If the user doesn't exist yet, we create them on-the-fly!
    // Emails containing "admin" or matching the owner's email get the admin role.
    const isAdminEmail = lowerEmail.includes("admin") || lowerEmail === "raffaell.machadoo@gmail.com";
    
    // Extract a nice name from the e-mail address
    const namePart = lowerEmail.split("@")[0];
    const formattedName = namePart
      .split(/[-_.]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    user = {
      id: `user-${Date.now()}`,
      name: formattedName || "Novo Usuário",
      email: lowerEmail,
      role: isAdminEmail ? "admin" : "user",
      password: password,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);
  } else {
    // If user exists, check credentials
    if (user.password !== password) {
      res.status(401).json({ error: "Senha incorreta para este e-mail registrado." });
      return;
    }
  }

  // Return user details without password
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// User Administration: get users (requires admin role)
app.get("/api/users", requireAdmin, (req, res) => {
  const users = getUsers().map(({ password, ...u }) => u);
  res.json(users);
});

// User Administration: create new user manually (requires admin role)
app.post("/api/users", requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Todos os campos (nome, e-mail, senha e nível de acesso) são obrigatórios." });
    return;
  }

  const users = getUsers();
  const lowerEmail = email.toLowerCase().trim();
  const existing = users.find(u => u.email.toLowerCase() === lowerEmail);
  if (existing) {
    res.status(400).json({ error: "Este e-mail já está sendo utilizado por outro usuário." });
    return;
  }

  const newUser: SavedUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: lowerEmail,
    role: role === "admin" ? "admin" : "user",
    password: password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Update role of user (requires admin role)
app.put("/api/users/:id/role", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== "admin" && role !== "user") {
    res.status(400).json({ error: "Role deve ser 'admin' ou 'user'." });
    return;
  }

  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  // Prevent self de-elevation to ensure there is always at least 1 admin
  const requesterId = req.headers["x-user-id"] as string;
  if (id === requesterId && role !== "admin") {
    res.status(400).json({ error: "Você não pode remover seu próprio acesso administrativo." });
    return;
  }

  users[idx].role = role;
  saveUsers(users);

  const { password: _, ...safeUser } = users[idx];
  res.json(safeUser);
});

// Delete user (requires admin role)
app.delete("/api/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const requesterId = req.headers["x-user-id"] as string;

  if (id === requesterId) {
    res.status(400).json({ error: "Você não pode excluir sua própria conta enquanto estiver logado." });
    return;
  }

  let users = getUsers();
  users = users.filter(u => u.id !== id);
  saveUsers(users);
  res.json({ success: true });
});


// 1. Manage Agents
app.get("/api/agents", (req, res) => {
  res.json(getAgents());
});

// Protected writes
app.post("/api/agents", requireAdmin, (req, res) => {
  const { name, model, description, systemInstruction, temperature, knowledgeFiles } = req.body;
  if (!name || !model) {
    res.status(400).json({ error: "Nome e Modelo de IA são obrigatórios" });
    return;
  }

  const agents = getAgents();
  const newAgent: AIAgent = {
    id: `agent-${Date.now()}`,
    name,
    model,
    description: description || "",
    systemInstruction: systemInstruction || "",
    temperature: temperature !== undefined ? Number(temperature) : 1,
    createdAt: new Date().toISOString(),
    knowledgeFiles: knowledgeFiles || [],
  };

  agents.push(newAgent);
  saveAgents(agents);
  res.status(201).json(newAgent);
});

app.put("/api/agents/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, model, description, systemInstruction, temperature, knowledgeFiles } = req.body;

  const agents = getAgents();
  const index = agents.findIndex((a) => a.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Agente não encontrado" });
    return;
  }

  const updatedAgent: AIAgent = {
    ...agents[index],
    name: name !== undefined ? name : agents[index].name,
    model: model !== undefined ? model : agents[index].model,
    description: description !== undefined ? description : agents[index].description,
    systemInstruction: systemInstruction !== undefined ? systemInstruction : agents[index].systemInstruction,
    temperature: temperature !== undefined ? Number(temperature) : agents[index].temperature,
    knowledgeFiles: knowledgeFiles !== undefined ? knowledgeFiles : agents[index].knowledgeFiles,
  };

  agents[index] = updatedAgent;
  saveAgents(agents);
  res.json(updatedAgent);
});

app.delete("/api/agents/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  let agents = getAgents();
  agents = agents.filter((a) => a.id !== id);
  saveAgents(agents);
  res.json({ success: true });
});

// 2. Manage Chats
app.get("/api/chats", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }
  const chats = getChats().filter(c => c.userId === userId || (!c.userId && userId === 'user-admin-1'));
  res.json(chats);
});

app.post("/api/chats", (req, res) => {
  const { agentId, title } = req.body;
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }
  if (!agentId) {
    res.status(400).json({ error: "ID do Agente é obrigatório" });
    return;
  }

  const agents = getAgents();
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) {
    res.status(404).json({ error: "Agente não encontrado para iniciar a conversa" });
    return;
  }

  const chats = getChats();
  const newChat: Chat = {
    id: `chat-${Date.now()}`,
    agentId,
    title: title || `Conversa com ${agent.name}`,
    createdAt: new Date().toISOString(),
    messages: [],
    userId,
  };

  chats.push(newChat);
  saveChats(chats);
  res.status(201).json(newChat);
});

app.delete("/api/chats/:id", (req, res) => {
  const { id } = req.params;
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  let chats = getChats();
  const chat = chats.find((c) => c.id === id);
  if (chat && chat.userId && chat.userId !== userId) {
    res.status(403).json({ error: "Não autorizado a excluir esta conversa" });
    return;
  }

  chats = chats.filter((c) => c.id !== id);
  saveChats(chats);
  res.json({ success: true });
});

// 3. Send Message and Trigger Gemini Call
app.post("/api/chats/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const userId = req.headers["x-user-id"] as string;

  if (!text || text.trim() === "") {
    res.status(400).json({ error: "Texto do prompt é obrigatório" });
    return;
  }

  const chats = getChats();
  const chatIndex = chats.findIndex((c) => c.id === id);
  if (chatIndex === -1) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }

  const chat = chats[chatIndex];
  if (chat.userId && chat.userId !== userId) {
    res.status(403).json({ error: "Não autorizado a interagir nesta conversa" });
    return;
  }

  const agents = getAgents();
  const agent = agents.find((a) => a.id === chat.agentId);

  if (!agent) {
    res.status(404).json({ error: "Agente de IA correspondente não encontrado" });
    return;
  }

  // Create user message
  const userMessage: Message = {
    id: `msg-${Date.now()}-user`,
    role: "user",
    text,
    createdAt: new Date().toISOString(),
  };

  chat.messages.push(userMessage);

  // If chat title was just default or first message, name it nicely
  if (chat.messages.filter(m => m.role === 'user').length === 1) {
    chat.title = text.length > 30 ? text.substring(0, 27) + "..." : text;
  }

  // Let's create the assistant model response placeholder
  const modelMessageId = `msg-${Date.now()}-model`;
  let responseText = "";
  let isSimulated = false;

  try {
    // 1. Prepare system instructions incorporating knowledge files if they exist
    let fullSystemInstruction = agent.systemInstruction || "Você é um assistente prestativo.";
    
    if (agent.knowledgeFiles && agent.knowledgeFiles.length > 0) {
      fullSystemInstruction += `\n\n[CONHECIMENTO EXTRA DISPONÍVEL DO AGENTE]:\nO usuário fez upload de arquivos de conhecimento para a sua base. Utilize rigorosamente as seguintes informações para responder sempre que possível:\n`;
      agent.knowledgeFiles.forEach((file) => {
        fullSystemInstruction += `\n--- Nome do Arquivo: ${file.name} (Tamanho: ${file.size} bytes) ---\n${file.content}\n----------------------------------\n`;
      });
      fullSystemInstruction += `\n[FIM DO CONHECIMENTO EXTRA]`;
    }

    // 2. Map chat messages to the format expected by Gemini API
    const contents = chat.messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // 3. Call Gemini
    const aiClient = getGeminiClient();
    const result = await aiClient.models.generateContent({
      model: agent.model || "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: agent.temperature,
      }
    });

    responseText = result.text || "Sem resposta do modelo.";
  } catch (error: any) {
    console.error("Erro na API do Gemini:", error);
    
    if (error.message === "GEMINI_API_KEY_MISSING") {
      isSimulated = true;
      // Provide an elegant simulated response when API key is missing
      responseText = `🤖 *[MODO DE SIMULAÇÃO ATIVO]*

Não detectamos uma chave de API válida para o Gemini nos Segredos (Secrets) do seu projeto.
Para fazer perguntas de verdade, adicione a variável \`GEMINI_API_KEY\` no painel de Configurações do AI Studio!

**Sua mensagem enviada para o agente "${agent.name}":**
> "${text}"

**Análise do Conhecimento do Agente:**
O agente possui ${agent.knowledgeFiles.length} documento(s) em sua base de dados de conhecimento:
${agent.knowledgeFiles.length > 0 
  ? agent.knowledgeFiles.map(f => `- \`${f.name}\` (${f.size} bytes)`).join('\n')
  : "- Nenhum arquivo anexado ainda."
}

**Simulação de Resposta:**
Aqui está um exemplo de resposta que o modelo \`${agent.model}\` geraria caso sua chave estivesse configurada, usando as instruções:
*"${agent.systemInstruction}"*

*"Olá! Eu sou o ${agent.name} e estou rodando no modelo ${agent.model}. Se minha chave estivesse ativa, eu estaria processando sua mensagem em tempo real para te dar as respostas com base em minha instrução operacional e nos dados de conhecimento anexados!"*`;
    } else {
      responseText = `❌ Erro ao comunicar com o Gemini API: ${error.message || error}. Por favor, verifique se a sua chave de API está correta ou se o modelo está acessível.`;
    }
  }

  // Create model response message
  const modelMessage: Message = {
    id: modelMessageId,
    role: "model",
    text: responseText,
    createdAt: new Date().toISOString(),
  };

  chat.messages.push(modelMessage);
  saveChats(chats);

  res.json({
    chat,
    userMessage,
    modelMessage,
    isSimulated
  });
});

// Serve frontend assets via Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

