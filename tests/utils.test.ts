import { describe, it, expect } from 'vitest';
import { parseCommitType, generateCommitDescription, formatCommitMessage } from '../src/lib/utils.js';
import type { CommitMessage } from '../src/types/index.js';

describe('utils', () => {
  describe('parseCommitType', () => {
    it('should return "build" for package.json changes', () => {
      const diff = 'diff --git a/package.json b/package.json\n+ "dependencies": {\n+ "new-package": "1.0.0"';
      expect(parseCommitType(diff)).toBe('build');
    });

    it('should return "test" for test files', () => {
      const diff = 'diff --git a/src/test.js b/src/test.js\n+describe("test", () => {';
      expect(parseCommitType(diff)).toBe('test');
    });

    it('should return "docs" for markdown files', () => {
      const diff = 'diff --git a/README.md b/README.md\n+# New section';
      expect(parseCommitType(diff)).toBe('docs');
    });

    it('should return "feat" as default', () => {
      const diff = 'diff --git a/src/index.js b/src/index.js\n+console.log("hello");';
      expect(parseCommitType(diff)).toBe('feat');
    });
  });

  describe('generateCommitDescription', () => {
    it('should handle single file', () => {
      expect(generateCommitDescription(['src/index.js'])).toBe('update index.js');
    });

    it('should handle multiple files', () => {
      expect(generateCommitDescription(['src/a.js', 'src/b.js'])).toBe('update src/a.js, src/b.js');
    });

    it('should handle many files', () => {
      const files = ['a.js', 'b.js', 'c.js', 'd.js', 'e.js'];
      expect(generateCommitDescription(files)).toBe('update 5 files');
    });
  });

  describe('formatCommitMessage', () => {
    it('should format basic commit message', () => {
      const commit: CommitMessage = {
        type: 'feat',
        description: 'add new feature'
      };
      expect(formatCommitMessage(commit)).toBe('feat: add new feature');
    });

    it('should format commit message with scope', () => {
      const commit: CommitMessage = {
        type: 'feat',
        scope: 'auth',
        description: 'add login flow'
      };
      expect(formatCommitMessage(commit)).toBe('feat(auth): add login flow');
    });

    it('should format commit message with body and footer', () => {
      const commit: CommitMessage = {
        type: 'fix',
        description: 'resolve login issue',
        body: 'This fixes the authentication problem',
        footer: 'Closes #123'
      };
      expect(formatCommitMessage(commit)).toBe(
        'fix: resolve login issue\n\nThis fixes the authentication problem\n\nCloses #123'
      );
    });
  });
});
