import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'readline';
import { 
  getMergeStatus,
  parseConflicts,
  resolveFileConflicts,
  resolveConflictWithAI,
  ConflictMarker
} from '../lib/merge.js';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

export const resolveCommand = new Command('resolve')
  .description('AI-powered conflict resolution for specific files')
  .argument('[file]', 'File to resolve conflicts in (if not provided, will show conflicted files)')
  .option('--all', 'Resolve all conflicted files automatically')
  .option('--interactive', 'Interactive conflict resolution')
  .option('--preview', 'Preview resolution without applying')
  .option('--strategy <strategy>', 'Resolution strategy: ai, ours, theirs, manual', 'ai')
  .action(async (file: string | undefined, options) => {
    try {
      const spinner = ora('Checking for conflicts...').start();
      
      const mergeStatus = await getMergeStatus();
      
      if (!mergeStatus.isInMerge) {
        spinner.fail('No merge in progress');
        console.log(chalk.gray('Use this command during a merge to resolve conflicts'));
        return;
      }
      
      if (mergeStatus.conflictedFiles.length === 0) {
        spinner.succeed('No conflicts to resolve');
        console.log(chalk.green('All conflicts have been resolved!'));
        console.log(chalk.gray('Use "heimdall merge --continue" to complete the merge'));
        return;
      }
      
      spinner.succeed(`Found ${mergeStatus.conflictedFiles.length} conflicted file(s)`);
      
      // Handle --all option
      if (options.all) {
        console.log(chalk.blue('🤖 Resolving all conflicts automatically...'));
        
        let allResolved = true;
        for (const conflictedFile of mergeStatus.conflictedFiles) {
          console.log(chalk.blue(`\nResolving ${conflictedFile}...`));
          const resolved = await resolveFileConflicts(conflictedFile);
          if (!resolved) {
            allResolved = false;
          }
        }
        
        if (allResolved) {
          console.log(chalk.green('\n✅ All conflicts resolved successfully!'));
          console.log(chalk.gray('Use "heimdall merge --continue" to complete the merge'));
        } else {
          console.log(chalk.yellow('\n⚠ Some conflicts could not be auto-resolved'));
        }
        return;
      }
      
      // If no file specified, show conflicted files
      if (!file) {
        console.log(chalk.yellow('Conflicted files:'));
        mergeStatus.conflictedFiles.forEach((f, index) => {
          console.log(chalk.red(`  ${index + 1}. ${f}`));
        });
        console.log(chalk.gray('\nUsage:'));
        console.log(chalk.gray('  heimdall resolve <file>     # Resolve specific file'));
        console.log(chalk.gray('  heimdall resolve --all      # Resolve all files'));
        console.log(chalk.gray('  heimdall resolve --interactive # Interactive resolution'));
        return;
      }
      
      // Validate file exists and has conflicts
      if (!existsSync(file)) {
        console.error(chalk.red(`File not found: ${file}`));
        return;
      }
      
      if (!mergeStatus.conflictedFiles.includes(file)) {
        console.log(chalk.green(`✓ ${file} has no conflicts`));
        return;
      }
      
      // Parse conflicts in the file
      console.log(chalk.blue(`\n🔍 Analyzing conflicts in ${file}...`));
      const conflicts = await parseConflicts(file);
      
      if (conflicts.length === 0) {
        console.log(chalk.green(`✓ No conflicts found in ${file}`));
        return;
      }
      
      console.log(chalk.yellow(`Found ${conflicts.length} conflict(s)`));
      
      // Handle different resolution strategies
      switch (options.strategy) {
        case 'ours':
          await resolveWithStrategy(file, conflicts, 'ours');
          break;
        case 'theirs':
          await resolveWithStrategy(file, conflicts, 'theirs');
          break;
        case 'manual':
          console.log(chalk.blue('Opening file for manual editing...'));
          console.log(chalk.gray(`Edit ${file} manually and then run:`));
          console.log(chalk.gray(`  git add ${file}`));
          console.log(chalk.gray('  heimdall merge --continue'));
          break;
        case 'ai':
        default:
          if (options.interactive) {
            await resolveInteractively(file, conflicts, options.preview);
          } else {
            await resolveAutomatically(file, conflicts, options.preview);
          }
          break;
      }
      
    } catch (error) {
      console.error(chalk.red('Error in resolve command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function resolveWithStrategy(file: string, conflicts: ConflictMarker[], strategy: 'ours' | 'theirs'): Promise<void> {
  console.log(chalk.blue(`Resolving conflicts using "${strategy}" strategy...`));
  
  const content = await readFile(file, 'utf-8');
  const lines = content.split('\n');
  
  // Process conflicts in reverse order
  for (let i = conflicts.length - 1; i >= 0; i--) {
    const conflict = conflicts[i];
    const resolution = strategy === 'ours' ? conflict.currentContent : conflict.incomingContent;
    
    // Replace conflict section with chosen resolution
    const beforeConflict = lines.slice(0, conflict.start);
    const afterConflict = lines.slice(conflict.end + 1);
    const resolutionLines = resolution.split('\n');
    
    lines.splice(conflict.start, conflict.end - conflict.start + 1, ...resolutionLines);
  }
  
  await writeFile(file, lines.join('\n'), 'utf-8');
  
  // Stage the resolved file
  const { execa } = await import('execa');
  await execa('git', ['add', file]);
  
  console.log(chalk.green(`✓ Resolved ${conflicts.length} conflict(s) in ${file} using "${strategy}" strategy`));
}

async function resolveAutomatically(file: string, conflicts: ConflictMarker[], preview: boolean = false): Promise<void> {
  console.log(chalk.blue(`🤖 Auto-resolving ${conflicts.length} conflict(s)...`));
  
  if (preview) {
    console.log(chalk.yellow('PREVIEW MODE - showing resolutions without applying:'));
  }
  
  for (let i = 0; i < conflicts.length; i++) {
    const conflict = conflicts[i];
    console.log(chalk.blue(`\nResolving conflict ${i + 1}/${conflicts.length}:`));
    console.log(chalk.gray(`Current (${conflict.currentBranch}):`));
    console.log(chalk.red(conflict.currentContent));
    console.log(chalk.gray(`Incoming (${conflict.incomingBranch}):`));
    console.log(chalk.green(conflict.incomingContent));
    
    const resolution = await resolveConflictWithAI(file, conflict);
    
    console.log(chalk.blue('AI Resolution:'));
    console.log(chalk.cyan(resolution));
    
    if (preview) {
      console.log(chalk.yellow('---'));
    }
  }
  
  if (!preview) {
    const success = await resolveFileConflicts(file);
    if (success) {
      console.log(chalk.green(`\n✅ All conflicts resolved in ${file}`));
    }
  } else {
    console.log(chalk.yellow('\nPreview complete. Use without --preview to apply resolutions.'));
  }
}

async function resolveInteractively(file: string, conflicts: ConflictMarker[], preview: boolean = false): Promise<void> {
  console.log(chalk.blue('🎯 Interactive conflict resolution'));
  
  const resolvedConflicts: { conflict: ConflictMarker; resolution: string }[] = [];
  
  for (let i = 0; i < conflicts.length; i++) {
    const conflict = conflicts[i];
    
    console.log(chalk.blue(`\n--- Conflict ${i + 1}/${conflicts.length} ---`));
    console.log(chalk.gray(`Current branch (${conflict.currentBranch}):`));
    console.log(chalk.red(conflict.currentContent));
    console.log(chalk.gray(`Incoming branch (${conflict.incomingBranch}):`));
    console.log(chalk.green(conflict.incomingContent));
    
    const choice = await askChoice(
      'How would you like to resolve this conflict?',
      [
        { key: '1', label: 'Use AI resolution', value: 'ai' },
        { key: '2', label: 'Keep current version', value: 'ours' },
        { key: '3', label: 'Use incoming version', value: 'theirs' },
        { key: '4', label: 'Skip (manual edit)', value: 'skip' }
      ]
    );
    
    let resolution: string;
    
    switch (choice) {
      case 'ai':
        console.log(chalk.blue('🤖 Generating AI resolution...'));
        resolution = await resolveConflictWithAI(file, conflict);
        console.log(chalk.blue('AI Resolution:'));
        console.log(chalk.cyan(resolution));
        
        const aiConfirm = await askConfirmation('Accept this AI resolution?');
        if (aiConfirm) {
          resolvedConflicts.push({ conflict, resolution });
        }
        break;
        
      case 'ours':
        resolution = conflict.currentContent;
        resolvedConflicts.push({ conflict, resolution });
        break;
        
      case 'theirs':
        resolution = conflict.incomingContent;
        resolvedConflicts.push({ conflict, resolution });
        break;
        
      case 'skip':
        console.log(chalk.yellow('Skipped - you can edit this manually'));
        break;
    }
  }
  
  if (resolvedConflicts.length > 0 && !preview) {
    console.log(chalk.blue(`\n📝 Applying ${resolvedConflicts.length} resolution(s)...`));
    
    const content = await readFile(file, 'utf-8');
    let lines = content.split('\n');
    
    // Apply resolutions in reverse order
    for (let i = resolvedConflicts.length - 1; i >= 0; i--) {
      const { conflict, resolution } = resolvedConflicts[i];
      const beforeConflict = lines.slice(0, conflict.start);
      const afterConflict = lines.slice(conflict.end + 1);
      const resolutionLines = resolution.split('\n');
      
      lines = [...beforeConflict, ...resolutionLines, ...afterConflict];
    }
    
    await writeFile(file, lines.join('\n'), 'utf-8');
    
    // Stage the file
    const { execa } = await import('execa');
    await execa('git', ['add', file]);
    
    console.log(chalk.green(`✅ Applied ${resolvedConflicts.length} resolution(s) to ${file}`));
  }
}

async function askChoice(question: string, choices: { key: string; label: string; value: string }[]): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log(chalk.yellow(question));
    choices.forEach(choice => {
      console.log(chalk.gray(`  ${choice.key}. ${choice.label}`));
    });
    
    rl.question(chalk.yellow('Choice: '), (answer) => {
      rl.close();
      const choice = choices.find(c => c.key === answer.trim());
      resolve(choice ? choice.value : choices[0].value);
    });
  });
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(`${question} (y/N) `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}