# Azor the ChatDog 🐕

Interactive terminal-based chat application with multi-LLM support. TypeScript port of the Python version.

## Features

- **Multi-session Support:** Create, load, and switch between multiple chat sessions
- **Persistent History:** All conversations saved to disk automatically
- **Token Management:** Real-time token counting and context awareness
- **Triple LLM Backend:** Support for Google Gemini, Anthropic Claude, and local LLaMA models
- **Advanced CLI:** Interactive command-line interface with Tab autocompletion
- **Smart Autocompletion:** Context-aware command and subcommand completion
- **Session Export:** Export conversations to PDF (coming soon)
- **Audit Trail:** Write-Ahead Log for transaction history

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the root directory:

```bash
# Copy the example
cp .env.example .env

# Edit with your settings
```

### Gemini Configuration

```bash
ENGINE=GEMINI
GEMINI_API_KEY=your_api_key_here
MODEL_NAME=gemini-2.5-flash
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Anthropic Configuration

```bash
ENGINE=ANTHROPIC
ANTHROPIC_API_KEY=your_api_key_here
MODEL_NAME=claude-3-5-haiku-latest
```

Get your API key from [Anthropic Console](https://console.anthropic.com/)

### LLaMA Configuration

```bash
ENGINE=LLAMA_CPP
MODEL_NAME=llama-3.1-8b-instruct
LLAMA_MODEL_PATH=/path/to/model.gguf
LLAMA_GPU_LAYERS=1
LLAMA_CONTEXT_SIZE=2048
```

## Usage

### Run in Development Mode

```bash
npm run dev
```

### Run Built Version

```bash
npm run build
npm start
```

### Run with Specific Session

```bash
npm start -- --session-id=<SESSION_ID>
```

### Using Autocompletion

The CLI supports **Tab autocompletion** for commands and subcommands:

**Main Commands:**
- Type `/` and press `Tab` to see all available commands
- Type `/ses` and press `Tab` to autocomplete to `/session`

**Subcommands:**
- Type `/session ` (with space) and press `Tab` to see all subcommands
- Type `/session l` and press `Tab` to autocomplete to `/session list`

**Example Flow:**
1. Type `/se` + `Tab` → auto-completes to `/session`
2. Add space and `Tab` → shows: `list`, `display`, `new`, `clear`, `pop`, `remove`
3. Type `l` + `Tab` → auto-completes to `/session list`

## Available Commands

### Session Management

- `/session list` - List all saved sessions
- `/session display` - Display current session history
- `/session new` - Create a new session
- `/session clear` - Clear current session history
- `/session pop` - Remove last message exchange
- `/session remove` - Remove current session and start new
- `/switch <SESSION_ID>` - Switch to a different session

### Export

- `/pdf` - Export session to PDF (coming soon)

### General

- `/help` - Show help message
- `/exit` or `/quit` - Exit the application

## Project Structure

```
azor_js/
├── src/
│   ├── assistant/          # Assistant configuration
│   │   ├── assistant.ts
│   │   └── azor.ts
│   ├── cli/                # Command-line interface
│   │   ├── args.ts
│   │   ├── console.ts
│   │   └── prompt.ts
│   ├── commands/           # Slash commands
│   │   ├── sessionList.ts
│   │   ├── sessionDisplay.ts
│   │   ├── sessionRemove.ts
│   │   └── welcome.ts
│   ├── files/              # File persistence
│   │   ├── config.ts
│   │   ├── sessionFiles.ts
│   │   └── wal.ts
│   ├── llm/                # LLM clients
│   │   ├── geminiClient.ts
│   │   ├── geminiValidation.ts
│   │   ├── llamaClient.ts
│   │   └── llamaValidation.ts
│   ├── session/            # Session management
│   │   ├── chatSession.ts
│   │   └── sessionManager.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── chat.ts             # Main chat loop
│   ├── commandHandler.ts   # Command routing
│   └── run.ts              # Entry point
├── .env                    # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

The application follows a clean layered architecture:

1. **CLI Layer:** User interface and input handling
2. **Command Layer:** Slash command processing
3. **Session Layer:** Session lifecycle management
4. **LLM Layer:** Abstract LLM client interface with Gemini and LLaMA implementations
5. **Storage Layer:** File persistence and Write-Ahead Log

### Key Components

- **ChatSession:** Manages a single chat session with history and LLM interaction
- **SessionManager:** Orchestrates session lifecycle (create, switch, save)
- **GeminiLLMClient:** Google Gemini API integration
- **AnthropicLLMClient:** Anthropic Claude API integration
- **LlamaClient:** Local LLaMA model integration
- **Assistant:** AI assistant configuration and personality

## Data Storage

All data is stored in `~/.azor/`:

- `<session-id>-log.json` - Session history files
- `azor-wal.json` - Write-Ahead Log for audit trail

## Development

### Watch Mode

```bash
npm run watch
```

### Clean Build

```bash
npm run clean
npm run build
```

## Dependencies

### Core

- `@google/generative-ai` - Google Gemini API client
- `node-llama-cpp` - Local LLaMA model support
- `dotenv` - Environment variable management
- `zod` - Runtime type validation
- `uuid` - UUID generation

### CLI

- `chalk` - Terminal colors
- `inquirer` - Interactive prompts

### Utilities

- `markdown-it` - Markdown parsing
- `pdf-lib` - PDF generation

## License

MIT

## Credits

TypeScript port of the original Python implementation. Maintains 1:1 feature parity with the Python version.
