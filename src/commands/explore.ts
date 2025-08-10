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
      
      // Handle specific file names as patterns
      if (path && !path.includes('*') && !path.includes('/')) {
        // If it's a specific file name, search for it
        const specificFilePattern = `**/${path}`;
        console.log(chalk.gray(`Searching for files matching: ${specificFilePattern}`));
        path = specificFilePattern;
      }
      
      // Expand patterns for common config files
      if (path.includes('package-lock.json') || path.includes('*.json')) {
        path = path.includes('*') ? path : '**/*.json';
      }
      
      const maxFiles = parseInt(options.max);
      const analysis = await analyzeCodebase(path, maxFiles);
      
      if (!analysis || analysis.includes('No files found') || analysis.includes('(0 files)')) {
        console.log(chalk.yellow('No files found with the specified pattern.'));
        console.log(chalk.gray('Try these patterns:'));
        console.log(chalk.gray('  **/*.json          (all JSON files)'));
        console.log(chalk.gray('  **/package*.json   (package files)'));
        console.log(chalk.gray('  **/*.{ts,js}       (TypeScript/JavaScript)'));
        console.log(chalk.gray('  --file package-lock.json  (specific file)'));
      } else {
        console.log(chalk.gray(analysis));
      }
      
    } catch (error) {
      console.error(chalk.red('Error exploring codebase:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });