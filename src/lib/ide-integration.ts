import { IDEWatcher, FileChange } from './ide-watcher.js';
import { planGitOperations } from './claude.js';
import { getRepoContext } from './git.js';
import { analyzeCodebase } from './codebase.js';
import chalk from 'chalk';

export interface IDESession {
  watcher: IDEWatcher;
  sessionId: string;
  startTime: Date;
  changedFiles: Map<string, FileChange[]>;
}

export class IDEIntegration {
  private sessions: Map<string, IDESession> = new Map();
  private autoAnalysis: boolean = false;
  private analysisThreshold: number = 3; // Analyze after 3 file changes

  constructor() {}

  async startIDESession(workingDir: string = process.cwd(), options: {
    autoAnalysis?: boolean;
    analysisThreshold?: number;
    patterns?: string[];
  } = {}): Promise<string> {
    const sessionId = `ide-${Date.now()}`;
    const watcher = new IDEWatcher(workingDir);
    
    this.autoAnalysis = options.autoAnalysis ?? false;
    this.analysisThreshold = options.analysisThreshold ?? 3;
    
    const session: IDESession = {
      watcher,
      sessionId,
      startTime: new Date(),
      changedFiles: new Map()
    };

    // Set up file change handlers
    watcher.on('fileChange', (change: FileChange) => {
      this.handleFileChange(sessionId, change);
    });

    await watcher.startWatching(options.patterns);
    this.sessions.set(sessionId, session);
    
    console.log(chalk.green(`🚀 IDE session started: ${sessionId}`));
    console.log(chalk.gray(`Working directory: ${workingDir}`));
    
    if (this.autoAnalysis) {
      console.log(chalk.blue(`🤖 Auto-analysis enabled (threshold: ${this.analysisThreshold} changes)`));
    }
    
    return sessionId;
  }

  private async handleFileChange(sessionId: string, change: FileChange) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Store the file change
    const changes = session.changedFiles.get(change.file) || [];
    changes.push(change);
    session.changedFiles.set(change.file, changes);

    // Auto-analysis if enabled and threshold reached
    if (this.autoAnalysis && this.getTotalChangeCount(session) >= this.analysisThreshold) {
      await this.performAutoAnalysis(session);
    }
  }

  private getTotalChangeCount(session: IDESession): number {
    let count = 0;
    session.changedFiles.forEach(changes => count += changes.length);
    return count;
  }

  private async performAutoAnalysis(session: IDESession) {
    console.log(chalk.blue('\n🔍 Performing auto-analysis of file changes...'));
    
    try {
      // Get repository context
      const repoContext = await getRepoContext();
      
      // Analyze codebase
      const codebaseContext = await analyzeCodebase();
      
      // Create summary of changes
      const changesSummary = this.createChangesSummary(session);
      
      // Use Claude to analyze the changes and suggest actions
      const instruction = `Analyze these recent file changes and suggest appropriate Git operations:\n\n${changesSummary}`;
      const plan = await planGitOperations(instruction, repoContext, codebaseContext);
      
      console.log(chalk.blue('\n🤖 Auto-Analysis Results:'));
      console.log(chalk.gray(plan.explanation));
      
      if (plan.operations && Array.isArray(plan.operations)) {
        console.log(chalk.blue('\nSuggested operations:'));
        plan.operations.forEach((op, i) => {
          console.log(chalk.gray(`  ${i + 1}. heimdall ${op.command} ${op.args.join(' ')}`));
        });
        console.log(chalk.yellow('\nRun with: heimdall chat "apply the suggested changes"'));
      }
      
      // Reset change tracking after analysis
      session.changedFiles.clear();
      
    } catch (error) {
      console.error(chalk.red('Auto-analysis failed:'), error);
    }
  }

  private createChangesSummary(session: IDESession): string {
    const summary: string[] = [];
    
    summary.push(`File changes in the last ${Math.round((Date.now() - session.startTime.getTime()) / 1000)}s:`);
    
    session.changedFiles.forEach((changes, file) => {
      const lastChange = changes[changes.length - 1];
      summary.push(`- ${lastChange.type.toUpperCase()}: ${file} (${changes.length} changes)`);
      
      if (lastChange.content && lastChange.type !== 'delete') {
        // Add a snippet of the content
        const lines = lastChange.content.split('\n').slice(0, 5);
        summary.push(`  Preview: ${lines.join('\n  ')}`);
        if (lastChange.content.split('\n').length > 5) {
          summary.push('  ...(truncated)');
        }
      }
    });
    
    return summary.join('\n');
  }

  async getSessionStatus(sessionId: string): Promise<{
    sessionId: string;
    startTime: Date;
    duration: number;
    watchedFiles: string[];
    changedFiles: number;
    lastActivity?: Date;
  } | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    let lastActivity: Date | undefined;
    session.changedFiles.forEach(changes => {
      changes.forEach(change => {
        if (!lastActivity || change.timestamp > lastActivity) {
          lastActivity = change.timestamp;
        }
      });
    });
    
    return {
      sessionId,
      startTime: session.startTime,
      duration: Date.now() - session.startTime.getTime(),
      watchedFiles: session.watcher.getWatchedFiles(),
      changedFiles: this.getTotalChangeCount(session),
      lastActivity
    };
  }

  async stopIDESession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.watcher.stop();
    this.sessions.delete(sessionId);
    
    console.log(chalk.green(`🛑 IDE session stopped: ${sessionId}`));
    return true;
  }

  listActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  async stopAllSessions() {
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.stopIDESession(sessionId);
    }
  }
}

// Global IDE integration instance
export const ideIntegration = new IDEIntegration();