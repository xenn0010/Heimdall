import { Command } from 'commander';
import chalk from 'chalk';
import { analyzeCodebase, readFileWithContext } from '../lib/codebase.js';

export const exploreCommand = new Command('explore')
  .description('Explore and analyze the codebase structure')
  .argument('[path]', 'Path or pattern to explore (default: **/*.{ts,js,tsx,jsx})')
  .option('--file <file>', 'Analyze a specific file with context')
  .option('--max <number>', 'Maximum number of files to analyze', '10')
  .action(async (path: string = '**/*.{ts,js,tsx,jsx}', options) => {
    try {
      console.log(chalk.blue('🔍 Exploring codebase...'));
      
      if (options.file) {
        const fileAnalysis = await readFileWithContext(options.file);
        console.log(chalk.gray(fileAnalysis));
        return;
      }
      
      const maxFiles = parseInt(options.max);
      const analysis = await analyzeCodebase(path, maxFiles);
      
      console.log(chalk.gray(analysis));
      
    } catch (error) {
      console.error(chalk.red('Error exploring codebase:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });