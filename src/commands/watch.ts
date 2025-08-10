import { Command } from 'commander';
import chalk from 'chalk';
import { createInterface } from 'readline';
import { ideIntegration } from '../lib/ide-integration.js';

export const watchCommand = new Command('watch')
  .alias('w')
  .description('Start real-time IDE file monitoring with AI analysis')
  .option('-a, --auto', 'Enable automatic AI analysis of file changes')
  .option('-t, --threshold <number>', 'Number of file changes before auto-analysis', '3')
  .option('-p, --patterns <patterns>', 'File patterns to watch (comma-separated)', '**/*.{ts,js,tsx,jsx,py,go,rs,java,cpp,c,h}')
  .option('--list', 'List active IDE sessions')
  .option('--stop <sessionId>', 'Stop a specific IDE session')
  .option('--stop-all', 'Stop all IDE sessions')
  .option('--status <sessionId>', 'Show status of a specific IDE session')
  .action(async (options) => {
    try {
      if (options.list) {
        const sessions = ideIntegration.listActiveSessions();
        if (sessions.length === 0) {
          console.log(chalk.gray('No active IDE sessions'));
        } else {
          console.log(chalk.blue('Active IDE sessions:'));
          sessions.forEach(sessionId => {
            console.log(chalk.gray(`  - ${sessionId}`));
          });
        }
        return;
      }

      if (options.stopAll) {
        console.log(chalk.blue('Stopping all IDE sessions...'));
        await ideIntegration.stopAllSessions();
        return;
      }

      if (options.stop) {
        const success = await ideIntegration.stopIDESession(options.stop);
        if (success) {
          console.log(chalk.green(`✓ Stopped IDE session: ${options.stop}`));
        } else {
          console.log(chalk.red(`✗ Session not found: ${options.stop}`));
        }
        return;
      }

      if (options.status) {
        const status = await ideIntegration.getSessionStatus(options.status);
        if (!status) {
          console.log(chalk.red(`✗ Session not found: ${options.status}`));
          return;
        }
        
        console.log(chalk.blue('IDE Session Status:'));
        console.log(chalk.gray(`Session ID: ${status.sessionId}`));
        console.log(chalk.gray(`Started: ${status.startTime.toLocaleString()}`));
        console.log(chalk.gray(`Duration: ${Math.round(status.duration / 1000)}s`));
        console.log(chalk.gray(`Watched files: ${status.watchedFiles.length}`));
        console.log(chalk.gray(`Changed files: ${status.changedFiles}`));
        if (status.lastActivity) {
          console.log(chalk.gray(`Last activity: ${status.lastActivity.toLocaleString()}`));
        }
        
        if (status.watchedFiles.length > 0) {
          console.log(chalk.blue('\nWatched files:'));
          status.watchedFiles.slice(0, 10).forEach(file => {
            console.log(chalk.gray(`  - ${file}`));
          });
          if (status.watchedFiles.length > 10) {
            console.log(chalk.gray(`  ... and ${status.watchedFiles.length - 10} more`));
          }
        }
        return;
      }

      // Start new IDE session
      const patterns = options.patterns.split(',').map((p: string) => p.trim());
      const sessionId = await ideIntegration.startIDESession(process.cwd(), {
        autoAnalysis: options.auto,
        analysisThreshold: parseInt(options.threshold),
        patterns
      });

      console.log(chalk.green('🎯 IDE monitoring is now active!'));
      console.log(chalk.gray('Making changes to your code files will be detected automatically.'));
      
      if (options.auto) {
        console.log(chalk.blue(`🤖 AI analysis will trigger after ${options.threshold} file changes.`));
      } else {
        console.log(chalk.gray('Use "heimdall chat" to interact with detected changes.'));
      }
      
      console.log(chalk.yellow('\nCommands while watching:'));
      console.log(chalk.gray('  - Press Ctrl+C to stop'));
      console.log(chalk.gray(`  - heimdall watch --status ${sessionId} (in another terminal)`));
      console.log(chalk.gray(`  - heimdall watch --stop ${sessionId} (in another terminal)`));

      // Set up graceful shutdown
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout
      });

      process.on('SIGINT', async () => {
        console.log(chalk.blue('\n\n🛑 Shutting down IDE monitoring...'));
        await ideIntegration.stopIDESession(sessionId);
        rl.close();
        process.exit(0);
      });

      // Keep the process alive
      await new Promise(() => {}); // Wait indefinitely

    } catch (error) {
      console.error(chalk.red('Error in watch command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });