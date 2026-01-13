# Canvas LMS CLI & MCP Server

A Deno-based tool for querying Canvas LMS student data, designed for both human use (CLI) and LLM integration (MCP server). Perfect for parents who want to discuss their child's academic progress through natural language.

## Features

- **CLI Tool**: Query grades, assignments, and missing work from the command line
- **MCP Server**: Expose Canvas data to LLMs like Claude for natural language queries
- **Observer Support**: Works with parent/observer accounts to view student data
- **Smart Missing Detection**: Catches unsubmitted assignments that Canvas hasn't flagged yet

## Quick Start

### 1. Get a Canvas API Token

1. Log into Canvas
2. Go to **Account** → **Settings**
3. Scroll to **Approved Integrations**
4. Click **+ New Access Token**
5. Copy the token

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
CANVAS_API_TOKEN=your_token_here
CANVAS_BASE_URL=https://yourschool.instructure.com
CANVAS_STUDENT_ID=self
```

For **parent/observer accounts**, you'll need your child's student ID. Run `canvas courses` after setup - the student ID will be in the API responses, or you can find it in Canvas URLs.

### 3. Install Deno

```bash
# macOS
brew install deno

# Or see https://deno.land/manual/getting_started/installation
```

### 4. Run the CLI

```bash
# List courses with grades
deno task dev courses --format table

# Show missing assignments
deno task dev missing --student <student_id> --format table

# Include unsubmitted past-due (catches things Canvas missed)
deno task dev missing --student <student_id> --include-unsubmitted --format table

# What's due soon
deno task dev assignments --all-courses --upcoming 7
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `courses` | List all courses with current grades |
| `missing` | Show missing assignments |
| `assignments` | List assignments (filterable) |
| `grades` | Show grades/submissions for a course |
| `upcoming` | Show upcoming events |

### Global Options

| Option | Description |
|--------|-------------|
| `--format <json\|table>` | Output format (default: json) |
| `--student <id>` | Student ID for observer accounts |

### Missing Command Options

| Option | Description |
|--------|-------------|
| `--summary` | Show count by course instead of individual items |
| `--course-id <id>` | Filter to specific course |
| `--include-unsubmitted` | Include past-due items not yet flagged as missing |

## MCP Server Setup

The MCP server allows LLMs like Claude to query Canvas data directly.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "canvas": {
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "--allow-env",
        "--allow-read",
        "/absolute/path/to/agent.ts"
      ],
      "env": {
        "CANVAS_API_TOKEN": "your_token_here",
        "CANVAS_BASE_URL": "https://yourschool.instructure.com"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_courses` | List all courses with current grades |
| `get_missing_assignments` | Get Canvas-flagged missing assignments |
| `get_unsubmitted_past_due` | Get past-due assignments not yet flagged (catches more!) |
| `get_due_this_week` | All assignments due in next N days across all courses |
| `get_upcoming_assignments` | Upcoming assignments for a single course |
| `list_assignments` | Search/filter assignments in a course |

## Example Prompts

Once connected via MCP, you can ask Claude things like:

### Daily Check-in
> "What does my child have due this week? Are they caught up?"

### Missing Work
> "Show me all the missing assignments. Which ones are the oldest?"

### Grade Check
> "How are the grades looking across all classes? Any concerns?"

### Specific Class
> "What's going on in Math class? Any missing work or upcoming tests?"

### Unsubmitted Work
> "Are there any assignments past their due date that haven't been submitted yet?"

### Planning
> "What's due in the next 3 days? Help me prioritize what needs to get done first."

## Example Conversations

**You:** "Quick update on school - anything I should know about?"

**Claude:** *calls get_courses, get_unsubmitted_past_due, get_due_this_week*

"Here's the overview:

**Grades:**
- Math: 85% (B)
- English: 91% (A-)
- Science: 78% (C+) ⚠️

**Needs Attention:**
- 'Quizizz equations' in Math was due Jan 9 - not submitted
- 'Flowers for Algernon Theme' in English was due yesterday

**Coming Up This Week:**
- Intelligence Essay (English) - due Thursday
- Substitution worksheet (Math) - due Thursday

I'd prioritize getting those two past-due assignments submitted first, then focus on the Thursday deadlines."

---

**You:** "Why is Science at a C+?"

**Claude:** *calls get_missing_assignments with course filter*

"Looking at Science specifically - there are 2 missing assignments:
- 'Bill Nye Heat Video' (Dec 19) - 100 points
- 'Energy Notes Review' (Dec 18) - 100 points

Those two zeros are likely what's dragging down the grade. Worth checking if they can still be submitted for partial credit."

## Architecture

```
src/
├── api/           # Canvas API client and endpoints
│   ├── client.ts  # HTTP client with auth and pagination
│   ├── courses.ts
│   ├── assignments.ts
│   ├── submissions.ts
│   └── users.ts
├── commands/      # CLI commands
├── types/         # TypeScript interfaces
└── utils/         # Config, output formatting

agent.ts           # MCP server entry point
main.ts            # CLI entry point
```

## Development

```bash
# Run CLI in dev mode
deno task dev <command>

# Type check
deno task check

# Lint & format
deno task lint
deno task fmt

# Build standalone binary
deno task build
```

## Canvas API Notes

- **Rate Limits**: Canvas enforces rate limits; the client requests 100 items per page to minimize calls
- **Observer Access**: Parent accounts access student data by using the student ID in API paths
- **Missing vs Unsubmitted**: Canvas's "missing" flag isn't always immediate - use `--include-unsubmitted` to catch everything

## License

MIT
