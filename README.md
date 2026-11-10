# MeloMed hack starter

Build a real app in an hour with a fictional student's tasks, moods and songs. No accounts, no setup, just one link.

Build something with a week in the life of **Maya Chen**, a fictional college sophomore. You get her to-do list and her journal moods, already lined up by date:

- **2DooD**, a student to-do app. Her tasks: classes, exams, climbing, calling home.
- **Nocturne**, a journaling app. Her mood for each day she wrote, the feelings it picked up, and the songs she attached. Never the words she wrote.

Maya is fictional. Every name, task and mood here is demo data.

Sponsor: [MeloMed](https://melomed.io). Developer guide: [melomed.io/developers](https://melomed.io/developers).

**Pick one path:**

| | Path A: JSON link | Path B: real MCP |
|---|---|---|
| Good for | v0, Replit, or any AI coding tool | Claude Desktop, Claude Code, Cursor |
| Install | Nothing | Node.js 20 or newer |
| Time to start | 5 minutes | 10 minutes |
| Counts for the MeloMed prize | Yes | Yes, with extra credit |

## Path A: no install, 5 minutes

You only need a browser and an account on a web AI builder. No terminal.

**The data link:** `https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json`

1. Open the link above in a new tab. You will see a page of text that starts with `"about"`. That is all of Maya's data.
2. Open your builder (v0, Replit, Claude Code or Cursor) and start a new project.
3. Copy the prompt for your builder below, paste it in, and send it.
4. If the builder says it cannot load the link, go back to the tab from step 1, select all, copy, and paste the text into the chat with: "Use this JSON as the data instead of fetching it."

### What is in the file

One file, five lists. Every item has a `date` (like `2026-11-17`) and a `dayOffset` (0 = today, -1 = yesterday, 4 = four days from now). In the file, today is **2026-11-17**, the day of the hackathon.

| Key | One item looks like |
|---|---|
| `tasks` | `{ "title": "CHEM 201 exam 2", "due": "2026-11-21", "dueTime": "10:00", "weekday": "Sat", "dayOffset": 4, "priority": "high", "done": false, "overdue": false, "notes": "Covers chapters 7 to 11." }` |
| `moods` | `{ "date": "2026-11-17", "weekday": "Tue", "dayOffset": 0, "valence": 0.02, "arousal": 0.45, "topEmotions": ["anxiety", "anticipation", "contentment"], "entryCount": 1 }` |
| `entries` | `{ "id": "...", "date": "2026-11-17", "time": "08:40", "dayOffset": 0, "emotion": "anxiety", "valence": 0.02, "arousal": 0.45, "hasSongs": true, "hasDrawing": false }` |
| `songs` | `{ "date": "2026-11-17", "dayOffset": 0, "entryId": "...", "title": "Coffee", "artist": "beabadoobee", "pickedBy": "maya" }` |

Plus `about` (a plain-words description), `today`, `timezone` and `person`.

- `valence` runs from -1 (unpleasant) to 1 (pleasant). `arousal` runs from -1 (calm) to 1 (energized).
- `moods` has one item per day Maya wrote in her journal. Days with no entry are not in the list.
- `priority` is `"none"`, `"medium"` or `"high"`. `due` is `null` for tasks with no date.
- `overdue` is true when a task is past its date and still not done.
- `apathy` is how Nocturne labels tired days.

### Prompt for v0

```text
Build a single-page React app called "Maya's Week". Fetch JSON from https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json when the page loads.
The JSON has: today (a date string), tasks (title, due, dueTime, priority, done, overdue, dayOffset),
and moods (date, valence from -1 to 1, topEmotions, an array of words).
Show 14 rows, from 6 days before `today` to 7 days after. Each row shows the date, that day's mood
(find the item in moods with the same date, draw valence as a small bar that is green above 0 and
red below 0, and list topEmotions), and every task whose `due` equals that date. Strike through
tasks where done is true. Mark tasks where overdue is true as "missed". Put a red "!" before
tasks with priority "high". Highlight the row for `today`. If a day has no item in moods, show
"No journal entry". Add a footer: "Maya Chen is fictional demo data. Mood is a pattern, not a diagnosis."
```

### Prompt for Claude Code or Cursor

```text
Make a calm, friendly web app called "Start Here" that helps a student pick what to do first today.
Load the data from https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json. Use these fields only:
- today: the current date
- tasks: title, due, dueTime, priority, done, overdue
- moods: date, valence (from -1 unpleasant to 1 pleasant), topEmotions
Main screen: the tasks where due equals today and done is false, plus any task where overdue is true.
Above them, a small card with the last 3 items in moods (by date, up to today) showing the date,
valence as a colored dot, and topEmotions. If the average valence of those 3 days is below 0,
suggest starting with the shortest-looking task. Otherwise suggest the task with priority "high"
or the earliest dueTime. Explain the suggestion in one short sentence. Never call mood a diagnosis
or a health score. Say in the footer that Maya Chen is fictional demo data.
```

### Prompt for Replit

```text
Create a small web app (plain HTML, CSS and JavaScript is fine) called "Mood Mixtape".
Fetch JSON from https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json. It has:
- songs: date, title, artist, pickedBy, entryId
- moods: date, valence (from -1 to 1), topEmotions
For each item in songs, find the item in moods with the same date. Make two playlists:
"Good days" (songs on days with valence above 0.3) and "Hard days" (valence below 0).
Show each song as a card with title, artist, the date and that day's topEmotions.
Add a button that copies a playlist as plain text, one "title - artist" per line.
Footer: "Maya Chen is fictional demo data from the MeloMed hack starter."
```

Want the to-do list and the mood list in one idea? Ask your builder to "join `tasks` and `moods` on the date field". That is the move that makes this data interesting.

## Path B: the real MCP servers

Both servers are on npm and run in demo mode with Maya's data. No accounts, no sign-in, no network once installed. Dates are relative to the moment you start them, so in Path B "today" is the real today.

```sh
npx -y 2dood-mcp --demo
npx -y nocturne-mcp --demo
```

You do not run these yourself. Your AI app starts them. Pick your app:

**Claude Desktop, Cursor and other apps that read `mcpServers` JSON.** Add this to the app's MCP config (Claude Desktop: Settings, Developer, Edit Config. Cursor: `~/.cursor/mcp.json`), then restart the app. The same block is in `claude_desktop_config.example.json`.

```json
{
  "mcpServers": {
    "2dood-demo": {
      "command": "npx",
      "args": ["-y", "2dood-mcp", "--demo"]
    },
    "nocturne-demo": {
      "command": "npx",
      "args": ["-y", "nocturne-mcp", "--demo"]
    }
  }
}
```

**Claude Code:**

```sh
claude mcp add 2dood-demo -s user -- npx -y 2dood-mcp --demo
claude mcp add nocturne-demo -s user -- npx -y nocturne-mcp --demo
```

Then ask something like "compare my mood with my deadlines this month" or "plan my next 4 days around my exam".

### Tools

| Server | Tools | Notes |
|---|---|---|
| 2DooD | `list_tasks`, `search_tasks`, `add_tasks`, `update_task`, `complete_task`, `delete_task` | Changes live in memory and reset when the server restarts |
| Nocturne | `get_mood_timeline`, `list_entries`, `list_songs`, `get_connection_info` | Read-only. `get_entry_text` is refused unless the server starts with `--demo-raw` |

### Code it yourself (TypeScript starter)

You need Node.js 20 or newer.

```sh
npm install
npm run week      # last 7 days and next 7, mood next to tasks
npm run stress    # mood before and after each big deadline
npm run agent     # Claude plans your week with both servers (needs ANTHROPIC_API_KEY)
```

All code that talks to the servers is in `src/connect.ts`. It starts both servers and gives you one function:

```ts
import { connect } from './src/connect.ts'

const servers = await connect()
const text = await servers.callTool('twodood', 'list_tasks', { view: 'week' })
const mood = await servers.callTool('nocturne', 'get_mood_timeline', { bucket: 'day' })
await servers.close()
```

2DooD tools return readable lines (`parseTasks()` turns them into objects). Nocturne tools return a one-line summary and then JSON (`nocturneJson()` pulls out the JSON).

| Example | Command | What it shows |
|---|---|---|
| `examples/01-week-overview.ts` | `npm run week` | One line per day: mood from Nocturne, tasks due from 2DooD |
| `examples/02-stress-vs-deadlines.ts` | `npm run stress` | For each high-priority deadline in the past 6 weeks, average mood in the 3 days before vs the 3 days after |
| `examples/03-claude-agent.ts` | `npm run agent` | Hands Claude every tool from both servers and asks it to plan the next 4 days. Skips itself without `ANTHROPIC_API_KEY` |
| `examples/web/index.html` | see below | The Path A data in a plain web page, tasks next to that day's mood |

Example 3 takes your own question too: `npm run agent -- "What should I drop this week?"`.

To see the web example, serve the repo folder and open the page:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/examples/web/index.html
```

To point it at the hosted file instead, add `?src=https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json` to the address.

To run against a local build of a server, set `TWODOOD_MCP_CMD` or `NOCTURNE_MCP_CMD` to the full command, for example `TWODOOD_MCP_CMD="node /path/to/2dood-mcp/dist/index.js --demo"`.

## Maya's story

The same story runs through both apps. In the JSON file, today is Tue Nov 17 2026. With the real servers, today is the day you run them.

| Day (0 = today) | JSON date | What happens |
|---|---|---|
| -24 to -21 | Oct 24 to Oct 27 | Stressed week before the CHEM 201 midterm on day -21, relief after |
| -10 to -8 | Nov 7 to Nov 9 | A rough patch: missed tasks, a fight with her roommate |
| -3 | Nov 14 | BIO 210 lab report due, turned in a day late |
| +4 | Nov 21 | CHEM 201 exam 2 |
| +9 | Nov 26 | BIO 210 problem set |
| +12 | Nov 29 | Internship application due |
| weekly | | Climbing Tue and Thu, long run and a call home on Sunday |

## Project ideas

Each one fits in about an hour and uses the data for real. Pick one, or mash two together.

**Wellness, life and productivity track**

1. **Start here card.** Today's tasks plus the last 3 days of mood, and one line on which task to start with and why.
2. **Exam runway.** Count back from CHEM 201 exam 2 and lay out study blocks, putting the hard ones on the kind of days that usually feel best (climbing days).
3. **Gentle rescheduler.** When the last few moods trend low and the list is long, offer to push the tasks that are not urgent back a day, one tap to accept.

**Open track (any consumer idea)**

1. **Mood mixtape.** Turn the songs from good days and hard days into two playlists with cover-style cards, ready to share.
2. **Outfit forecast.** A daily outfit color palette picked from yesterday's mood and what is due today (bold for exam day, cozy for low days).
3. **Maya's pet.** A tiny virtual pet whose energy follows Maya's mood and that grows a little every time a task is done.

## Prizes

Each team can win one prize.

**Grand prize: an AirTag for every member of the winning team** (from WinC).

**MeloMed prize: best use of the 2DooD or Nocturne tools.** A phone stand for every member of the winning team, upgraded to laptop stands if Luma RSVPs reach 40 by Nov 15. Both the JSON link (Path A) and the real MCP servers (Path B) count. Real MCP use gets extra credit.

How the MeloMed prize is judged:

- **Real use.** The data does real work in your app, not a token call.
- **Connects things.** It ties tasks and moods together (or songs and moods, or all three).
- **Respects privacy.** Demo data only. No diagnosis or treatment claims.
- **Works live.** It runs in your 60-second pitch.

## Permission model

Nocturne's default tools never return what someone wrote, only dates, mood labels, numbers and songs. Full entry text is a separate permission that is off by default, and in demo mode it turns on only when the server starts with `--demo-raw`. Every request, allowed or refused, goes into an access log, and `get_connection_info` returns that log so you can show people exactly what your app read. The JSON file follows the same rule: it has no journal text at all.

## Rules

- Use the demo data only. Maya Chen is fictional.
- Do not connect real people's journals or task lists, including your own, to a hackathon project.
- Do not present mood data as a diagnosis, assessment or clinical finding. Show it as a pattern for the person to interpret.

## For organizers: regenerating maya.json

```sh
npm install
npm run export-json
```

This starts both demo servers (never with `--demo-raw`), reads every task, the daily mood timeline, the entry list and the songs, and writes `public/maya.json`. The servers have no clock setting, so the script reads them on the real date, gives every item a `dayOffset`, and writes dates as if today were 2026-11-17. Run it on a Tuesday so the weekly routines land on the right weekdays (it warns you if not). The snapshot also reflects the time of day it ran: today's 08:40 journal entry is in, and today's 6 PM climbing session is not done yet.

## License

MIT, see `LICENSE`.
