// Writes public/maya.json: a static snapshot of the two demo servers, for web
// builders (v0, Replit and others) that cannot start a local MCP server.
//
//   npm run export-json
//
// How dates work: the demo servers have no clock override. They date
// everything relative to the moment they start. So this script reads the
// servers today, gives every item a dayOffset (0 = the day the servers ran),
// and then writes the real dates as if "today" were ANCHOR_DAY, the event day.
// Weekly routines (climbing Tue and Thu, long run on Sunday) follow the
// weekday the servers ran on, so run this on the same weekday as ANCHOR_DAY.
//
// Entry text is never exported. Nocturne runs in plain --demo mode here,
// never --demo-raw.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Both servers and this script must agree on "today". Set before any Date use.
process.env.TZ = 'America/New_York';

const { addDays, connect, nocturneJson, parseTasks, serverCommand, ymd } = await import('../src/connect.ts');

const ANCHOR_DAY = '2026-11-17'; // event day: Tue Nov 17 2026, NYU
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'maya.json');

for (const name of ['twodood', 'nocturne'] as const) {
  if (/--demo-raw/.test(serverCommand(name))) {
    throw new Error('Refusing to export with --demo-raw. maya.json must never contain entry text.');
  }
}

const now = new Date();
const genDay = ymd(now);
const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
const shift = dayNumber(ANCHOR_DAY) - dayNumber(genDay);
if (shift % 7 !== 0) {
  console.warn(
    `Warning: generating on ${genDay}, which is not the same weekday as ${ANCHOR_DAY}. ` +
      'Weekly routines will land on the wrong weekdays. Run this on a Tuesday.',
  );
}

/** Real server date (YYYY-MM-DD) -> its offset from the generation day. */
const offsetOf = (date: string) => dayNumber(date) - dayNumber(genDay);
/** Offset -> the date it gets in maya.json, with ANCHOR_DAY as day 0. */
const anchored = (offset: number) => {
  const d = new Date(`${ANCHOR_DAY}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdayOf = (date: string) => WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

interface MoodPoint {
  date: string;
  entries: number;
  avgValence: number | null;
  avgArousal: number | null;
  topEmotions: string[];
}
interface Entry {
  id: string;
  date: string;
  time: string;
  mood: { primaryEmotion: string; valence: number; arousal: number };
  hasSongs: boolean;
  hasDrawing: boolean;
}
interface SongRow {
  entryId: string;
  date: string;
  picked: { title: string; artist: string } | null;
  playlist: { title: string; artist: string }[];
}

const servers = await connect();
try {
  // 2DooD: "all" with include_done covers every task. Undated and done are
  // read too as a cross-check, merged by id so nothing is lost or doubled.
  const views = await Promise.all([
    servers.callTool('twodood', 'list_tasks', { view: 'all', include_done: true, limit: 500 }),
    servers.callTool('twodood', 'list_tasks', { view: 'undated', include_done: true, limit: 500 }),
    servers.callTool('twodood', 'list_tasks', { view: 'done', limit: 500 }),
  ]);
  const byId = new Map<string, ReturnType<typeof parseTasks>[number]>();
  for (const text of views) for (const t of parseTasks(text, now)) if (!byId.has(t.id)) byId.set(t.id, t);

  // Nocturne: the demo journal covers the last 42 days. Ask for 60 to be safe.
  const range = { from: ymd(addDays(now, -60)), to: genDay };
  const [moodText, entriesText, songsText] = await Promise.all([
    servers.callTool('nocturne', 'get_mood_timeline', { ...range, bucket: 'day' }),
    servers.callTool('nocturne', 'list_entries', { ...range, limit: 200 }),
    servers.callTool('nocturne', 'list_songs', { ...range, limit: 200 }),
  ]);

  const tasks = [...byId.values()]
    .map((t) => {
      const offset = t.due ? offsetOf(ymd(t.due)) : null;
      const due = offset === null ? null : anchored(offset);
      return {
        id: t.id,
        title: t.title,
        due,
        dueTime: t.due ? hhmm(t.due) : null,
        weekday: due ? weekdayOf(due) : null,
        dayOffset: offset,
        priority: t.priority,
        done: t.done,
        overdue: !t.done && offset !== null && offset < 0,
        notes: t.notes,
      };
    })
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || (a.dueTime ?? '').localeCompare(b.dueTime ?? ''));

  const moods = nocturneJson<{ points: MoodPoint[] }>(moodText)
    .points.filter((p) => p.entries > 0 && p.avgValence !== null)
    .map((p) => {
      const offset = offsetOf(p.date);
      const date = anchored(offset);
      return {
        date,
        weekday: weekdayOf(date),
        dayOffset: offset,
        valence: p.avgValence,
        arousal: p.avgArousal,
        topEmotions: p.topEmotions,
        entryCount: p.entries,
      };
    });

  const entries = nocturneJson<{ entries: Entry[] }>(entriesText)
    .entries.map((e) => {
      const offset = offsetOf(e.date);
      return {
        id: e.id,
        date: anchored(offset),
        time: e.time,
        dayOffset: offset,
        emotion: e.mood.primaryEmotion,
        valence: e.mood.valence,
        arousal: e.mood.arousal,
        hasSongs: e.hasSongs,
        hasDrawing: e.hasDrawing,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const songs = nocturneJson<{ entries: SongRow[] }>(songsText)
    .entries.flatMap((row) => {
      const offset = offsetOf(row.date);
      const base = { date: anchored(offset), dayOffset: offset, entryId: row.entryId };
      return [
        ...(row.picked ? [{ ...base, title: row.picked.title, artist: row.picked.artist, pickedBy: 'maya' }] : []),
        ...row.playlist.map((s) => ({ ...base, title: s.title, artist: s.artist, pickedBy: 'nocturne' })),
      ];
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const json = {
    about:
      'Fictional demo data for the MeloMed hackathon starter. Maya Chen is a made-up college sophomore (biology major, climbs and runs), not a real person. ' +
      'tasks come from 2DooD, her to-do app. moods, entries and songs come from Nocturne, her journal app. ' +
      `Every date is written as if today is ${ANCHOR_DAY}. dayOffset is days from today (0 = today, -1 = yesterday, 4 = in four days). ` +
      'Mood is an automatic read of journal writing: valence runs from -1 (unpleasant) to 1 (pleasant), arousal from -1 (calm) to 1 (energized). ' +
      'The label "apathy" is how Nocturne marks tired days. Treat mood as a pattern for the person to look at, never a diagnosis. ' +
      'moods has one item per day that has a journal entry. Days with no entry are left out. Journal text is private and is not included.',
    generatedFor: ANCHOR_DAY,
    today: ANCHOR_DAY,
    timezone: 'America/New_York',
    person: { name: 'Maya Chen', fictional: true, description: 'College sophomore, biology major, climbs and runs' },
    tasks,
    moods,
    entries,
    songs,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(json, null, 2) + '\n');
  console.log(
    `Wrote ${OUT}\n  servers ran on ${genDay}, dates shifted ${shift >= 0 ? '+' : ''}${shift} days so today = ${ANCHOR_DAY}\n` +
      `  ${tasks.length} tasks, ${moods.length} mood days, ${entries.length} entries, ${songs.length} songs`,
  );
} finally {
  await servers.close();
}
