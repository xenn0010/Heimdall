import { watch } from 'fs';
import { join, relative } from 'path';
import { readFile, stat } from 'fs/promises';
import chalk from 'chalk';
import { EventEmitter } from 'events';

export interface FileChange {
  type: 'create' | 'modify' | 'delete';
  file: string;
  timestamp: Date;
  content?: string;
}

export class IDEWatcher extends EventEmitter {
  private watchers: Map<string, any> = new Map();
  private watchedPaths: Set<string> = new Set();
  private fileStates: Map<string, { mtime: Date, size: number }> = new Map();

  constructor(private workingDir: string = process.cwd()) {
    super();
  }

  async startWatching(patterns: string[] = ['**/*.{ts,js,tsx,jsx,py,go,rs,java,cpp,c,h}']) {
    console.log(chalk.blue('🔍 Starting IDE file watcher...'));
    
    // Watch the entire working directory
    const watcher = watch(
      this.workingDir,
      { recursive: true },
      async (eventType, filename) => {
        if (!filename) return;
        
        const fullPath = join(this.workingDir, filename);
        const relativePath = relative(this.workingDir, fullPath);
        
        // Filter by patterns
        if (!this.matchesPatterns(relativePath, patterns)) {
          return;
        }
        
        try {
          await this.handleFileEvent(eventType, fullPath, relativePath);
        } catch (error) {
          // File might be deleted or inaccessible
          if (eventType === 'rename') {
            this.emitFileChange({
              type: 'delete',
              file: relativePath,
              timestamp: new Date()
            });
          }
        }
      }
    );
    
    this.watchers.set(this.workingDir, watcher);
    console.log(chalk.green(`✓ Watching ${this.workingDir} for file changes`));
  }

  private async handleFileEvent(eventType: string, fullPath: string, relativePath: string) {
    try {
      const stats = await stat(fullPath);
      const currentState = { mtime: stats.mtime, size: stats.size };
      const previousState = this.fileStates.get(fullPath);
      
      if (eventType === 'change') {
        // File was modified
        if (!previousState || 
            currentState.mtime.getTime() !== previousState.mtime.getTime() ||
            currentState.size !== previousState.size) {
          
          const content = await readFile(fullPath, 'utf-8');
          this.fileStates.set(fullPath, currentState);
          
          this.emitFileChange({
            type: 'modify',
            file: relativePath,
            timestamp: new Date(),
            content
          });
        }
      } else if (eventType === 'rename') {
        // File was created or moved
        const content = await readFile(fullPath, 'utf-8');
        this.fileStates.set(fullPath, currentState);
        
        this.emitFileChange({
          type: 'create',
          file: relativePath,
          timestamp: new Date(),
          content
        });
      }
    } catch (error) {
      // File was likely deleted
      if (this.fileStates.has(fullPath)) {
        this.fileStates.delete(fullPath);
        this.emitFileChange({
          type: 'delete',
          file: relativePath,
          timestamp: new Date()
        });
      }
    }
  }

  private matchesPatterns(filePath: string, patterns: string[]): boolean {
    // Simple pattern matching - can be enhanced with glob
    return patterns.some(pattern => {
      const extensions = pattern.match(/\{([^}]+)\}/)?.[1]?.split(',') || [];
      if (extensions.length > 0) {
        return extensions.some(ext => filePath.endsWith(`.${ext.trim()}`));
      }
      return filePath.includes(pattern.replace('**/', '').replace('*', ''));
    });
  }

  private emitFileChange(change: FileChange) {
    console.log(chalk.yellow(`📝 ${change.type.toUpperCase()}: ${change.file}`));
    this.emit('fileChange', change);
  }

  stop() {
    console.log(chalk.blue('🛑 Stopping IDE file watcher...'));
    this.watchers.forEach((watcher, path) => {
      watcher.close();
      console.log(chalk.gray(`✓ Stopped watching ${path}`));
    });
    this.watchers.clear();
    this.watchedPaths.clear();
    this.fileStates.clear();
  }

  getWatchedFiles(): string[] {
    return Array.from(this.fileStates.keys()).map(path => 
      relative(this.workingDir, path)
    );
  }
}

export async function createIDEWatcher(workingDir?: string): Promise<IDEWatcher> {
  const watcher = new IDEWatcher(workingDir);
  return watcher;
}