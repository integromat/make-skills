# Make CLI: Install & Authenticate

The Make CLI (`@makehq/cli`) exposes every Make MCP tool as a command-line subcommand. When an AI agent has shell access, invoking the CLI via Bash is the recommended interface.

## Installation

### Homebrew (macOS / Linux)

```bash
brew install integromat/tap/make-cli
```

### npm (global or npx)

```bash
npm install -g @makehq/cli
```

Or run without installing:

```bash
npx --yes @makehq/cli scenarios list --team-id=123
```

### Binary releases

Pre-built binaries are available at <https://github.com/integromat/make-cli/releases>:

| Platform | Architecture       | File                            |
|----------|--------------------|---------------------------------|
| Linux    | x86_64             | `make-cli-linux-amd64.tar.gz`   |
| Linux    | arm64              | `make-cli-linux-arm64.tar.gz`   |
| macOS    | Intel              | `make-cli-darwin-amd64.tar.gz`  |
| macOS    | Apple Silicon      | `make-cli-darwin-arm64.tar.gz`  |
| Windows  | x86_64             | `make-cli-windows-amd64.tar.gz` |

Extract the archive and place the binary on the `PATH`.

### Debian / Ubuntu

```bash
sudo dpkg -i make-cli-linux-amd64.deb
```

## Authentication

### Interactive login (recommended)

```bash
make-cli login
```

Guides the user through selecting a zone, opening the Make API keys page in a browser, and validating the key. Credentials are saved to:

- **macOS / Linux:** `~/.config/make-cli/config.json`
- **Windows:** `%APPDATA%\make-cli\config.json`

Verify:

```bash
make-cli whoami
```

Clear saved credentials:

```bash
make-cli logout
```

### Environment variables

```bash
export MAKE_API_KEY="your-api-key"
export MAKE_ZONE="eu2.make.com"
```

### Per-command flags

```bash
make-cli --api-key YOUR_KEY --zone eu2.make.com scenarios list --team-id=123
```

### Priority

Flags > environment variables > saved credentials.

## Usage shape

```
make-cli [--api-key=…] [--zone=…] [--output=json|table|compact] <category> <action> [flags]
```

Global options relevant to agent usage:

| Option              | Description                                         |
|---------------------|-----------------------------------------------------|
| `--api-key <key>`   | Make API key (or set `MAKE_API_KEY`)                |
| `--zone <zone>`     | Make zone, e.g. `eu2.make.com` (or `MAKE_ZONE`)     |
| `--output <format>` | `json` (default), `compact`, or `table`             |

When an agent parses the response programmatically, always pass `--output=json`.

## Authoritative help

For the definitive list of categories and actions, run:

```bash
make-cli --help
make-cli <category> --help
```
