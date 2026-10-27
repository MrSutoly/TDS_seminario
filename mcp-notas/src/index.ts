#!/usr/bin/env node
/**
 * ============================================================
 *  MCP de Notas — Servidor MCP simples em TypeScript
 * ============================================================
 *  Este servidor dá à IA acesso a um arquivo local (dados/notas.json).
 *  Assim, a IA consegue LER e ESCREVER nas nossas notas sozinha,
 *  sem a gente precisar copiar e colar nada no chat.
 *
 *  Ferramentas (tools) expostas para a IA:
 *    - listar_notas    -> lista todas as notas (id + título)
 *    - ler_nota        -> lê uma nota completa pelo id
 *    - buscar_notas    -> procura notas por uma palavra
 *    - adicionar_nota  -> cria uma nota nova no arquivo
 * ============================================================
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ------------------------------------------------------------
// 1) CONFIGURAÇÃO DO "BANCO DE DADOS" (um simples arquivo JSON)
// ------------------------------------------------------------

// Descobre a pasta onde este arquivo está, para achar o notas.json
// independentemente de onde o Claude Desktop execute o programa.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARQUIVO_NOTAS = path.resolve(__dirname, "../dados/notas.json");

// Formato de cada nota guardada no arquivo
interface Nota {
  id: number;
  titulo: string;
  conteudo: string;
  criadaEm: string;
}

// Lê o arquivo JSON e devolve a lista de notas
async function carregarNotas(): Promise<Nota[]> {
  const texto = await fs.readFile(ARQUIVO_NOTAS, "utf-8");
  return JSON.parse(texto) as Nota[];
}

// Salva a lista de notas de volta no arquivo JSON
async function salvarNotas(notas: Nota[]): Promise<void> {
  await fs.writeFile(ARQUIVO_NOTAS, JSON.stringify(notas, null, 2), "utf-8");
}

// Atalho para montar a resposta no formato que o MCP espera
function texto(conteudo: string, erro = false) {
  return {
    content: [{ type: "text" as const, text: conteudo }],
    ...(erro && { isError: true }),
  };
}

// ------------------------------------------------------------
// 2) CRIAÇÃO DO SERVIDOR MCP
// ------------------------------------------------------------
const servidor = new McpServer({
  name: "mcp-notas",
  version: "1.0.0",
});

// ------------------------------------------------------------
// 3) FERRAMENTAS (TOOLS)
//    A "description" é muito importante: é ela que a IA lê
//    para decidir QUANDO e COMO usar cada ferramenta.
// ------------------------------------------------------------

// --- Ferramenta 1: listar todas as notas ---
servidor.registerTool(
  "listar_notas",
  {
    title: "Listar notas",
    description: "Lista todas as notas salvas, mostrando o id e o título de cada uma.",
    inputSchema: {}, // não precisa de nenhum parâmetro
  },
  async () => {
    const notas = await carregarNotas();

    if (notas.length === 0) {
      return texto("Nenhuma nota encontrada.");
    }

    const lista = notas.map((n) => `#${n.id} - ${n.titulo}`).join("\n");
    return texto(`Notas encontradas (${notas.length}):\n${lista}`);
  }
);

// --- Ferramenta 2: ler uma nota específica ---
servidor.registerTool(
  "ler_nota",
  {
    title: "Ler nota",
    description: "Lê o conteúdo completo de uma nota a partir do seu id.",
    // zod valida os parâmetros que a IA envia
    inputSchema: {
      id: z.number().describe("Id da nota que será lida"),
    },
  },
  async ({ id }) => {
    const notas = await carregarNotas();
    const nota = notas.find((n) => n.id === id);

    if (!nota) {
      return texto(`Nota com id ${id} não encontrada.`, true);
    }

    return texto(
      `Nota #${nota.id}\nTítulo: ${nota.titulo}\nCriada em: ${nota.criadaEm}\n\n${nota.conteudo}`
    );
  }
);

// --- Ferramenta 3: buscar notas por palavra ---
servidor.registerTool(
  "buscar_notas",
  {
    title: "Buscar notas",
    description:
      "Procura notas que contenham uma palavra ou trecho no título ou no conteúdo.",
    inputSchema: {
      termo: z.string().describe("Palavra ou trecho a ser procurado"),
    },
  },
  async ({ termo }) => {
    const notas = await carregarNotas();
    const busca = termo.toLowerCase();

    const encontradas = notas.filter(
      (n) =>
        n.titulo.toLowerCase().includes(busca) ||
        n.conteudo.toLowerCase().includes(busca)
    );

    if (encontradas.length === 0) {
      return texto(`Nenhuma nota encontrada com o termo "${termo}".`);
    }

    const resultado = encontradas
      .map((n) => `#${n.id} - ${n.titulo}\n${n.conteudo}`)
      .join("\n\n---\n\n");
    return texto(`${encontradas.length} nota(s) encontrada(s):\n\n${resultado}`);
  }
);

// --- Ferramenta 4: adicionar uma nota nova (escreve no arquivo!) ---
servidor.registerTool(
  "adicionar_nota",
  {
    title: "Adicionar nota",
    description: "Cria uma nova nota e salva no arquivo local de notas.",
    inputSchema: {
      titulo: z.string().describe("Título da nota"),
      conteudo: z.string().describe("Texto da nota"),
    },
  },
  async ({ titulo, conteudo }) => {
    const notas = await carregarNotas();

    // Gera o próximo id (maior id atual + 1)
    const novoId = notas.reduce((max, n) => Math.max(max, n.id), 0) + 1;

    const novaNota: Nota = {
      id: novoId,
      titulo,
      conteudo,
      criadaEm: new Date().toISOString().slice(0, 10), // formato AAAA-MM-DD
    };

    notas.push(novaNota);
    await salvarNotas(notas);

    return texto(`Nota #${novoId} "${titulo}" criada com sucesso!`);
  }
);

// ------------------------------------------------------------
// 4) INICIAR O SERVIDOR
//    Usamos "stdio": o Claude Desktop inicia este programa e
//    conversa com ele pela entrada/saída padrão do terminal.
//
//    ATENÇÃO: nunca use console.log() aqui! Ele escreve na saída
//    padrão e quebra a comunicação com o cliente. Para logs,
//    use console.error().
// ------------------------------------------------------------
async function main() {
  const transporte = new StdioServerTransport();
  await servidor.connect(transporte);
  console.error("Servidor MCP de Notas rodando (stdio)...");
}

main().catch((erro) => {
  console.error("Erro fatal ao iniciar o servidor:", erro);
  process.exit(1);
});
