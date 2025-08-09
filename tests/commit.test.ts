import { describe, it, expect, vi } from 'vitest';
import { generateCommitMessage } from '../src/lib/commit.js';

// Mock the git module
vi.mock('../src/lib/git.js', () => ({
  getStagedDiff: vi.fn().mockResolvedValue('diff --git a/src/index.js b/src/index.js\n+console.log("hello");')
}));

describe('commit', () => {
  describe('generateCommitMessage', () => {
    it('should generate commit message for staged files', async () => {
      const stagedFiles = ['src/index.js'];
      const message = await generateCommitMessage(stagedFiles);
      
      expect(message).toBe('feat: update index.js');
    });

    it('should handle multiple files', async () => {
      const stagedFiles = ['src/a.js', 'src/b.js'];
      const message = await generateCommitMessage(stagedFiles);
      
      expect(message).toBe('feat: update src/a.js, src/b.js');
    });
  });
});
