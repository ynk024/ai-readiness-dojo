import { describe, it, expect } from 'vitest';

import {
  RepoId,
  RepoFullName,
  RepoUrl,
} from '../../../src/domain/value-objects/repo-value-objects.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('RepoId', () => {
  describe('create', () => {
    it('should create a valid RepoId', () => {
      const repoId = RepoId.create('repo_owner_name');
      expect(repoId.value).toBe('repo_owner_name');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => RepoId.create('')).toThrow(ValidationError);
      expect(() => RepoId.create('')).toThrow('RepoId cannot be empty');
    });

    it('should trim whitespace', () => {
      const repoId = RepoId.create('  repo_test  ');
      expect(repoId.value).toBe('repo_test');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const id1 = RepoId.create('repo_test');
      const id2 = RepoId.create('repo_test');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different values', () => {
      const id1 = RepoId.create('repo_test1');
      const id2 = RepoId.create('repo_test2');
      expect(id1.equals(id2)).toBe(false);
    });
  });
});

describe('RepoFullName', () => {
  describe('create', () => {
    it('should create a valid full name', () => {
      const fullName = RepoFullName.create('owner/repo-name');
      expect(fullName.value).toBe('owner/repo-name');
      expect(fullName.owner).toBe('owner');
      expect(fullName.name).toBe('repo-name');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => RepoFullName.create('')).toThrow(ValidationError);
      expect(() => RepoFullName.create('')).toThrow('RepoFullName cannot be empty');
    });

    it('should throw ValidationError for missing slash', () => {
      expect(() => RepoFullName.create('owner-repo')).toThrow(ValidationError);
      expect(() => RepoFullName.create('owner-repo')).toThrow(
        'RepoFullName must be in format "owner/name"',
      );
    });

    it('should throw ValidationError for empty owner', () => {
      expect(() => RepoFullName.create('/repo-name')).toThrow(ValidationError);
      expect(() => RepoFullName.create('/repo-name')).toThrow(
        'RepoFullName owner and name cannot be empty',
      );
    });

    it('should throw ValidationError for empty name', () => {
      expect(() => RepoFullName.create('owner/')).toThrow(ValidationError);
      expect(() => RepoFullName.create('owner/')).toThrow(
        'RepoFullName owner and name cannot be empty',
      );
    });

    it('should throw ValidationError for multiple slashes', () => {
      expect(() => RepoFullName.create('owner/repo/subpath')).toThrow(ValidationError);
      expect(() => RepoFullName.create('owner/repo/subpath')).toThrow(
        'RepoFullName must be in format "owner/name"',
      );
    });

    it('should handle complex repo names', () => {
      const fullName = RepoFullName.create('my-org/my-repo-123');
      expect(fullName.owner).toBe('my-org');
      expect(fullName.name).toBe('my-repo-123');
    });

    it('should trim whitespace', () => {
      const fullName = RepoFullName.create('  owner/repo  ');
      expect(fullName.value).toBe('owner/repo');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const fn1 = RepoFullName.create('owner/repo');
      const fn2 = RepoFullName.create('owner/repo');
      expect(fn1.equals(fn2)).toBe(true);
    });

    it('should return false for different values', () => {
      const fn1 = RepoFullName.create('owner1/repo');
      const fn2 = RepoFullName.create('owner2/repo');
      expect(fn1.equals(fn2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const fn1 = RepoFullName.create('Owner/Repo');
      const fn2 = RepoFullName.create('owner/repo');
      expect(fn1.equals(fn2)).toBe(false);
    });
  });
});

describe('RepoUrl', () => {
  describe('create', () => {
    it('should create a valid HTTPS URL', () => {
      const url = RepoUrl.create('https://github.com/owner/repo');
      expect(url.value).toBe('https://github.com/owner/repo');
    });

    it('should create a valid HTTP URL', () => {
      // eslint-disable-next-line sonarjs/no-clear-text-protocols -- Testing HTTP support
      const url = RepoUrl.create('http://github.com/owner/repo');
      // eslint-disable-next-line sonarjs/no-clear-text-protocols -- Testing HTTP support
      expect(url.value).toBe('http://github.com/owner/repo');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => RepoUrl.create('')).toThrow(ValidationError);
      expect(() => RepoUrl.create('')).toThrow('RepoUrl cannot be empty');
    });

    it('should throw ValidationError for invalid URL', () => {
      expect(() => RepoUrl.create('not-a-url')).toThrow(ValidationError);
      expect(() => RepoUrl.create('not-a-url')).toThrow('RepoUrl must be a valid URL');
    });

    it('should throw ValidationError for non-http(s) protocol', () => {
      // eslint-disable-next-line sonarjs/no-clear-text-protocols
      expect(() => RepoUrl.create('ftp://github.com/owner/repo')).toThrow(ValidationError);
      // eslint-disable-next-line sonarjs/no-clear-text-protocols
      expect(() => RepoUrl.create('ftp://github.com/owner/repo')).toThrow(
        'RepoUrl must use http or https protocol',
      );
    });

    it('should trim whitespace', () => {
      const url = RepoUrl.create('  https://github.com/owner/repo  ');
      expect(url.value).toBe('https://github.com/owner/repo');
    });
  });

  describe('equals', () => {
    it('should return true for same URL', () => {
      const url1 = RepoUrl.create('https://github.com/owner/repo');
      const url2 = RepoUrl.create('https://github.com/owner/repo');
      expect(url1.equals(url2)).toBe(true);
    });

    it('should return false for different URLs', () => {
      const url1 = RepoUrl.create('https://github.com/owner/repo1');
      const url2 = RepoUrl.create('https://github.com/owner/repo2');
      expect(url1.equals(url2)).toBe(false);
    });
  });
});
