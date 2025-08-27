/**
 * GitHub Integration API routes for Second Story Initiative
 * Handle GitHub repository management, project tracking, and organization features
 */
import { Router, type Request, type Response } from 'express';
import { octokit } from '../config/github.js';
import { supabase } from '../config/supabase.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Connect GitHub Account
 * POST /api/github/connect
 */
router.post('/connect', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { github_username, github_token } = req.body;

    if (!github_username) {
      res.status(400).json({ success: false, error: 'GitHub username is required' });
      return;
    }

    // Verify GitHub user exists
    try {
      const { data: githubUser } = await octokit.rest.users.getByUsername({
        username: github_username
      });

      // Update user profile with GitHub info
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          github_username,
          github_connected: true,
          github_connected_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ success: false, error: 'Failed to update user profile' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          github_profile: {
            login: githubUser.login,
            name: githubUser.name,
            avatar_url: githubUser.avatar_url,
            public_repos: githubUser.public_repos,
            followers: githubUser.followers,
            following: githubUser.following
          }
        },
        message: 'GitHub account connected successfully'
      });
    } catch (githubError) {
      res.status(400).json({ success: false, error: 'GitHub username not found' });
      return;
    }
  } catch (error) {
    console.error('GitHub connect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect GitHub account'
    });
  }
});

/**
 * Get User's GitHub Repositories
 * GET /api/github/repositories
 */
router.get('/repositories', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!req.user.github_username) {
      res.status(400).json({ success: false, error: 'GitHub account not connected' });
      return;
    }

    const { data: repos } = await octokit.rest.repos.listForUser({
      username: req.user.github_username,
      type: 'all',
      sort: 'updated',
      per_page: 50
    });

    // Filter and format repository data
    const formattedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      private: repo.private,
      fork: repo.fork,
      archived: repo.archived
    }));

    res.status(200).json({
      success: true,
      data: { repositories: formattedRepos },
      message: 'Repositories fetched successfully'
    });
  } catch (error) {
    console.error('Fetch repositories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repositories'
    });
  }
});

/**
 * Create Project Repository
 * POST /api/github/repositories
 */
router.post('/repositories', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { name, description, private: isPrivate = false, template_repo } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Repository name is required' });
      return;
    }

    // Create repository in Second Story Initiative organization
    const orgName = process.env.GITHUB_ORGANIZATION || 'second-story-initiative';
    
    try {
      const { data: repo } = await octokit.rest.repos.createInOrg({
        org: orgName,
        name,
        description: description || `Project repository for ${req.user.full_name}`,
        private: isPrivate,
        auto_init: true,
        gitignore_template: 'Node',
        license_template: 'mit'
      });

      // Add user as collaborator
      if (req.user.github_username) {
        await octokit.rest.repos.addCollaborator({
          owner: orgName,
          repo: name,
          username: req.user.github_username,
          permission: 'push'
        });
      }

      // Store project in database
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: req.user.id,
          title: name,
          description,
          github_repo_url: repo.html_url,
          github_repo_name: repo.full_name,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (projectError) {
        console.error('Database error storing project:', projectError);
      }

      res.status(201).json({
        success: true,
        data: {
          repository: {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            html_url: repo.html_url,
            clone_url: repo.clone_url,
            description: repo.description
          },
          project
        },
        message: 'Repository created successfully'
      });
    } catch (githubError: any) {
      if (githubError.status === 422) {
        res.status(400).json({ success: false, error: 'Repository name already exists' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create repository' });
      }
      return;
    }
  } catch (error) {
    console.error('Create repository error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create repository'
    });
  }
});

/**
 * Get Repository Details
 * GET /api/github/repositories/:owner/:repo
 */
router.get('/repositories/:owner/:repo', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { owner, repo } = req.params;

    const { data: repository } = await octokit.rest.repos.get({
      owner,
      repo
    });

    // Get recent commits
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 10
    });

    // Get repository languages
    const { data: languages } = await octokit.rest.repos.listLanguages({
      owner,
      repo
    });

    // Get repository statistics
    const { data: stats } = await octokit.rest.repos.getCodeFrequencyStats({
      owner,
      repo
    }).catch(() => ({ data: [] }));

    res.status(200).json({
      success: true,
      data: {
        repository: {
          id: repository.id,
          name: repository.name,
          full_name: repository.full_name,
          description: repository.description,
          html_url: repository.html_url,
          clone_url: repository.clone_url,
          language: repository.language,
          stargazers_count: repository.stargazers_count,
          forks_count: repository.forks_count,
          size: repository.size,
          created_at: repository.created_at,
          updated_at: repository.updated_at,
          pushed_at: repository.pushed_at
        },
        recent_commits: commits.slice(0, 5).map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author,
          date: commit.commit.author?.date,
          html_url: commit.html_url
        })),
        languages,
        activity_stats: stats
      },
      message: 'Repository details fetched successfully'
    });
  } catch (error) {
    console.error('Fetch repository details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repository details'
    });
  }
});

/**
 * Get Organization Projects
 * GET /api/github/organization/projects
 */
router.get('/organization/projects', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgName = process.env.GITHUB_ORGANIZATION || 'second-story-initiative';

    const { data: repos } = await octokit.rest.repos.listForOrg({
      org: orgName,
      type: 'all',
      sort: 'updated',
      per_page: 50
    });

    // Get associated projects from database
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        *,
        users (
          id,
          full_name,
          github_username
        )
      `)
      .not('github_repo_url', 'is', null);

    // Combine GitHub data with database projects
    const combinedProjects = repos.map(repo => {
      const dbProject = projects?.find(p => p.github_repo_name === repo.full_name);
      return {
        github_data: {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          updated_at: repo.updated_at
        },
        project_data: dbProject || null
      };
    });

    res.status(200).json({
      success: true,
      data: { projects: combinedProjects },
      message: 'Organization projects fetched successfully'
    });
  } catch (error) {
    console.error('Fetch organization projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization projects'
    });
  }
});

/**
 * Submit Project for Review
 * POST /api/github/projects/:projectId/submit
 */
router.post('/projects/:projectId/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { projectId } = req.params;
    const { submission_notes = '' } = req.body;

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', req.user.id)
      .single();

    if (projectError || !project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    if (!project.github_repo_name) {
      res.status(400).json({ success: false, error: 'Project must have a GitHub repository' });
      return;
    }

    // Create GitHub issue for review
    const [owner, repo] = project.github_repo_name.split('/');
    
    try {
      const { data: issue } = await octokit.rest.issues.create({
        owner,
        repo,
        title: `Project Review Request: ${project.title}`,
        body: `## Project Review Request

**Student:** ${req.user.full_name}
**Project:** ${project.title}
**Description:** ${project.description}

**Submission Notes:**
${submission_notes}

**Review Checklist:**
- [ ] Code quality and structure
- [ ] Documentation completeness
- [ ] Functionality testing
- [ ] Best practices implementation
- [ ] Learning objectives met

**Repository:** ${project.github_repo_url}

Please review this project and provide feedback.`,
        labels: ['review-request', 'student-project']
      });

      // Update project status
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          submission_notes,
          review_issue_url: issue.html_url
        })
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ success: false, error: 'Failed to update project status' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          project: updatedProject,
          review_issue: {
            url: issue.html_url,
            number: issue.number
          }
        },
        message: 'Project submitted for review successfully'
      });
    } catch (githubError) {
      res.status(500).json({ success: false, error: 'Failed to create review issue' });
      return;
    }
  } catch (error) {
    console.error('Submit project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit project for review'
    });
  }
});

/**
 * Get GitHub Activity Stats
 * GET /api/github/stats
 */
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!req.user.github_username) {
      res.status(400).json({ success: false, error: 'GitHub account not connected' });
      return;
    }

    // Get user's GitHub profile
    const { data: user } = await octokit.rest.users.getByUsername({
      username: req.user.github_username
    });

    // Get user's repositories
    const { data: repos } = await octokit.rest.repos.listForUser({
      username: req.user.github_username,
      type: 'all'
    });

    // Calculate stats
    const totalRepos = repos.length;
    const publicRepos = repos.filter(repo => !repo.private).length;
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const languages = repos.reduce((acc: any, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] || 0) + 1;
      }
      return acc;
    }, {});

    // Get recent activity (simplified)
    const recentRepos = repos
      .filter(repo => repo.pushed_at)
      .sort((a, b) => new Date(b.pushed_at!).getTime() - new Date(a.pushed_at!).getTime())
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        profile: {
          login: user.login,
          name: user.name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          public_repos: user.public_repos,
          followers: user.followers,
          following: user.following,
          created_at: user.created_at
        },
        stats: {
          total_repositories: totalRepos,
          public_repositories: publicRepos,
          total_stars: totalStars,
          total_forks: totalForks,
          top_languages: Object.entries(languages)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([lang, count]) => ({ language: lang, count }))
        },
        recent_activity: recentRepos.map(repo => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          updated_at: repo.pushed_at,
          html_url: repo.html_url
        }))
      },
      message: 'GitHub stats fetched successfully'
    });
  } catch (error) {
    console.error('Fetch GitHub stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GitHub stats'
    });
  }
});

export default router;