#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '../commands/init.js';
import { statusCommand } from '../commands/status.js';
import { commitCommand } from '../commands/commit.js';
import { prCommand } from '../commands/pr.js';
import { applyFixCommand } from '../commands/apply-fix.js';
import { chatCommand } from '../commands/chat.js';
import { ghCommand } from '../commands/gh.js';

const program = new Command();

program
  .name('heimdall')
  .description('CLI tool for Git automation and fast code fixes with Morph')
  .version('0.1.0');

// Add commands
program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(commitCommand);
program.addCommand(prCommand);
program.addCommand(applyFixCommand);
program.addCommand(chatCommand);
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

// Parse arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
