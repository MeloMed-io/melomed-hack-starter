// Example 1: the week behind and the week ahead, one line per day.
// Tasks from 2DooD, mood from Nocturne, joined on the date. No LLM.
//
//   npm run week
import { addDays, connect, nocturneJson, parseTasks, ymd } from '../src/connect.ts';

interface MoodPoint {
  date: string;
  entries: number;
  avgValence: number | null;
  topEmotions: string[];
}

const today = new Date();
const start = addDays(today, -6);
const end = addDays(today, 7);

const servers = await connect();
try {
  const [tasksText, moodText] = await Promise.all([
    servers.callTool('twodood', 'list_tasks', { view: 'all', include_done: true, limit: 500 }),
    servers.callTool('nocturne', 'get_mood_timeline', { from: ymd(start), to: ymd(today), bucket: 'day' }),
  ]);

  const tasks = parseTasks(tasksText, today);
  const mood = new Map(nocturneJson<{ points: MoodPoint[] }>(moodText).points.map((p) => [p.date, p]));

  console.log('Maya Chen (fictional demo student): last 7 days and next 7 days\n');
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const key = ymd(d);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const marker = key === ymd(today) ? '  <- today' : '';
    const m = mood.get(key);
    const moodLine =
      key > ymd(today)
        ? ''
        : m && m.avgValence !== null
          ? `mood ${valenceBar(m.avgValence)} ${m.avgValence.toFixed(2).padStart(5)}  ${m.topEmotions.join(', ')}`
          : 'mood (no entry)';
    console.log(`${label.padEnd(12)} ${moodLine}${marker}`.trimEnd());

    const due = tasks.filter((t) => t.due && ymd(t.due) === key);
    for (const t of due) {
      const flag = t.priority === 'high' ? ' !' : '';
      const late = !t.done && key < ymd(today) ? ' (missed)' : '';
      console.log(`             ${t.done ? '[x]' : '[ ]'} ${t.title}${flag}${late}`);
    }
  }
  console.log('\nValence runs from -1 (unpleasant) to 1 (pleasant). Mood labels are automatic reads of journal writing, not assessments.');
} finally {
  await servers.close();
}

/** A tiny bar, centered on zero: negative fills left, positive fills right. */
function valenceBar(v: number): string {
  const n = Math.round(Math.abs(v) * 5);
  const left = v < 0 ? ' '.repeat(5 - n) + '#'.repeat(n) : ' '.repeat(5);
  const right = v > 0 ? '#'.repeat(n) + ' '.repeat(5 - n) : ' '.repeat(5);
  return `[${left}|${right}]`;
}
