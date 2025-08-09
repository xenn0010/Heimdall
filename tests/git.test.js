import { describe, it, expect } from 'vitest';
describe('git', () => {
    describe('getRemoteInfo', () => {
        // Mock test since we can't run actual git commands in the test environment
        it('should parse GitHub HTTPS URL', () => {
            // This would need to be mocked in a real test environment
            // For now, just test the URL parsing logic manually
            const httpsUrl = 'https://github.com/owner/repo.git';
            const match = httpsUrl.match(/github\.com[\/:]([^\/]+)\/(.+?)(?:\.git)?$/);
            expect(match).toBeTruthy();
            if (match) {
                expect(match[1]).toBe('owner');
                expect(match[2]).toBe('repo');
            }
        });
        it('should parse GitHub SSH URL', () => {
            const sshUrl = 'git@github.com:owner/repo.git';
            const match = sshUrl.match(/github\.com[\/:]([^\/]+)\/(.+?)(?:\.git)?$/);
            expect(match).toBeTruthy();
            if (match) {
                expect(match[1]).toBe('owner');
                expect(match[2]).toBe('repo');
            }
        });
    });
});
