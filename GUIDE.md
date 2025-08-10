# 📖 Heimdall Complete Usage Guide

## 🎯 What is Heimdall?

Heimdall is a conversational AI Git agent that transforms how you work with code. Instead of manually editing files, writing commit messages, and managing Git workflows, you simply talk to your codebase in plain English.

**Traditional Workflow:**
```bash
# Manual process
git status
vim src/app.ts                    # manually edit
git add -A  
git commit -m "fix: whatever"     # write commit message
gh pr create                      # create PR manually
```

**Heimdall Workflow:**
```bash
# One conversational command
heimdall chat "fix the TypeScript errors in app.ts and create a PR"
```

---

## 🚀 Installation

### Global Installation
```bash
npm install -g heimdall-cli
```

### Verify Installation
```bash
heimdall --version
heimdall
# Shows ASCII banner and help
```

---

## ⚙️ Setup

### Required API Keys
Create a `.env` file in your project root or set environment variables:

```bash
# Required: Morph API for code fixes
MORPH_API_KEY=your_morph_api_key

# Required: Claude API for conversational intelligence  
CLAUDE_API_KEY=your_claude_api_key

# Required: GitHub token for PR/issue operations
GH_TOKEN=your_github_token

# Optional: Model overrides
MORPH_MODEL=morph-v3-large
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### Get API Keys
- **Morph API**: Sign up at [Morph](https://morph.so)
- **Claude API**: Get from [Anthropic Console](https://console.anthropic.com)
- **GitHub Token**: GitHub Settings → Developer Settings → Personal Access Tokens

---

## 📋 Complete Command Reference

### 🔄 Repository Operations

#### `heimdall clone`
Clone and optionally analyze repositories:

```bash
# Basic clone
heimdall clone https://github.com/user/repo.git

# Clone to custom directory
heimdall clone https://github.com/user/repo.git my-project

# Clone and auto-analyze
heimdall clone https://github.com/user/repo.git --analyze

# Clone and apply fixes immediately
heimdall clone https://github.com/user/repo.git --fix "update dependencies and fix TS errors"
```

#### `heimdall init`
Initialize Heimdall in existing repository:
```bash
heimdall init
```

#### `heimdall status`
Enhanced Git status with Heimdall insights:
```bash
heimdall status
```

### 🔍 Code Analysis

#### `heimdall explore`
Analyze codebase structure:

```bash
# Analyze all TypeScript/JavaScript files
heimdall explore

# Analyze specific pattern
heimdall explore "src/**/*.ts"

# Analyze specific file with context
heimdall explore --file src/app.ts

# Limit analysis to 5 files
heimdall explore --max 5
```

**Output includes:**
- File structure and dependencies
- Imports/exports mapping
- Function and class inventory
- Key external dependencies

### 🤖 AI-Powered Operations

#### `heimdall chat` (The Power Command)
Conversational interface to your codebase:

```bash
# Code fixes
heimdall chat "fix all TypeScript errors"
heimdall chat "add error handling to the API routes"
heimdall chat "remove unused imports and optimize code"

# Documentation
heimdall chat "add JSDoc comments to all exported functions"
heimdall chat "create a comprehensive README"

# Refactoring
heimdall chat "refactor the user service to use async/await"
heimdall chat "extract common utilities into a separate file"

# Full workflows
heimdall chat "fix the login bug, add tests, and create a PR"
heimdall chat "update dependencies, fix breaking changes, and commit"

# Analysis requests
heimdall chat "analyze this code and suggest improvements"
heimdall chat "find potential security issues"
```

**Chat Features:**
- Reads actual file contents when files are mentioned
- Understands codebase structure and dependencies
- Plans multi-step operations intelligently
- Provides detailed explanations before executing

#### `heimdall apply-fix`
Direct AI code modifications:

```bash
# Apply specific fix to file
heimdall apply-fix src/app.ts --update "Add try/catch error handling"

# Preview changes without applying
heimdall apply-fix src/utils.ts --update "Add input validation" --dry
```

### 📝 Git Operations

#### `heimdall commit`
AI-generated conventional commits:

```bash
# Auto-generate commit from staged changes
git add -A
heimdall commit

# Commit with custom message template
heimdall commit --message "feat: add new feature"
```

**Features:**
- Analyzes actual code changes
- Generates conventional commit messages
- Includes detailed descriptions
- Auto-stages files if needed

### 🐙 GitHub Integration

#### `heimdall pr`
Create pull requests:

```bash
# Create PR with auto-generated content
heimdall pr

# Custom PR details
heimdall pr --title "Add authentication" --body "Implements JWT auth" --base main
```

#### `heimdall gh`
GitHub operations via MCP:
```bash
heimdall gh
# Interactive GitHub operations
```

---

## 🎯 Workflow Examples

### 🚀 Quick Fix Workflow
```bash
# 1. Clone and analyze
heimdall clone https://github.com/user/buggy-project.git --analyze

# 2. Fix issues conversationally
heimdall chat "fix all eslint errors and update deprecated APIs"

# 3. Done! Auto-committed with perfect message
```

### 🔧 Code Quality Improvement
```bash
# Analyze current state
heimdall explore

# Apply comprehensive improvements
heimdall chat "add TypeScript types, error handling, and JSDoc comments to all files"

# Create documentation
heimdall chat "create README with installation and usage instructions"

# Make PR
heimdall pr --title "Code quality improvements"
```

### 📦 Dependency Updates
```bash
heimdall chat "update all dependencies to latest versions and fix any breaking changes"
```

### 🐛 Bug Fixing Session
```bash
# Find and fix issues
heimdall chat "analyze the authentication flow and fix any security issues"

# Add tests
heimdall chat "add unit tests for the auth functions I just fixed"

# Document changes
heimdall chat "update the API documentation to reflect the auth changes"
```

---

## 🧠 How Heimdall Works

### The AI Stack
1. **Claude (The Brain)** 🧠
   - Plans operations from natural language
   - Reads and understands codebase structure
   - Makes intelligent decisions about changes

2. **Morph (The Editor)** ✏️
   - Applies precise code modifications
   - Handles complex refactoring
   - Maintains code quality

3. **Git Automation** 🔄
   - Auto-stages relevant changes
   - Generates semantic commit messages
   - Handles PR creation

### Intelligence Features
- **Code-aware**: Reads actual file contents, not just metadata
- **Context-driven**: Understands imports, dependencies, and relationships  
- **Multi-step planning**: Breaks complex requests into logical operations
- **Self-correcting**: Adjusts plans based on intermediate results

---

## 💡 Pro Tips

### 🎯 Effective Chat Commands

**Be Specific:**
```bash
# Good
heimdall chat "add error handling to the login function in auth.ts"

# Better  
heimdall chat "add try/catch blocks to the login function in auth.ts and log errors to the console"
```

**Combine Operations:**
```bash
heimdall chat "fix TypeScript errors, update imports, add JSDoc, and commit with a detailed message"
```

**Use File Context:**
```bash
# Mentions specific files - Heimdall will read them
heimdall chat "optimize the database queries in user.service.ts"
```

### 🚀 Demo-Ready Commands

**Impressive One-Liners:**
```bash
heimdall clone https://github.com/microsoft/TypeScript-Node-Starter.git --fix "modernize this codebase with latest TypeScript patterns"

heimdall chat "analyze this React app, fix performance issues, add error boundaries, and create a PR"

heimdall chat "convert this JavaScript project to TypeScript with proper types"
```

### 🔧 Troubleshooting

**API Key Issues:**
```bash
# Check if keys are loaded
echo $MORPH_API_KEY
echo $CLAUDE_API_KEY  
echo $GH_TOKEN
```

**Git Repository Required:**
```bash
# Heimdall needs a git repo
git init  # if not already a repo
```

**No Staged Files:**
```bash
# Heimdall auto-stages, but ensure you have changes
git status
```

---

## 🎪 Demo Scripts

### 5-Minute Hackathon Demo
```bash
# 1. Show the banner
heimdall

# 2. Clone and analyze any repo
heimdall clone https://github.com/microsoft/TypeScript-Node-Starter.git --analyze

# 3. Fix everything conversationally  
heimdall chat "update dependencies, fix TypeScript errors, add error handling, and optimize the code"

# 4. Show the perfect commit
git log --oneline -1

# 5. Create documentation
heimdall chat "add comprehensive JSDoc comments and create a usage README"
```

### Advanced Demo (10 minutes)
```bash
# Show intelligence
heimdall explore src/

# Multiple improvements
heimdall chat "refactor this codebase to use modern async/await patterns"
heimdall chat "add comprehensive error handling to all API routes"  
heimdall chat "create unit tests for the core business logic"

# GitHub integration
heimdall pr --title "Comprehensive modernization and testing"
```

---

## 🤔 FAQ

**Q: Does Heimdall work with any programming language?**
A: Yes! While optimized for JavaScript/TypeScript, it works with Python, Go, Rust, Java, C++, and more.

**Q: How much does it cost to run?**
A: Costs depend on API usage - typically $0.01-$0.10 per conversation for most codebases.

**Q: Is my code sent to external services?**
A: Yes, file contents are sent to Morph and Claude APIs for analysis. Don't use on sensitive/proprietary code without proper security review.

**Q: Can I use it offline?**
A: No, Heimdall requires internet access for AI APIs.

**Q: Does it work with private repositories?**
A: Yes, with proper GitHub token permissions.

---

## 🆘 Support

- 📖 [GitHub Repository](https://github.com/xenn0010/Heimdall)
- 🐛 [Report Issues](https://github.com/xenn0010/Heimdall/issues)  
- 💬 [Discussions](https://github.com/xenn0010/Heimdall/discussions)

---

**Built with ❤️ for developers who want to work conversationally with their code.**

*"Git, but agentic"* 🤖