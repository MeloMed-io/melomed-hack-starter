// Spawns the 2DooD and Nocturne MCP servers over stdio and talks to them as an
// MCP client. Everything else in this repo goes through callTool().
//
// Server commands come from env vars so you can point at a local build:
//   TWODOOD_MCP_CMD   default "npx -y 2dood-mcp --demo"
//   NOCTURNE_MCP_CMD  default "npx -y nocturne-mcp --demo"
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport, getDefaultEnvironment } from '@modelcontextprotocol/sdk/client/stdio.js';

export type ServerName = 'twodood' | 'nocturne';

const DEFAULTS: Record<ServerName, { env: string; cmd: string }> = {
  twodood: { env: 'TWODOOD_MCP_CMD', cmd: 'npx -y 2dood-mcp --demo' },
  nocturne: { env: 'NOCTURNE_MCP_CMD', cmd: 'npx -y nocturne-mcp --demo' },
};

/** Splits a command line on spaces, keeping "quoted parts" together. */
function splitCommand(line: string): string[] {
  const parts = line.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  return parts.map((p) => p.replace(/^["']|["']$/g, ''));
}

export function serverCommand(name: ServerName): string {
  const { env, cmd } = DEFAULTS[name];
  return process.env[env]?.trim() || cmd;
}

export interface Servers {
  /** Calls a tool and returns its text output. Throws if the tool reports an error. */
  callTool(server: ServerName, name: string, args?: Record<string, unknown>): Promise<string>;
  /** The raw MCP clients, for listing tools or anything callTool doesn't cover. */
  clients: Record<ServerName, Client>;
  close(): Promise<void>;
}

async function connectOne(name: ServerName): Promise<Client> {
  const [command, ...args] = splitCommand(serverCommand(name));
  if (!command) throw new Error(`Empty command for ${name}. Check ${DEFAULTS[name].env}.`);
  const transport = new StdioClientTransport({
    command,
    args,
    // Pass TZ through so the servers agree with the caller on what "today" is.
    env: { ...getDefaultEnvironment(), ...(process.env.TZ ? { TZ: process.env.TZ } : {}) },
    stderr: 'ignore', // the servers print a startup banner on stderr
  });
  const client = new Client({ name: 'melomed-hack-starter', version: '0.1.0' });
  try {
    await client.connect(transport);
  } catch (e) {
    throw new Error(
      `Could not start the ${name} MCP server with "${[command, ...args].join(' ')}". ` +
        `Set ${DEFAULTS[name].env} to a working command (see README). Cause: ${(e as Error).message}`,
    );
  }
  return client;
}

export async function connect(): Promise<Servers> {
  const [twodood, nocturne] = await Promise.all([connectOne('twodood'), connectOne('nocturne')]);
  const clients = { twodood, nocturne };

  return {
    clients,
    async callTool(server, name, args = {}) {
      const result = await clients[server].callTool({ name, arguments: args });
      const content = (result.content ?? []) as { type: string; text?: string }[];
      const text = content
        .filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('\n');
      if (result.isError) throw new Error(`${server}.${name} failed: ${text}`);
      return text;
    },
    async close() {
      await Promise.allSettled([twodood.close(), nocturne.close()]);
    },
  };
}

// ---------- small parsing helpers shared by the examples ----------

/** Nocturne tools return a one-line summary, a blank line, then JSON. This returns the JSON. */
export function nocturneJson<T = unknown>(text: string): T {
  const start = text.indexOf('{');
  if (start < 0) throw new Error(`No JSON in Nocturne output: ${text.slice(0, 120)}`);
  return JSON.parse(text.slice(start)) as T;
}

export interface Task {
  done: boolean;
  title: string;
  due: Date | null;
  priority: 'none' | 'medium' | 'high';
  id: string;
  notes: string | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * 2DooD returns human-readable lines like
 *   - [ ] CHEM 201 exam 2 · due Thu, Nov 12, 10:00 AM · high priority  (id: ...)
 * The due date has no year, so we pick the year that puts it closest to today.
 */
export function parseTasks(text: string, now = new Date()): Task[] {
  const tasks: Task[] = [];
  for (const line of text.split('\n')) {
    const note = line.match(/^ {4}notes: (.*)$/);
    if (note && tasks.length) {
      tasks[tasks.length - 1].notes = note[1];
      continue;
    }
    const m = line.match(/^- \[( |x)\] (.*)  \(id: ([0-9a-f-]+)\)$/);
    if (!m) continue;
    const parts = m[2].split(' · ');
    const task: Task = { done: m[1] === 'x', title: parts[0], due: null, priority: 'none', id: m[3], notes: null };
    for (const p of parts.slice(1)) {
      if (p.endsWith(' priority')) task.priority = p.replace(' priority', '') as Task['priority'];
      const d = p.match(/^due \w+, (\w+) (\d+), (\d+):(\d+) (AM|PM)$/);
      if (d) {
        const month = MONTHS.indexOf(d[1]);
        let hour = Number(d[3]) % 12;
        if (d[5] === 'PM') hour += 12;
        const candidates = [-1, 0, 1].map(
          (dy) => new Date(now.getFullYear() + dy, month, Number(d[2]), hour, Number(d[4])),
        );
        task.due = candidates.reduce((a, b) =>
          Math.abs(a.getTime() - now.getTime()) <= Math.abs(b.getTime() - now.getTime()) ? a : b,
        );
      }
    }
    tasks.push(task);
  }
  return tasks;
}

/** YYYY-MM-DD in local time, the same format Nocturne uses. */
export function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
