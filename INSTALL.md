# 🚀 Heimdall Installation Guide

## Quick Install (Global CLI)

```bash
# Install globally via npm
npm install -g heimdall-cli

# Verify installation
heimdall --version
```

## Setup API Keys

Create a `.env` file or set environment variables:

```bash
# Required: Morph API key for code fixes
export MORPH_API_KEY=your_morph_api_key_here

# Required: Claude API key for conversational features  
export CLAUDE_API_KEY=your_claude_api_key_here

# Required: GitHub token for PR creation
export GH_TOKEN=your_github_token_here
```

## Usage Examples

### Conversational Git Operations
```bash
# Fix bugs conversationally
heimdall chat "fix the login bug and create a PR"

# Add features with auto-commit
heimdall chat "add error handling to utils.ts and commit it"

# Clean up code
heimdall chat "remove unused imports and optimize the code"
```

### Direct Commands
```bash
# Explore your codebase
heimdall explore src/

# Apply AI fixes to specific files
heimdall apply-fix src/app.ts --update "Add error handling"

# Generate smart commit messages
heimdall commit

# Create GitHub PRs
heimdall pr --base main --title "Add new feature"
```

## First Time Setup

1. **Initialize in your repo:**
   ```bash
   cd your-project
   heimdall init
   ```

2. **Check repo status:**
   ```bash
   heimdall status
   ```

3. **Start with a simple fix:**
   ```bash
   heimdall chat "analyze my code and suggest improvements"
   ```

## Troubleshooting

### Missing API Keys
```
Error: MORPH_API_KEY environment variable not set
```
**Solution:** Set your API keys in `.env` file or environment variables.

### Git Repository Required
```
Error: Not in a Git repository
```
**Solution:** Run in a git repository or run `git init` first.

### No Staged Files
```
Error: No staged files to commit  
```
**Solution:** Heimdall auto-stages files, but ensure you have changes to commit.

## API Key Setup

### Morph API Key
1. Sign up at [Morph](https://morph.so)
2. Get your API key from the dashboard
3. Set `MORPH_API_KEY=your_key`

### Claude API Key  
1. Sign up at [Anthropic](https://anthropic.com)
2. Get your API key from the console
3. Set `CLAUDE_API_KEY=your_key`

### GitHub Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with repo permissions
3. Set `GH_TOKEN=your_token`

## Support

- 📖 [Documentation](https://github.com/xenn0010/Heimdall)
- 🐛 [Report Issues](https://github.com/xenn0010/Heimdall/issues)
- 💬 [Discussions](https://github.com/xenn0010/Heimdall/discussions)

---

**Built with ❤️ for developers who want to work conversationally with their code.**