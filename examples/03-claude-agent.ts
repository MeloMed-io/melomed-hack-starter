// Example 3 (optional): give Claude both servers' tools and let it plan.
// Needs ANTHROPIC_API_KEY. Without it, this prints a note and exits.
//
//   ANTHROPIC_API_KEY=... npm run agent
//   npm run agent -- "What did my week look like?"
//
// A plain tool loop: send the question with every MCP tool attached, run the
// tool calls Claude asks for against the right server, send the results back,
// repeat until Claude answers.
import Anthropic from '@anthropic-ai/sdk';
import { connect, type ServerName } from '../src/connect.ts';

const MODEL = 'claude-sonnet-5-5';
const MAX_TURNS = 12;
const QUESTION = process.argv.slice(2).join(' ') || "Plan my next 4 days around my exam and how I've been feeling.";

// Tools Claude is not offered. Demo changes only live in memory, but an agent
// that deletes tasks is a bad first impression.
const SKIP = new Set(['twodood__delete_task']);

const SYSTEM = [
  'You are a study-planning assistant connected to two apps through MCP:',
  '2DooD (to-do list, tools prefixed twodood__) and Nocturne (journal mood data, tools prefixed nocturne__).',
  'Both are in demo mode and hold fictional data for a made-up student, Maya Chen. Speak to the user as Maya.',
  'Mood labels are automatic reads of journal writing. Describe them as patterns, never as a diagnosis or condition.',
  'Look at the tasks and the recent mood before planning. Keep the plan short: one block per day.',
].join(' ');

if (!process.env.ANTHROPIC_API_KEY) {
  console.log('ANTHROPIC_API_KEY is not set, so example 3 is skipped. Examples 1 and 2 need no key.');
  process.exit(0);
}

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const servers = await connect();

try {
  // MCP tool definitions map almost one to one onto Claude tool definitions.
  const tools: Anthropic.Beta.BetaTool[] = [];
  const route = new Map<string, { server: ServerName; name: string }>();
  for (const server of ['twodood', 'nocturne'] as const) {
    const { tools: list } = await servers.clients[server].listTools();
    for (const t of list) {
      const name = `${server}__${t.name}`;
      if (SKIP.has(name)) continue;
      route.set(name, { server, name: t.name });
      tools.push({
        name,
        description: t.description ?? t.name,
        input_schema: t.inputSchema as Anthropic.Beta.BetaTool.InputSchema,
      });
    }
  }

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: QUESTION }];
  console.log(`> ${QUESTION}\n`);

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      tools,
      messages,
      // If the model declines for policy reasons, let the API retry on its default fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'refusal') {
      console.log('Claude declined this request.');
      break;
    }
    if (response.stop_reason === 'pause_turn') continue;

    const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
    if (response.stop_reason !== 'tool_use' || calls.length === 0) {
      for (const b of response.content) if (b.type === 'text') console.log(b.text);
      if (response.stop_reason === 'max_tokens') console.log('\n(stopped at max_tokens)');
      break;
    }

    // Run every tool call from this turn, then send all results back in one message.
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = await Promise.all(
      calls.map(async (call) => {
        const target = route.get(call.name);
        console.log(`  tool: ${call.name} ${JSON.stringify(call.input)}`);
        try {
          if (!target) throw new Error(`Unknown tool ${call.name}`);
          const text = await servers.callTool(target.server, target.name, call.input as Record<string, unknown>);
          return { type: 'tool_result' as const, tool_use_id: call.id, content: text };
        } catch (e) {
          return { type: 'tool_result' as const, tool_use_id: call.id, content: (e as Error).message, is_error: true };
        }
      }),
    );
    messages.push({ role: 'user', content: results });
  }
} finally {
  await servers.close();
}
