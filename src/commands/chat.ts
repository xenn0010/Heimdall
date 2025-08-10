import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'readline';
import { planGitOperations } from '../lib/claude.js';
import { getRepoContext } from '../lib/git.js';
import { analyzeCodebase, readFileWithContext } from '../lib/codebase.js';
import { applyFixCommand } from './apply-fix.js';
import { commitCommand } from './commit.js';
import { prCommand } from './pr.js';
import { statusCommand } from './status.js';

export const chatCommand = new Command('chat')
  .alias('c')
  .description('Chat with Heimdall to perform Git operations conversationally')
  .argument('<instruction>', 'What you want Heimdall to do (e.g., "fix the login bug and commit it")')
  .option('--dry', 'Show planned operations without executing them')
  .action(async (instruction: string, options) => {
    try {
      const spinner = ora('Analyzing your request...').start();
      
      // Get repository context
      const repoContext = await getRepoContext();
      
      // Get codebase context for more intelligent planning
      spinner.text = 'Analyzing codebase structure...';
      const codebaseContext = await analyzeCodebase();
      
      // If no files found in analysis, do a broader search
      if (!codebaseContext.includes('files):') || codebaseContext.includes('(0 files)')) {
        spinner.text = 'Searching for all code files...';
        const broadContext = await analyzeCodebase('**/*.{js,ts,tsx,jsx,py,go,rs,java,cpp,c,h}', 15);
        if (broadContext && broadContext !== codebaseContext) {
          const combinedContext = codebaseContext + '\n\nBroader search results:\n' + broadContext;
          var finalContext = combinedContext;
        } else {
          var finalContext = codebaseContext;
        }
      } else {
        var finalContext = codebaseContext;
      }
      
      // Read key files if request mentions specific files
      const mentionedFiles = extractMentionedFiles(instruction);
      let fileContents = '';
      for (const file of mentionedFiles) {
        try {
          const content = await readFileWithContext(file);
          fileContents += `\n\n${content}`;
        } catch (error) {
          // File doesn't exist or can't read, skip
        }
      }
      
      // Plan operations with Claude
      const plan = await planGitOperations(instruction, repoContext, finalContext + fileContents);
      
      spinner.succeed('Plan created');
      
      console.log(chalk.blue('\n🤖 Heimdall Plan:'));
      console.log(chalk.gray(plan.explanation));
      
      if (plan.operations && Array.isArray(plan.operations)) {
        console.log(chalk.blue('\nOperations to execute:'));
        plan.operations.forEach((op, i) => {
          console.log(chalk.gray(`  ${i + 1}. heimdall ${op.command} ${op.args.join(' ')}`));
        });
      } else {
        console.log(chalk.red('\nNo valid operations returned from Claude'));
        console.log(chalk.gray('Claude response format was incorrect'));
        return;
      }
      
      if (options.dry) {
        console.log(chalk.yellow('\nDry run mode - operations not executed'));
        return;
      }
      
      // Confirm execution
      console.log(chalk.yellow('\nExecute these operations? (y/N)'));
      const confirmation = await getUserInput();
      
      if (confirmation.toLowerCase() !== 'y' && confirmation.toLowerCase() !== 'yes') {
        console.log(chalk.gray('Operations cancelled'));
        return;
      }
      
      // Execute operations
      console.log(chalk.blue('\nExecuting operations...'));
      
      for (const [index, operation] of plan.operations.entries()) {
        console.log(chalk.blue(`\n[${index + 1}/${plan.operations.length}] ${operation.command} ${operation.args.join(' ')}`));
        
        try {
          await executeOperation(operation.command, operation.args);
          console.log(chalk.green(`✓ Operation completed`));
        } catch (error) {
          console.error(chalk.red(`✗ Operation failed: ${error}`));
          console.log(chalk.yellow('Stopping execution due to error'));
          break;
        }
      }
      
      console.log(chalk.green('\n🎉 All operations completed!'));
      
    } catch (error) {
      console.error(chalk.red('Error in chat command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function extractMentionedFiles(instruction: string): string[] {
  const files: string[] = [];
  
  // Extract .ts, .js, .tsx, .jsx files mentioned
  const fileMatches = instruction.match(/[\w\-\.\/]+\.(ts|js|tsx|jsx|py|go|rs|java|cpp|c|h)/g);
  if (fileMatches) {
    files.push(...fileMatches);
  }
  
  // Extract "file.ext" or 'file.ext' patterns
  const quotedFiles = instruction.match(/['"]([\w\-\.\/]+\.[a-z]+)['"]/g);
  if (quotedFiles) {
    files.push(...quotedFiles.map(f => f.slice(1, -1)));
  }
  
  // Add src/ prefix if file seems to be in src
  return files.map(file => {
    if (!file.includes('/') && !file.startsWith('src/')) {
      return `src/lib/${file}`;
    }
    return file;
  });
}

async function getUserInput(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function executeOperation(command: string, args: string[]): Promise<void> {
  switch (command) {
    case 'explore':
      // Execute codebase exploration
      const pattern = args[0] || '**/*.{ts,js,tsx,jsx}';
      const maxFiles = args[1] ? parseInt(args[1]) : 10;
      const analysis = await analyzeCodebase(pattern, maxFiles);
      console.log(chalk.gray(analysis));
      break;
      
    case 'apply-fix':
      // Parse apply-fix arguments: [file, '--update', instruction]
      const file = args[0];
      const updateIndex = args.indexOf('--update');
      if (updateIndex === -1 || !args[updateIndex + 1]) {
        throw new Error('Invalid apply-fix arguments');
      }
      const instruction = args[updateIndex + 1];
      
      // Import and execute apply-fix logic
      const { applyUpdate } = await import('../lib/morph.js');
      const { readFile, writeFile } = await import('fs/promises');
      
      const originalContent = await readFile(file, 'utf-8');
      const updatedContent = await applyUpdate(originalContent, instruction);
      await writeFile(file, updatedContent, 'utf-8');
      break;
      
    case 'commit':
      // Import and execute commit logic
      const { generateCommitMessage } = await import('../lib/commit.js');
      const { getStagedFiles, commitChanges } = await import('../lib/git.js');
      const { execa } = await import('execa');
      
      // Auto-stage all changes if no files are staged
      let stagedFiles = await getStagedFiles();
      if (stagedFiles.length === 0) {
        await execa('git', ['add', '-A']);
        stagedFiles = await getStagedFiles();
      }
      
      if (stagedFiles.length === 0) {
        throw new Error('No files to commit');
      }
      
      const message = await generateCommitMessage(stagedFiles);
      await commitChanges(message);
      break;
      
    case 'pr':
      // Import and execute PR logic
      const { createPullRequest } = await import('../lib/github.js');
      const { getRemoteInfo, getCurrentBranch } = await import('../lib/git.js');
      
      const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'main';
      const remote = await getRemoteInfo();
      const head = await getCurrentBranch();
      
      await createPullRequest({
        owner: remote.owner,
        repo: remote.repo,
        head,
        base,
        title: `Update from ${head}`,
        body: 'Automated PR created by Heimdall',
        draft: false
      });
      break;
      
    case 'status':
      // Import and execute status logic
      const { getGitStatus } = await import('../lib/git.js');
      const status = await getGitStatus();
      console.log(status);
      break;
      
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}