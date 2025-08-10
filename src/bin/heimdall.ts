#!/usr/bin/env node

// Load environment variables from multiple locations
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from multiple locations
const envPaths = [
  '.env',                           // Current directory
  join(process.cwd(), '.env'),      // Current working directory
  join(homedir(), '.heimdall.env'), // Home directory
  join(__dirname, '../../.env'),    // Heimdall installation directory
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '../commands/init.js';
import { statusCommand } from '../commands/status.js';
import { commitCommand } from '../commands/commit.js';
import { prCommand } from '../commands/pr.js';
import { applyFixCommand } from '../commands/apply-fix.js';
import { chatCommand } from '../commands/chat.js';
import { exploreCommand } from '../commands/explore.js';
import { cloneCommand } from '../commands/clone.js';
import { watchCommand } from '../commands/watch.js';
import { mergeCommand } from '../commands/merge.js';
import { resolveCommand } from '../commands/resolve.js';
import { rebaseCommand } from '../commands/rebase.js';
import { ghCommand } from '../commands/gh.js';

const program = new Command();

// Show banner when no command provided or when help is shown
const showBanner = () => {
  console.log(chalk.cyan(`
██╗  ██╗███████╗██╗███╗   ███╗██████╗  █████╗ ██╗     ██╗     
██║  ██║██╔════╝██║████╗ ████║██╔══██╗██╔══██╗██║     ██║     
███████║█████╗  ██║██╔████╔██║██  ╔██╝███████║██║     ██║     
██╔══██║██╔══╝  ██║██║╚██╔╝██║██╔══██╗██╔══██║██║     ██║     
██║  ██║███████╗██║██║ ╚═╝ ██║██║████║██║  ██║███████╗███████╗
╚═╝  ╚═╝╚══════╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝`));
  console.log(chalk.gray('                   Git, but agentic\n'));
};

program
  .name('heimdall')
  .description('CLI tool for Git automation and fast code fixes with Morph')
  .version('0.1.0');

// Add commands
program.addCommand(cloneCommand);
program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(commitCommand);
program.addCommand(prCommand);
program.addCommand(applyFixCommand);
program.addCommand(chatCommand);
program.addCommand(exploreCommand);
program.addCommand(watchCommand);
program.addCommand(mergeCommand);
program.addCommand(resolveCommand);
program.addCommand(rebaseCommand);
program.addCommand(ghCommand);

// Global error handler
program.exitOverride((err) => {
  if (err.code === 'commander.version') {
    console.log('heimdall v0.1.0');
    process.exit(0);
  }
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});

// If no command provided, show banner and help
if (!process.argv.slice(2).length) {
  showBanner();
  program.outputHelp();
} else {
  // Parse arguments
  program.parse(process.argv);
}
