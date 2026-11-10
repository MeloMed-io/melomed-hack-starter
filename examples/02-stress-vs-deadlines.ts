// Example 2: how did mood move around big deadlines?
// For every high-priority task due in the past 6 weeks, compare the average
// mood valence in the 3 days before the due date with the 3 days after.
// No LLM, just two MCP calls and some arithmetic.
//
//   npm run stress
import { addDays, connect, nocturneJson, parseTasks, ymd } from '../src/connect.ts';

interface MoodPoint {
  date: string;
  avgValence: number | null;
}

const WINDOW = 3;
const today = new Date();
const since = addDays(today, -42);

const servers = await connect();
try {
  const [tasksText, moodText] = await Promise.all([
    servers.callTool('twodood', 'list_tasks', { view: 'all', include_done: true, limit: 500 }),
    // Start a few days early so the first deadline still has a "before" window.
    servers.callTool('nocturne', 'get_mood_timeline', {
      from: ymd(addDays(since, -WINDOW)),
      to: ymd(today),
      bucket: 'day',
    }),
  ]);

  const valence = new Map<string, number>();
  for (const p of nocturneJson<{ points: MoodPoint[] }>(moodText).points) {
    if (p.avgValence !== null) valence.set(p.date, p.avgValence);
  }

  /** Average valence over days [from, to] relative to `day`, skipping days with no entry. */
  const avg = (day: Date, from: number, to: number): number | null => {
    const vals: number[] = [];
    for (let i = from; i <= to; i++) {
      const v = valence.get(ymd(addDays(day, i)));
      if (v !== undefined) vals.push(v);
    }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const deadlines = parseTasks(tasksText, today)
    .filter((t) => t.priority === 'high' && t.due && t.due >= since && t.due < today)
    .sort((a, b) => a.due!.getTime() - b.due!.getTime());

  const fmt = (v: number | null) => (v === null ? '   n/a' : v.toFixed(2).padStart(6));
  console.log('Maya Chen (fictional demo student): mood around high-priority deadlines, past 6 weeks\n');
  console.log(`${'Due'.padEnd(8)} ${'Task'.padEnd(38)} ${'3d before'.padStart(9)} ${'3d after'.padStart(9)} ${'change'.padStart(7)}`);
  console.log('-'.repeat(75));

  const changes: number[] = [];
  for (const t of deadlines) {
    const before = avg(t.due!, -WINDOW, -1);
    const after = avg(t.due!, 1, WINDOW);
    const change = before !== null && after !== null ? after - before : null;
    if (change !== null) changes.push(change);
    const date = t.due!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const title = t.title.length > 37 ? t.title.slice(0, 36) + '…' : t.title;
    const sign = change === null ? '    n/a' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}`.padStart(7);
    console.log(`${date.padEnd(8)} ${title.padEnd(38)} ${fmt(before).padStart(9)} ${fmt(after).padStart(9)} ${sign}`);
  }

  if (changes.length) {
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    console.log(
      `\nAcross ${changes.length} deadline(s), valence moved ${mean >= 0 ? 'up' : 'down'} by ${Math.abs(mean).toFixed(2)} on average after the due date.`,
    );
  }
  console.log('Valence runs from -1 (unpleasant) to 1 (pleasant). These are automatic reads of journal writing, a pattern to look at, not a diagnosis.');
} finally {
  await servers.close();
}
