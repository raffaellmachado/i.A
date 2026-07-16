# 🚀 Gemini Studio - Plataforma de Agentes de IA

Este é o **Gemini Studio**, uma plataforma moderna e responsiva para a criação, gerenciamento e conversação com Agentes de IA personalizados equipados com bases de conhecimento de dados locais. Desenvolvida em **React (Vite) + Tailwind CSS v4** no frontend e **Express (TypeScript) + Google GenAI SDK** no backend.

---

## 📌 Perguntas Frequentes & Guia de Operação

### 1. 💻 Como eu coloco este projeto no ar localmente?

Para executar o projeto em sua máquina local, certifique-se de possuir o [Node.js (versão 18 ou superior)](https://nodejs.org/) instalado. Em seguida, siga os passos abaixo:

#### Passo 1: Clonar ou Baixar os Arquivos
Baixe o código-fonte em ZIP e extraia-o em uma pasta, ou use o comando Git:
```bash
git clone <url-do-repositorio>
cd gemini-studio
```

#### Passo 2: Instalar as Dependências
Instale todas as dependências requeridas pelo frontend e pelo backend em um único passo:
```bash
npm install
```

#### Passo 3: Configurar as Variáveis de Ambiente
Crie um arquivo chamado `.env` na raiz do projeto (copiando as instruções de `.env.example`):
```bash
cp .env.example .env
```
Abra o arquivo `.env` e configure sua chave secreta da API do Gemini:
```env
GEMINI_API_KEY="AIzaSyYourActualGeminiApiKey..."
```

#### Passo 4: Rodar em Modo de Desenvolvimento (Dev)
Inicie o servidor de desenvolvimento. O backend iniciará o Express e o Vite integrados:
```bash
npm run dev
```
O aplicativo estará disponível em: **`http://localhost:3000`**

#### Passo 5: Build de Produção
Para compilar a aplicação otimizada para produção:
```bash
npm run build
npm start
```

---

### 2. 🗄️ Onde são guardadas as informações dos usuários, chats e agentes?

Para evitar complexidade inicial com servidores de banco de dados pesados, as informações são persistidas de forma segura no **sistema de arquivos local do servidor**, dentro de uma pasta dedicada no projeto chamada:
📂 **`/data-store/`**

Nela são criados arquivos JSON estruturados para gerenciar o estado da aplicação:
- 👥 **`users.json`**: Guarda as credenciais dos usuários, emails, senhas criptografadas/simuladas e permissões de acesso (Administrador ou Usuário Comum).
- 🤖 **`agents.json`**: Guarda as definições dos seus agentes de IA (nome, modelo ativo, instruções operacionais, temperatura e toda a sua **Base de Conhecimento** em formato textual).
- 💬 **`chats.json`**: Armazena as conversas criadas, títulos dos chats e o histórico completo de mensagens trocadas.

> **💡 Vantagem**: Isso facilita backups instantâneos (basta copiar a pasta `/data-store/`) e permite que a aplicação seja executada localmente de forma imediata sem configurar banco de dados.

---

### 3. 🧠 Se um dia eu quiser usar outra I.A (Ex: OpenAI GPT, Anthropic Claude), como faço?

Toda a integração com a Inteligência Artificial está centralizada no backend no arquivo **`/server.ts`**.

Caso queira alterar ou adicionar outra IA de mercado (como OpenAI ou Claude), os passos fundamentais são:

#### Passo 1: Instalar o SDK do Provedor Desejado
```bash
# Exemplo para OpenAI
npm install openai
```

#### Passo 2: Inicializar o Cliente no Backend
Modifique o arquivo `/server.ts` para importar e inicializar o cliente do provedor. Por exemplo, substituindo a função `getGeminiClient()`:
```typescript
import { OpenAI } from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
  return new OpenAI({ apiKey });
}
```

#### Passo 3: Atualizar a Chamada no Endpoint de Chat
No endpoint `app.post("/api/chats/:id/messages")` (linha ~420 em `/server.ts`), altere a chamada de geração de conteúdo para usar o novo cliente:
```typescript
// Exemplo adaptando para OpenAI Chat Completions:
const openai = getOpenAIClient();
const response = await openai.chat.completions.create({
  model: agent.model || "gpt-4o",
  messages: [
    { role: "system", content: fullSystemInstruction },
    ...contents.map(c => ({
      role: c.role === "model" ? "assistant" : "user",
      content: c.parts[0].text
    }))
  ],
  temperature: agent.temperature,
});

responseText = response.choices[0].message.content || "";
```

---

### 4. 🐳 Como subir a solução em um container Docker ou na Microsoft Azure?

Já deixamos os arquivos de infraestrutura configurados na raiz do projeto!

#### A) Rodando localmente com Docker
Certifique-se de ter o Docker e Docker Compose instalados. Na raiz do projeto, execute:
```bash
# Para subir o container em segundo plano
docker-compose up -d --build
```
A aplicação estará rodando perfeitamente na porta **`3000`**. Os dados do diretório `/data-store` continuarão salvos no seu computador físico graças ao volume configurado no `docker-compose.yml`.

#### B) Subindo na Microsoft Azure

Existem dois caminhos recomendados na Azure:

##### Opção 1: Azure Container Apps (Recomendado - Mais moderno e barato)
1. Crie um registro de container na Azure (Azure Container Registry - ACR).
2. Envie (Push) a imagem Docker gerada pelo seu `Dockerfile` para o ACR.
3. Crie um recurso de **Azure Container App**.
4. Configure as variáveis de ambiente (`GEMINI_API_KEY` e `NODE_ENV=production`) nas configurações do Container App.
5. Monte um volume de armazenamento (Azure Files) sob o ponto de montagem `/app/data-store` para garantir que as bases de conhecimento e usuários não se percam quando o container reiniciar.

##### Opção 2: Azure App Service (Baseado em Código)
1. Crie um recurso de **Web App** (Linux, Node.js 20).
2. Configure o build automático conectando ao seu repositório do GitHub (Deployment Center).
3. Nas **Configurações de Aplicativo (Application Settings)** do portal da Azure, adicione:
   - `GEMINI_API_KEY` = *Sua Chave Real*
   - `NODE_ENV` = `production`
   - `WEBSITES_PORT` = `3000`
4. Habilite a persistência de arquivos locais do App Service se desejar usar a pasta `/data-store` interna nativa da Azure App Service (`WEBSITES_ENABLE_APP_SERVICE_STORAGE` = `true`).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion (para transições fluidas)
- **Backend**: Node.js, Express, TypeScript, Esbuild, Google GenAI SDK (Gemini API)
- **Infraestrutura**: Dockerfile, Docker Compose
