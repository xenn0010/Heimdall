# Heimdall CLI

> CLI tool for Git automation and fast code fixes with Morph AI

[![npm version](https://badge.fury.io/js/heimdall-cli.svg)](https://badge.fury.io/js/heimdall-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Heimdall automates your Git workflow and applies precise code edits using Morph AI. Perfect for developers who want to streamline repetitive tasks and apply AI-powered code fixes quickly.

## Features

- 🚀 **Git Automation**: Status, commit, and PR creation in one command
- 🤖 **AI-Powered Fixes**: Apply code changes using Morph AI
- 📋 **Conventional Commits**: Automatic commit message generation
- ⚡ **Fast & Reliable**: Built with TypeScript and modern tooling
- 🛡️ **Safe by Default**: Dry-run mode and validation checks

## Quick Start

### Installation

```bash
# Global installation
pnpm add -g heimdall-cli

# Or use npx for one-time execution
npx heimdall@latest
```

### Development Setup

```bash
# Clone and install dependencies
git clone https://github.com/your-org/heimdall.git
cd heimdall
pnpm install

# Link for local development
pnpm -C heimdall build && pnpm -C heimdall link -g
```

### Environment Setup

Create a `.env` file or set environment variables:

```bash
export GH_TOKEN=ghp_your_github_token_here
export MORPH_API_KEY=your_morph_api_key_here
export MORPH_MODEL=morph/morph-v2  # optional
```

### Initialize

```bash
heimdall init
```

## Commands

### `heimdall status`

Show Git repository status with branch info and file changes:

```bash
heimdall status
heimdall status --json  # JSON output for CI
```

### `heimdall commit`

Generate conventional commit messages from staged changes:

```bash
# Stage files first
git add -A

# Generate and create commit
heimdall commit

# Preview commit message
heimdall commit --dry

# Use custom message
heimdall commit --message "feat: add new feature"
```

### `heimdall pr`

Create GitHub pull requests:

```bash
heimdall pr                           # Default to main branch
heimdall pr --base develop           # Target develop branch
heimdall pr --title "Feature PR"     # Custom title
heimdall pr --body "Description"     # Custom description
heimdall pr --draft                  # Create as draft
```

### `heimdall apply-fix`

Apply AI-powered code fixes using Morph:

```bash
# Apply fix to a file
heimdall apply-fix src/server.ts --update "Add /healthz route returning 200"

# Preview changes without applying
heimdall apply-fix src/utils.ts --update "Add error handling" --dry
```

## Example Workflow

```bash
# 1. Apply AI fix to your code
heimdall apply-fix src/server.ts --update "Add authentication middleware"

# 2. Review changes
git diff src/server.ts

# 3. Stage and commit with auto-generated message
git add -A && heimdall commit

# 4. Create pull request
heimdall pr --base main
```

## Configuration

Heimdall creates a `.heimdall.json` file in your repository:

```json
{
  "defaultBranch": "main",
  "morphModel": "morph/morph-v2"
}
```

## Safety Features

- **Dry Run Mode**: Use `--dry` flag to preview changes
- **Validation**: Checks for Git repo, required tokens, and staged files
- **Error Handling**: Clear error messages with actionable suggestions
- **Conventional Commits**: Follows standard commit message format

## Development

```bash
# Run in development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Watch tests
pnpm test:watch

# Lint
pnpm lint
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test utils.test.ts

# Coverage report
pnpm test --coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run tests: `pnpm test`
5. Commit: `git add -A && heimdall commit`
6. Create PR: `heimdall pr`

## Requirements

- Node.js 18+
- Git repository
- GitHub Personal Access Token (for PR features)
- Morph API Key (for AI fix features)

## License

MIT © [Heimdall Team](https://github.com/your-org/heimdall)

## Support

- 📖 [Documentation](https://heimdall-cli.dev)
- 🐛 [Issues](https://github.com/your-org/heimdall/issues)
- 💬 [Discussions](https://github.com/your-org/heimdall/discussions)
