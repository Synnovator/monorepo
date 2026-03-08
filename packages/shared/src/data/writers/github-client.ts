import { Octokit } from 'octokit';

export interface CreatePROpts {
  branch: string;
  files: { path: string; content: string }[];
  title: string;
  body: string;
  labels?: string[];
  baseBranch?: string;
}

export function createGitHubClient(token: string) {
  const octokit = new Octokit({ auth: token });

  return {
    async createPR(owner: string, repo: string, opts: CreatePROpts) {
      const { branch, files, title, body, labels, baseBranch = 'main' } = opts;

      // Get the latest commit SHA on the base branch
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });

      // Create a new branch from the base
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: ref.object.sha,
      });

      // Create or update each file on the new branch
      for (const file of files) {
        let sha: string | undefined;
        try {
          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: file.path,
            ref: branch,
          });
          if (!Array.isArray(data) && 'sha' in data) sha = data.sha;
        } catch {
          // New file — no existing SHA needed
        }

        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          branch,
          message: title,
          content: Buffer.from(file.content).toString('base64'),
          ...(sha ? { sha } : {}),
        });
      }

      // Open the pull request
      const { data: pr } = await octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head: branch,
        base: baseBranch,
      });

      // Add labels if specified
      if (labels?.length) {
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: pr.number,
          labels,
        });
      }

      return { number: pr.number, url: pr.html_url };
    },

    async mergePR(owner: string, repo: string, prNumber: number) {
      await octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
      });
    },

    async closePR(owner: string, repo: string, prNumber: number, comment?: string) {
      if (comment) {
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: comment,
        });
      }
      await octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: prNumber,
        state: 'closed',
      });
    },

    async listOpenPRs(owner: string, repo: string, labels?: string[]) {
      const { data } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'open',
      });
      if (labels?.length) {
        return data.filter(pr =>
          labels.every(label => pr.labels.some(l => l.name === label)),
        );
      }
      return data;
    },

    async checkRepoPermission(owner: string, repo: string, _username: string) {
      try {
        // Use repos.get() which returns permissions for the authenticated user
        // without requiring elevated OAuth scopes (read:user is sufficient)
        const { data } = await octokit.rest.repos.get({ owner, repo });
        const perms = data.permissions;
        if (!perms) return 'none';
        if (perms.admin) return 'admin';
        if (perms.maintain) return 'maintain';
        if (perms.push) return 'write';
        if (perms.triage) return 'triage';
        if (perms.pull) return 'read';
        return 'none';
      } catch {
        return 'none';
      }
    },
  };
}
