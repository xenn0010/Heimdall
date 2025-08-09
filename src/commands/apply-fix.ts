import { Command } from 'commander';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import { applyUpdate } from '../lib/index.js';

export const applyFixCommand = new Command('apply-fix')
  .description('Apply a code fix using Morph AI')
  .argument('<file>', 'File to apply the fix to')
  .requiredOption('--update <instruction>', 'Update instruction for Morph')
  .option('--dry', 'Show the generated fix without applying it')
  .action(async (file: string, options) => {
    try {
      if (!process.env.MORPH_API_KEY) {
        console.error(chalk.red('Error: MORPH_API_KEY environment variable not set.'));
        console.log(chalk.blue('Set it with: export MORPH_API_KEY=your_morph_api_key'));
        process.exit(1);
      }

      console.log(chalk.blue(`Reading file: ${file}`));
      const originalContent = await readFile(file, 'utf-8');
      
      console.log(chalk.blue('Applying fix with Morph...'));
      const updatedContent = await applyUpdate(originalContent, options.update);
      
      if (options.dry) {
        console.log(chalk.yellow('Dry run mode - showing generated fix:'));
        console.log(chalk.gray('--- Original ---'));
        console.log(originalContent.slice(0, 500) + (originalContent.length > 500 ? '...' : ''));
        console.log(chalk.gray('--- Updated ---'));
        console.log(updatedContent.slice(0, 500) + (updatedContent.length > 500 ? '...' : ''));
        return;
      }

      await writeFile(file, updatedContent, 'utf-8');
      console.log(chalk.green(`✓ Fix applied successfully to ${file}`));
      console.log(chalk.blue('Review the changes and commit when ready:'));
      console.log(chalk.gray(`  git diff ${file}`));
      console.log(chalk.gray('  git add -A && heimdall commit'));
      
    } catch (error) {
      console.error(chalk.red('Error applying fix:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
