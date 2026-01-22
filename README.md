# Canvas LMS MCP Server

[![CI](https://github.com/mtgibbs/canvas-lms-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/mtgibbs/canvas-lms-mcp/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/%40mtgibbs%2Fcanvas-lms-mcp.svg)](https://www.npmjs.com/package/@mtgibbs/canvas-lms-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) server that connects AI assistants like Claude to your Canvas LMS account. Query grades, assignments, missing work, and more through natural language.

**Perfect for:** Parents monitoring their child's academic progress, students tracking their own work, or anyone who wants to interact with Canvas data through AI.

## What Can It Do?

Ask Claude things like:
- "What assignments are due this week?"
- "Show me missing assignments across all classes"
- "What's my grade in Biology?"
- "Are there any late assignments I should know about?"
- "What's on the to-do list for the next 7 days?"

## Installation Options

Choose the method that works best for you:

| Method | Best For | Credential Storage |
|--------|----------|-------------------|
| [Desktop Extension](#option-1-desktop-extension-recommended) | Easy one-click install | OS Keychain (secure) |
| [npm Package](#option-2-npm-package) | Flexibility, 1Password users | Config file or password manager |

---

## Prerequisites (All Methods)

### 1. Get Your Canvas API Token

1. Log into your Canvas LMS instance (e.g., `https://yourschool.instructure.com`)
2. Go to **Account** → **Settings**
3. Scroll to **Approved Integrations**
4. Click **+ New Access Token**
5. Give it a name (e.g., "Claude MCP") and click **Generate Token**
6. **Copy the token immediately** - you won't be able to see it again

### 2. Find Your Canvas Base URL

Your Canvas base URL is the main URL you use to access Canvas:
- `https://yourschool.instructure.com`
- `https://canvas.yourdistrict.org`

---

## Option 1: Desktop Extension (Recommended)

The easiest way to get started. Your API token is stored securely in your operating system's keychain.

### Install

1. Download the latest `.mcpb` file from [Releases](https://github.com/mtgibbs/canvas-lms-mcp/releases)
2. Double-click to install, or drag into Claude Desktop
3. Claude Desktop will prompt you to enter your Canvas credentials
4. Done! Start chatting about your courses

### What Gets Stored

- **API Token** → macOS Keychain / Windows Credential Manager (encrypted)
- **Base URL** → Claude Desktop settings
- **Student ID** → Claude Desktop settings (if using observer account)

---

## Option 2: npm Package

More flexible setup with multiple credential management options.

**Requires:** [Node.js 18+](https://nodejs.org/)

### Basic Setup

Edit your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@mtgibbs/canvas-lms-mcp"],
      "env": {
        "CANVAS_API_TOKEN": "your_token_here",
        "CANVAS_BASE_URL": "https://yourschool.instructure.com"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

## Securing Your API Token

The basic setup stores your token in plain text. Here are more secure alternatives:

### Option A: 1Password CLI (Recommended for 1Password Users)

If you use [1Password](https://1password.com/), you can inject secrets at runtime so they never touch your config file.

**1. Install the 1Password CLI:** [Download here](https://1password.com/downloads/command-line/)

**2. Store your Canvas credentials in 1Password** (note the vault and item names)

**3. Create a wrapper script** at `~/.config/canvas-mcp-wrapper.sh`:

```bash
#!/bin/bash
# Canvas MCP 1Password Wrapper

# Ensure 1Password CLI is authenticated
if ! op account get &>/dev/null 2>&1; then
    eval $(op signin)
fi

# Export credentials from 1Password and run the MCP server
export CANVAS_API_TOKEN=$(op read "op://Private/Canvas LMS/token")
export CANVAS_BASE_URL=$(op read "op://Private/Canvas LMS/url")
# Uncomment for observer accounts:
# export CANVAS_STUDENT_ID=$(op read "op://Private/Canvas LMS/student_id")

exec npx -y @mtgibbs/canvas-lms-mcp
```

**4. Make it executable:**
```bash
chmod +x ~/.config/canvas-mcp-wrapper.sh
```

**5. Update your Claude Desktop config:**
```json
{
  "mcpServers": {
    "canvas": {
      "command": "/Users/YOUR_USERNAME/.config/canvas-mcp-wrapper.sh",
      "args": []
    }
  }
}
```

Now your token lives in 1Password and is only loaded when the MCP server starts.

### Option B: Shell Environment Variables (Claude Code)

If you're using Claude Code (CLI), you can use environment variable expansion:

**1. Add to your shell profile** (`~/.zshrc` or `~/.bashrc`):
```bash
export CANVAS_API_TOKEN="your_token_here"
export CANVAS_BASE_URL="https://yourschool.instructure.com"
```

**2. In your `.mcp.json` or Claude Code config**, use variable expansion:
```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@mtgibbs/canvas-lms-mcp"],
      "env": {
        "CANVAS_API_TOKEN": "${CANVAS_API_TOKEN}",
        "CANVAS_BASE_URL": "${CANVAS_BASE_URL}"
      }
    }
  }
}
```

### Option C: Restrict File Permissions

If you must store the token in the config file, at least restrict access:

```bash
# macOS/Linux
chmod 600 ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

---

## For Parent/Observer Accounts

If you're a parent with an observer account linked to your child's Canvas account, add the student ID:

### Desktop Extension
Enter the Student ID when prompted during setup.

### npm Package
Add `CANVAS_STUDENT_ID` to your environment variables:
```json
{
  "env": {
    "CANVAS_API_TOKEN": "...",
    "CANVAS_BASE_URL": "...",
    "CANVAS_STUDENT_ID": "123456"
  }
}
```

### Finding Your Child's Student ID

1. Log into Canvas with your observer account
2. The student ID appears in URLs when viewing their information (e.g., `/users/123456`)
3. Or ask your school's Canvas administrator

---

## Available Tools

Once connected, Claude has access to these capabilities:

| Tool | Description |
|------|-------------|
| `get_courses` | List all courses with current grades |
| `get_missing_assignments` | Assignments flagged as missing by Canvas |
| `get_unsubmitted_past_due` | Past-due work not yet submitted |
| `get_upcoming_assignments` | Assignments due soon for a specific course |
| `get_due_this_week` | All assignments due across all courses |
| `list_assignments` | Search/filter assignments by status |
| `get_stats` | Late/missing statistics by course |
| `get_todo` | Planner items and to-do list |

---

## Available Prompts

Prompts are pre-built conversation starters that guide Claude through common workflows:

| Prompt | Description |
|--------|-------------|
| `daily-checkin` | Quick daily overview of grades, due items, and concerns |
| `week-planning` | Plan the upcoming week with prioritized assignments |
| `course-analysis` | Deep dive into a specific course's performance |
| `grade-recovery` | Find opportunities to improve grades through extra credit or resubmissions |
| `missing-work-audit` | Comprehensive audit of all missing and late work |

### Using Prompts

In Claude Desktop, you can trigger prompts directly:

1. Click the **prompt icon** (📝) in the chat input
2. Select a prompt from the list
3. Fill in any required parameters (like student ID)
4. Claude will execute the workflow using the appropriate tools

Or just ask naturally - Claude will use the right tools:
> "Can you do a daily check-in for my student?"

---

## Example Conversations

These examples show realistic interactions, including which tools Claude calls and what output to expect.

### Example 1: Daily Check-in

**User prompt:**
> "Give me a quick update on my kid's school situation"

**Tools called:**
1. `get_courses` - retrieves all courses with current grades
2. `get_missing_assignments` - checks for missing work
3. `get_due_this_week` - finds upcoming deadlines

**Claude's response:**
> Here's today's overview for your student:
>
> **Current Grades:**
> - AP Biology: 92% (A-)
> - English 11: 87% (B+)
> - US History: 78% (C+)
> - Algebra 2: 91% (A-)
>
> **Needs Attention:**
> - "Chapter 12 Reading Quiz" in US History - due yesterday, not submitted
> - "Lab Report: Photosynthesis" in AP Biology - due 2 days ago
>
> **Coming Up This Week:**
> - Essay Draft (English 11) - due Thursday
> - Unit Test (Algebra 2) - due Friday
>
> I'd recommend prioritizing those two missing assignments first, especially the History quiz since that class has the lowest grade.

---

### Example 2: Finding Missing Work

**User prompt:**
> "What assignments are missing across all classes?"

**Tools called:**
1. `get_missing_assignments` - gets Canvas-flagged missing items
2. `get_unsubmitted_past_due` - catches items Canvas may have missed

**Claude's response:**
> I found 4 missing assignments:
>
> | Assignment | Course | Due Date | Points |
> |------------|--------|----------|--------|
> | Chapter 12 Reading Quiz | US History | Jan 18 | 20 |
> | Lab Report: Photosynthesis | AP Biology | Jan 16 | 50 |
> | Vocabulary Set 8 | English 11 | Jan 15 | 15 |
> | Problem Set 7.3 | Algebra 2 | Jan 10 | 25 |
>
> **Total points at risk:** 110 points
>
> The Biology lab report is worth the most - I'd start there. The Algebra problem set is oldest, so check if late submissions are still accepted.

---

### Example 3: Planning the Week

**User prompt:**
> "What's due in the next 7 days? Help me prioritize."

**Tools called:**
1. `get_due_this_week` - retrieves all assignments due in the next 7 days
2. `get_stats` - gets late/missing statistics for context

**Claude's response:**
> Here's what's coming up in the next 7 days:
>
> **High Priority (worth 50+ points):**
> - Unit 5 Test (Algebra 2) - Friday, Jan 24 - 100 points
> - Research Paper Draft (English 11) - Thursday, Jan 23 - 75 points
>
> **Medium Priority:**
> - Lab Questions (AP Biology) - Wednesday, Jan 22 - 30 points
> - Map Quiz (US History) - Tuesday, Jan 21 - 25 points
>
> **Lower Priority:**
> - Discussion Post (English 11) - Sunday, Jan 26 - 10 points
>
> **Suggested Schedule:**
> - Monday: Start research paper outline
> - Tuesday: Map quiz prep + continue paper
> - Wednesday: Bio lab questions
> - Thursday: Finish and submit paper
> - Friday: Algebra test prep
>
> Note: US History currently has 2 missing assignments, so staying current there is important.

---

## Troubleshooting

### "CANVAS_API_TOKEN is required"
Your API token isn't being passed correctly. Double-check:
- The token is in the `env` section of your config
- There are no extra spaces or quotes around the token
- The config file is valid JSON
- If using 1Password wrapper, run it manually to test: `~/.config/canvas-mcp-wrapper.sh`

### "CANVAS_BASE_URL is required"
Make sure your Canvas URL is set and includes `https://`.

### Server not appearing in Claude
- Restart Claude Desktop completely
- Check that your config file is valid JSON (use a [JSON validator](https://jsonlint.com/))
- Ensure Node.js 18+ is installed: `node --version`

### "Unauthorized" or 401 errors
- Your API token may have expired - generate a new one
- Make sure the token has the necessary permissions
- Verify the base URL is correct (no trailing slash)

### Can't see student data (parent accounts)
- Verify `CANVAS_STUDENT_ID` is set correctly
- Confirm your observer account is properly linked to the student in Canvas
- Try the student ID without quotes (as a number)

### 1Password wrapper not working
- Run `op signin` manually first to authenticate
- Check that the item path matches your vault: `op read "op://VaultName/ItemName/field"`
- Ensure the wrapper script is executable: `chmod +x ~/.config/canvas-mcp-wrapper.sh`

---

## Privacy & Security

### Data Collection

This MCP server collects and processes the following data **locally on your machine**:

| Data Type | Source | Purpose |
|-----------|--------|---------|
| Course information | Canvas API | Display grades and course lists |
| Assignment data | Canvas API | Show due dates, missing work, submissions |
| Student identifiers | Canvas API | Associate data with correct student |
| API credentials | User-provided | Authenticate with Canvas |

### Data Usage

- **Local processing only**: All data flows directly between Canvas and Claude on your machine
- **No external transmission**: This server does not send data to any third-party services
- **No telemetry**: We do not collect usage statistics, analytics, or crash reports
- **No data storage**: Data is fetched on-demand and not persisted between sessions

### Third-Party Services

This extension connects to:
- **Canvas LMS** (your school's instance): To retrieve academic data using your API token
- **Claude** (Anthropic): The AI assistant that processes your queries locally

We do not share your data with any other third parties.

### Data Retention

- **Session-based**: Data is only held in memory during active use
- **No caching**: Academic data is not cached or stored locally
- **Credentials**: Stored according to your installation method:
  - Desktop Extension: OS Keychain (macOS Keychain / Windows Credential Manager)
  - npm + 1Password: Your 1Password vault
  - npm with env vars: Your config file (recommend restricting file permissions)

### Your Rights

- You can revoke access at any time by deleting your Canvas API token
- Uninstalling the extension removes all local configuration
- Your school's Canvas instance retains its own data per their policies

### Security Measures

- **Token scope**: Your API token only accesses data you can already see in Canvas
- **Read-only operations**: This server only reads data; it cannot modify assignments or grades
- **No network exposure**: The server only communicates via local stdio, not over the network

### Contact

For privacy questions or concerns:
- **GitHub Issues**: [github.com/mtgibbs/canvas-lms-mcp/issues](https://github.com/mtgibbs/canvas-lms-mcp/issues)
- **Author**: [@mtgibbs](https://github.com/mtgibbs)

---

## Support

Need help? Here's how to get support:

- **Bug Reports**: [Open an issue](https://github.com/mtgibbs/canvas-lms-mcp/issues/new?template=bug_report.md)
- **Feature Requests**: [Open an issue](https://github.com/mtgibbs/canvas-lms-mcp/issues/new?template=feature_request.md)
- **Questions**: [Start a discussion](https://github.com/mtgibbs/canvas-lms-mcp/discussions)
- **Security Issues**: Please report security vulnerabilities privately via [GitHub Security Advisories](https://github.com/mtgibbs/canvas-lms-mcp/security/advisories/new)

Response times: We aim to respond to issues within a few days. This is a community project maintained in spare time.

---

## Development

This project is built with [Deno](https://deno.land/) and uses [dnt](https://github.com/denoland/dnt) for npm packaging.

```bash
# Clone the repo
git clone https://github.com/mtgibbs/canvas-lms-mcp.git
cd canvas-lms-mcp

# Run MCP server in development (requires Deno)
deno run -A agent.ts

# Run CLI in development
deno task dev courses --format table

# Build npm package
deno task build:npm

# Build Desktop Extension
deno task build:extension

# Type check
deno task check
```

### Releasing

Releases are fully automated via [Release Please](https://github.com/googleapis/release-please) + [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC). No tokens required!

**How it works:**
```
Push commits with conventional messages (feat:, fix:, etc.)
         ↓
Release Please creates/updates a Release PR
         ↓
Merge the PR when ready
         ↓
Release Please creates GitHub Release + tag
         ↓
Publish workflow runs automatically
         ↓
npm package published + .mcpb attached to release
```

**Commit message format:**
- `feat: add new tool` → minor version bump (0.1.0 → 0.2.0)
- `fix: correct API error` → patch version bump (0.1.0 → 0.1.1)
- `feat!: breaking change` → major version bump (0.1.0 → 1.0.0)
- `chore: update deps` → no release

**First-time setup:**

1. Publish the first version manually:
   ```bash
   deno task build:npm
   cd npm && npm publish --access public
   ```

2. Configure Trusted Publisher on npmjs.com:
   - Go to your package → **Settings** → **Trusted Publisher**
   - Select **GitHub Actions**
   - Organization/user: `mtgibbs`
   - Repository: `canvas-lms-mcp`
   - Workflow filename: `publish.yml`
   - Click **Set up connection**

After that, just push commits and merge Release PRs - everything else is automatic!

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- [Canvas LMS API Documentation](https://canvas.instructure.com/doc/api/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/download)
- [1Password CLI](https://1password.com/downloads/command-line/)
- [Report Issues](https://github.com/mtgibbs/canvas-lms-mcp/issues)
