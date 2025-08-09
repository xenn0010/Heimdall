import { Command } from 'commander';
import chalk from 'chalk';
import { withGithubMcp } from '../lib/index.js';
import { updateConfig } from '../lib/config.js';

export const ghCommand = new Command('gh')
  .description('Interact with GitHub via MCP server (if configured)');

ghCommand
  .command('configure')
  .description('Configure MCP GitHub server command and args')
  .requiredOption('--cmd <path>', 'Command or path to MCP GitHub server')
  .option('--args <json>', 'JSON array of arguments to pass to the MCP server')
  .action(async (options) => {
    try {
      const args = options.args ? JSON.parse(options.args) : undefined;
      if (options.args && !Array.isArray(args)) {
        console.error(chalk.red('Error: --args must be a JSON array'));
        process.exit(1);
      }
      await updateConfig({ mcpGithubCommand: options.cmd, mcpGithubArgs: args });
      console.log(chalk.green('✓ MCP GitHub configuration saved to .heimdall.json'));
    } catch (error) {
      console.error(chalk.red('Error configuring MCP GitHub:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

ghCommand
  .command('call')
  .description('Call an arbitrary MCP GitHub method')
  .argument('<method>', 'MCP method name, e.g. github.createPullRequest')
  .option('--params <json>', 'JSON object of parameters for the method')
  .action(async (method: string, options) => {
    try {
      const params = options.params ? JSON.parse(options.params) : undefined;
      if (options.params && (typeof params !== 'object' || Array.isArray(params))) {
        console.error(chalk.red('Error: --params must be a JSON object'));
        process.exit(1);
      }

      const result = await withGithubMcp(async (client) => client.call(method, params));
      console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(chalk.red('Error calling MCP method:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

export default ghCommand;


