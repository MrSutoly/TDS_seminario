# 📝 MCP de Notas

Servidor **MCP (Model Context Protocol)** simples, feito em **TypeScript**, que permite que uma IA (como o Claude Desktop) **leia, busque e crie notas** guardadas em um arquivo local (`dados/notas.json`) — sem precisar copiar e colar nada no chat.

## 🧰 Ferramentas que a IA ganha

| Ferramenta       | O que faz                                      |
| ---------------- | ---------------------------------------------- |
| `listar_notas`   | Lista todas as notas (id e título)             |
| `ler_nota`       | Lê uma nota completa pelo id                   |
| `buscar_notas`   | Procura notas por palavra no título/conteúdo   |
| `adicionar_nota` | Cria uma nota nova e salva no arquivo          |

## ✅ Pré-requisitos

- [Node.js](https://nodejs.org) versão **18 ou superior** (confira com `node -v`)
- [Claude Desktop](https://claude.ai/download) instalado (Windows ou macOS)

## 🚀 Passo a passo

### 1. Instale as dependências

Dentro da pasta do projeto, rode:

```bash
npm install
```

### 2. Compile o projeto

```bash
npm run build
```

Isso cria a pasta `build/` com o código JavaScript pronto para rodar.

### 3. (Opcional) Teste antes de conectar na IA

O **MCP Inspector** é uma ferramenta oficial que abre uma página no navegador para você testar o servidor manualmente:

```bash
npm run inspector
```

Na página, clique em **Connect**, depois na aba **Tools** → **List Tools** e experimente executar as ferramentas.

### 4. Descubra o caminho completo do projeto

Você vai precisar do **caminho absoluto** até o arquivo `build/index.js`. Dentro da pasta do projeto:

- **Windows (PowerShell):** `(Get-Item .\build\index.js).FullName`
- **macOS/Linux:** `realpath build/index.js`

Exemplo de resultado: `C:\Users\SeuNome\projetos\mcp-notas\build\index.js`

### 5. Configure o Claude Desktop

Abra o Claude Desktop → **Settings (Configurações)** → **Developer** → **Edit Config**.
Isso abre o arquivo `claude_desktop_config.json`. Se preferir, ele fica em:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Adicione o servidor dentro de `mcpServers`:

```json
{
  "mcpServers": {
    "notas": {
      "command": "node",
      "args": ["C:/Users/SeuNome/projetos/mcp-notas/build/index.js"]
    }
  }
}
```

> ⚠️ **Atenção ao caminho:**
> - Use o caminho **completo** (absoluto).
> - No Windows, use barras normais `/` ou barras duplas `\\` (barra simples `\` quebra o JSON).
> - Se o arquivo já tiver outras configurações, só adicione o bloco `"notas": {...}` dentro do `mcpServers` existente.

### 6. Reinicie o Claude Desktop

Feche **completamente** o Claude Desktop (no Windows, clique com o botão direito no ícone da bandeja → **Quit**; no macOS, `Cmd + Q`) e abra de novo.

Se deu certo, aparece um ícone de ferramentas (🔨 / "conectores") na caixa de mensagem, e o servidor **notas** aparece listado.

### 7. Use! 🎉

Converse normalmente com a IA. Quando ela precisar, vai pedir permissão para usar a ferramenta (clique em **Permitir**). Exemplos de perguntas:

- *"Quais notas eu tenho salvas?"*
- *"Leia a nota sobre a reunião da equipe."*
- *"Tenho alguma nota falando sobre prova?"*
- *"Crie uma nota chamada 'Ensaio do seminário' com o texto 'Levar o notebook e o carregador'."*

Depois de criar uma nota, abra o `dados/notas.json` e veja que ela foi realmente gravada no arquivo.

## 📁 Estrutura do projeto

```
mcp-notas/
├── src/
│   └── index.ts        # Código do servidor MCP (comentado em português)
├── dados/
│   └── notas.json      # "Banco de dados" com as notas
├── build/              # Gerada pelo npm run build
├── package.json
├── tsconfig.json
└── README.md
```

## ✏️ Como personalizar

- **Mudar os dados:** edite o `dados/notas.json` (mantenha os campos `id`, `titulo`, `conteudo` e `criadaEm`).
- **Criar uma ferramenta nova:** copie um bloco `servidor.registerTool(...)` em `src/index.ts`, mude o nome, a descrição e a lógica. Depois rode `npm run build` e **reinicie o Claude Desktop**.

> 💡 Sempre que alterar o código, rode `npm run build` e reinicie o Claude Desktop para ele carregar a versão nova.

## 🛠️ Solução de problemas

| Problema | Solução |
| --- | --- |
| O servidor não aparece no Claude Desktop | Confira se o JSON está válido e se o caminho do `index.js` está correto e absoluto. Reinicie o app por completo. |
| Erro "node não encontrado" | Instale o Node.js e reinicie o computador/Claude Desktop. |
| Erro `Cannot find module` | Rode `npm install` e `npm run build` de novo. |
| Alterei o código e nada mudou | Rode `npm run build` e reinicie o Claude Desktop. |
| Quer ver os logs | Claude Desktop → Settings → Developer → clique no servidor → **Open Logs Folder** (arquivo `mcp-server-notas.log`). |

## ⚠️ Regra de ouro ao programar MCP com stdio

**Nunca use `console.log()`** no servidor: ele escreve na saída padrão e corrompe a comunicação com a IA. Para logs, use `console.error()`.

## 📚 Referências

- Documentação oficial: https://modelcontextprotocol.io
- Repositórios e SDKs: https://github.com/modelcontextprotocol
