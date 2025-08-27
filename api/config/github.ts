import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const githubToken = process.env.GITHUB_TOKEN;
const githubOrg = process.env.GITHUB_ORG;

if (!githubToken) {
  throw new Error('Missing GITHUB_TOKEN environment variable');
}

if (!githubOrg) {
  throw new Error('Missing GITHUB_ORG environment variable');
}

export const octokit = new Octokit({
  auth: githubToken,
});

export const GITHUB_ORG = githubOrg;

export default octokit;