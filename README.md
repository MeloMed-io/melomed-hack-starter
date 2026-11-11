# MeloMed hack starter

Build a real app in an hour with a fictional student's tasks, moods and songs. No accounts, no setup, just one link.

Build something with a week in the life of **Maya Chen**, a fictional college sophomore. You get her to-do list and her journal moods, already lined up by date:

- **2DooD**, a student to-do app. Her tasks: classes, exams, climbing, calling home.
- **Nocturne**, a journaling app. Her mood for each day she wrote, the feelings it picked up, and the songs she attached. Never the words she wrote.

Maya is fictional. Every name, task and mood here is demo data.

**New here? Start with the [Start here page](https://www.melomed.io/hack):** three steps and a Copy button for each prompt, no install. **See it running:** [a finished example app](https://www.melomed.io/hack/example) built on this data.

Sponsor: [MeloMed](https://melomed.io). Developer guide: [melomed.io/developers](https://melomed.io/developers).

**Pick one path:**

| | Path A: JSON link | Path B: real MCP |
|---|---|---|
| Good for | v0, Replit, or any AI coding tool | Claude Desktop, Claude Code, Cursor |
| Install | Nothing | Node.js 20 or newer |
| Time to start | 5 minutes | 10 minutes |
| Counts for the MeloMed prize | Yes | Yes, with extra credit |

## Path A: no install, 5 minutes

You only need a browser and an AI builder. With v0 or Replit there is no terminal at all. Claude Code and Cursor also work here if you already have one of them set up.

**The data link:** [https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json](https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json)

1. Open the link above in a new tab. You will see a page of text that starts with `{ "about":`. That is all of Maya's data.
2. Open your builder (v0, Replit, Claude Code or Cursor) and start a new project.
3. Copy the prompt for your builder below (hover over the box on GitHub and click the copy icon in its corner), paste it in, and send it.
4. If the builder says it cannot load the link, go back to the tab from step 1, select all, copy, and paste the text (about 45 KB) into the chat with: "Use this JSON as the data instead of fetching it."

The link works from any web page: it allows cross-origin requests, so `fetch(url).then(r => r.json())` runs in the browser with no proxy.

### What is in the file

One file, four lists. Tasks have a `due` date, and moods, entries and songs have a `date`, all written like `2026-11-17`. Every item also has a `dayOffset` (0 = today, -1 = yesterday, 4 = four days from now). Tasks with no date have `due` and `dayOffset` set to `null`. In the file, today is **2026-11-17**, the day of the hackathon.

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
- Compare dates as plain text (`task.due === mood.date`). Do not turn `"2026-11-17"` into a `Date` with `new Date("2026-11-17")`. That reads it as midnight UTC, which is still Nov 16 in New York, so every label shifts back a day. To step through days, use `new Date(today + "T12:00:00Z")` with `setUTCDate` and `toISOString().slice(0, 10)`.

### Prompt for v0

```text
Build a single-page React app called "Maya's Week". When the page loads, fetch JSON from this URL:
https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json
The JSON has: today (a "YYYY-MM-DD" string), tasks (title, due, dueTime, priority, done, overdue, dayOffset),
and moods (date, valence from -1 to 1, topEmotions, an array of words).
Show 14 rows, from 6 days before `today` to 7 days after. Treat every date as a "YYYY-MM-DD" string.
To build the 14 dates, start from new Date(today + "T12:00:00Z"), step with setUTCDate, and format
with toISOString().slice(0, 10). Never use new Date(today) with local getters, it shows the day before.
Each row shows the weekday and date, that day's mood (find the item in moods with the same date,
draw valence as a small bar that is green above 0 and red below 0, and list topEmotions), and every
task whose `due` equals that date. Strike through tasks where done is true. Mark tasks where overdue
is true as "missed". Put a red "!" before tasks with priority "high". Highlight the row for `today`.
For a day up to and including today with no item in moods, show "No journal entry". For days after
today, leave the mood area empty. Add a footer: "Maya Chen is fictional demo data. Mood is a pattern, not a diagnosis."
```

### Prompt for Claude Code or Cursor

```text
Make a calm, friendly web app called "Start Here" that helps a student pick what to do first today.
Make it one index.html file that I can open in a browser. Load the data with fetch from this URL:
https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json
Use these fields only:
- today: the current date, a "YYYY-MM-DD" string
- tasks: title, due ("YYYY-MM-DD" or null), dueTime ("HH:MM" or null), priority ("none", "medium" or "high"), done, overdue
- moods: date, valence (from -1 unpleasant to 1 pleasant), topEmotions
Compare dates as strings, never through new Date().
Main screen: the tasks where due equals today and done is false, plus every task where overdue is true.
Above them, a small card with the last 3 items in moods with date up to today, showing the date,
valence as a colored dot, and topEmotions. If the average valence of those 3 days is below 0,
suggest the main-screen task with the shortest title, as a small win. Otherwise sort the main-screen
tasks by priority (high, then medium, then none), then by due date, then by dueTime, and suggest the
first one. Explain the suggestion in one short sentence. Never call mood a diagnosis or a health
score. Say in the footer that Maya Chen is fictional demo data.
```

### Prompt for Replit

```text
Create a small web app (plain HTML, CSS and JavaScript is fine) called "Mood Mixtape".
Fetch JSON from this URL:
https://raw.githubusercontent.com/MeloMed-io/melomed-hack-starter/main/public/maya.json
It has:
- songs: date, title, artist, pickedBy, entryId
- moods: date, valence (from -1 to 1), topEmotions
For each item in songs, find the item in moods with the same date (compare the date strings).
Make two playlists: "Good days" (songs on days with valence above 0.3) and "Hard days"
(valence below 0). Songs from in-between days go in neither list.
Show each song as a card with title, artist, the date and that day's topEmotions.
Add a button that copies a playlist as plain text, one "title - artist" per line.
Footer: "Maya Chen is fictional demo data from the MeloMed hack starter."
```

Want the to-do list and the mood list in one idea? Ask your builder to "join `tasks` and `moods` on the date field". That is the move that makes this data interesting.

## Path B: the real MCP servers

Both servers are on npm and run in demo mode with Maya's data. No accounts, no sign-in, no network once installed. Dates are relative to the moment you start them, so in Path B "today" is the real today.

**Before you start:** run `node -v` in a terminal. You need `v20` or higher. If the command is not found or the number is lower, install the LTS version from [nodejs.org](https://nodejs.org), then close and reopen your terminal and your AI app so they see it.

```sh
npx -y 2dood-mcp --demo
npx -y nocturne-mcp --demo
```

You do not run these yourself. Your AI app starts them. Pick your app:

**Claude Desktop, Cursor and other apps that read `mcpServers` JSON.** Open the app's MCP config (Claude Desktop: Settings, Developer, Edit Config. Cursor: Settings, MCP, or the file `~/.cursor/mcp.json`). If the file is empty, paste the block below as it is. If it already has an `"mcpServers"` section, copy only the two entries (`"2dood-demo"` and `"nocturne-demo"`) into it, with a comma between entries. Save, then quit and reopen the app. The same block is in `claude_desktop_config.example.json`.

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

Run `claude mcp list` to check that both show as connected. `-s user` makes them available in every folder. When the hackathon is over, remove them with `claude mcp remove 2dood-demo -s user` and `claude mcp remove nocturne-demo -s user`.

**On Windows (not WSL):** apps cannot start `npx` directly. In the JSON block, use `"command": "cmd"` and put `"/c", "npx"` at the front of `args`, like `"args": ["/c", "npx", "-y", "2dood-mcp", "--demo"]`. In Claude Code, add `cmd /c` after the `--`, like `claude mcp add 2dood-demo -s user -- cmd /c npx -y 2dood-mcp --demo`.

Then ask something like "compare my mood with my deadlines this month" or "plan my next 4 days around my exam".

### Tools

| Server | Tools | Notes |
|---|---|---|
| 2DooD | `list_tasks`, `search_tasks`, `add_tasks`, `update_task`, `complete_task`, `delete_task` | Changes live in memory and reset when the server restarts |
| Nocturne | `get_mood_timeline`, `list_entries`, `list_songs`, `get_connection_info` | Read-only. `get_entry_text` is refused unless the server starts with `--demo-raw` |

### Code it yourself (TypeScript starter)

You need Node.js 20 or newer (see "Before you start" above) and git. Get the code first, then run the examples from inside the folder:

```sh
git clone https://github.com/MeloMed-io/melomed-hack-starter.git
cd melomed-hack-starter
npm install
npm run week      # last 7 days and next 7, mood next to tasks
npm run stress    # mood before and after each big deadline
npm run agent     # Claude plans your week with both servers (needs ANTHROPIC_API_KEY)
```

No git? On the GitHub page, click Code, then Download ZIP, unzip it, and open a terminal in that folder. If `npm install` prints warnings about install scripts or funding, you can ignore them. The first `npm run week` takes a few extra seconds while `npx` downloads the two servers.

To run example 3, set your own key in the same terminal first. On macOS and Linux: `export ANTHROPIC_API_KEY=sk-ant-...`. In Windows PowerShell: `$env:ANTHROPIC_API_KEY="sk-ant-..."`. Without a key it prints a short note and exits, and examples 1 and 2 still work.

All code that talks to the servers is in `src/connect.ts`. It starts both servers and gives you one function. Save this as `mine.ts` in the repo folder and run it with `npx tsx mine.ts`:

```ts
import { connect } from './src/connect.ts'

const servers = await connect()
const text = await servers.callTool('twodood', 'list_tasks', { view: 'week' })
const mood = await servers.callTool('nocturne', 'get_mood_timeline', { bucket: 'day' })
console.log(text, mood)
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

On Windows, use `py -m http.server 8000` instead. No Python? `npx -y serve -l 8000 .` does the same job with Node.

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
2. **Exam runway.** Count back from CHEM 201 exam 2 and lay out study blocks, putting the hard ones on the kind of days that usually feel best (climbing days). Moods only go up to today, so average past moods by their `weekday` to guess which future days feel good.
3. **Gentle rescheduler.** When the last few moods trend low and the list is long, offer to push the tasks that are not urgent back a day, one tap to accept.

**Open track (any consumer idea)**

1. **Mood mixtape.** Turn the songs from good days and hard days into two playlists with cover-style cards, ready to share.
2. **Outfit forecast.** A daily outfit color palette picked from yesterday's mood and what is due today (bold for exam day, cozy for low days).
3. **Maya's pet.** A tiny virtual pet whose energy follows Maya's mood and that grows a little every time a task is done.

## Prizes

Each team can win one prize.

**Grand prize: an AirTag for every member of the winning team** (from WinC).

How the grand prize is judged:

- **Real use case.** A real person has this problem, and your project actually solves it.
- **Works live.** The demo runs on the day.
- **Fresh idea.** Not a copy of an app everyone already uses.
- **Clear pitch.** In 60 seconds, we get what it does and who it is for.

**MeloMed prize: best use of the 2DooD or Nocturne tools.** A cute animal phone stand for every member of the winning team. Both the JSON link (Path A) and the real MCP servers (Path B) count. Real MCP use gets extra credit.

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
