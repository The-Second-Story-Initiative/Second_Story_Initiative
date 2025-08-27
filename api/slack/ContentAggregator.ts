/**
 * Intelligent Content Aggregator for Second Story Initiative
 * Scrapes, curates, and shares relevant content for learners
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import Anthropic from '@anthropic-ai/sdk';
import { App } from '@slack/bolt';

interface ContentSource {
  url: string;
  type: 'json' | 'rss' | 'html';
  selector?: string;
  apiKey?: string;
}

interface ContentItem {
  title: string;
  url: string;
  description?: string;
  publishedAt?: string;
  source?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  whyValuable?: string;
}

interface CuratedContent {
  items: ContentItem[];
  summary: string;
  recommendedFor: string[];
}

export class ContentAggregator {
  private claude: Anthropic;
  private slackApp: App;
  private rssParser: Parser;
  private contentSources: { [key: string]: ContentSource[] };

  constructor(claude: Anthropic, slackApp: App) {
    this.claude = claude;
    this.slackApp = slackApp;
    this.rssParser = new Parser();

    this.contentSources = {
      tech_news: [
        { url: 'https://hnrss.org/frontpage', type: 'rss' },
        { url: 'https://dev.to/api/articles?top=7', type: 'json' },
        { url: 'https://techcrunch.com/feed/', type: 'rss' },
        { url: 'https://www.theverge.com/rss/index.xml', type: 'rss' },
        { url: 'https://feeds.feedburner.com/venturebeat/SZYF', type: 'rss' },
      ],
      job_listings: [
        { url: 'https://remoteok.io/api', type: 'json' },
        { url: 'https://jobs.github.com/positions.json', type: 'json' },
        { url: 'https://www.dice.com/jobs/rss', type: 'rss' },
        { url: 'https://stackoverflow.com/jobs/feed', type: 'rss' },
      ],
      learning_resources: [
        { url: 'https://www.freecodecamp.org/news/rss/', type: 'rss' },
        { url: 'https://css-tricks.com/feed/', type: 'rss' },
        { url: 'https://www.smashingmagazine.com/feed/', type: 'rss' },
        { url: 'https://dev.to/api/articles?tag=beginners', type: 'json' },
        { url: 'https://medium.com/feed/tag/programming', type: 'rss' },
        { url: 'https://javascript.plainenglish.io/feed', type: 'rss' },
      ],
      career_advice: [
        { url: 'https://www.linkedin.com/pulse/rss/', type: 'rss' },
        { url: 'https://www.glassdoor.com/blog/feed/', type: 'rss' },
        { url: 'https://www.themuse.com/rss', type: 'rss' },
      ],
    };
  }

  public async aggregateContent(contentType: string, limit: number = 20): Promise<ContentItem[]> {
    const sources = this.contentSources[contentType];
    if (!sources) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    const allContent: ContentItem[] = [];

    for (const source of sources) {
      try {
        const items = await this.scrapeSource(source, limit / sources.length);
        allContent.push(...items);
      } catch (error) {
        console.error(`Error scraping ${source.url}:`, error);
        continue;
      }
    }

    return allContent.slice(0, limit);
  }

  private async scrapeSource(source: ContentSource, limit: number): Promise<ContentItem[]> {
    switch (source.type) {
      case 'json':
        return this.scrapeJson(source.url, limit);
      case 'rss':
        return this.scrapeRss(source.url, limit);
      case 'html':
        return this.scrapeHtml(source.url, source.selector!, limit);
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  private async scrapeJson(url: string, limit: number): Promise<ContentItem[]> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Second-Story-Bot/1.0',
        },
      });

      const data = response.data;
      const items: ContentItem[] = [];

      if (url.includes('dev.to')) {
        for (const article of data.slice(0, limit)) {
          items.push({
            title: article.title,
            url: article.url,
            description: article.description,
            publishedAt: article.published_at,
            source: 'Dev.to',
            tags: article.tag_list,
          });
        }
      } else if (url.includes('remoteok.io')) {
        for (const job of data.slice(0, limit)) {
          if (job.position && job.company) {
            items.push({
              title: `${job.position} at ${job.company}`,
              url: `https://remoteok.io/remote-jobs/${job.id}`,
              description: job.description?.substring(0, 200) + '...',
              source: 'RemoteOK',
              tags: job.tags || [],
            });
          }
        }
      }

      return items;
    } catch (error) {
      console.error(`Error scraping JSON from ${url}:`, error);
      return [];
    }
  }

  private async scrapeRss(url: string, limit: number): Promise<ContentItem[]> {
    try {
      const feed = await this.rssParser.parseURL(url);
      const items: ContentItem[] = [];

      for (const item of feed.items.slice(0, limit)) {
        items.push({
          title: item.title || '',
          url: item.link || '',
          description: item.contentSnippet || item.content?.substring(0, 200),
          publishedAt: item.pubDate,
          source: feed.title || 'RSS Feed',
        });
      }

      return items;
    } catch (error) {
      console.error(`Error scraping RSS from ${url}:`, error);
      return [];
    }
  }

  private async scrapeHtml(url: string, selector: string, limit: number): Promise<ContentItem[]> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Second-Story-Bot/1.0',
        },
      });

      const $ = cheerio.load(response.data);
      const items: ContentItem[] = [];

      $(selector).slice(0, limit).each((index, element) => {
        const title = $(element).find('a').first().text().trim();
        const link = $(element).find('a').first().attr('href');
        
        if (title && link) {
          items.push({
            title,
            url: link.startsWith('http') ? link : new URL(link, url).href,
            source: new URL(url).hostname,
          });
        }
      });

      return items;
    } catch (error) {
      console.error(`Error scraping HTML from ${url}:`, error);
      return [];
    }
  }

  public async curateContent(
    content: ContentItem[],
    contentType: string,
    criteria?: string
  ): Promise<CuratedContent> {
    const defaultCriteria = {
      tech_news: 'Beginner-friendly tech news, practical for new developers, encouraging',
      job_listings: 'Entry-level and junior developer positions, remote-friendly, skills-based',
      learning_resources: 'Beginner to intermediate coding tutorials, practical projects, career-relevant',
      career_advice: 'Job search tips, interview preparation, career growth for new developers',
    };

    const prompt = `
You are curating ${contentType.replace('_', ' ')} for justice-impacted individuals learning to code in a supportive community program.

Content to evaluate:
${JSON.stringify(content.slice(0, 10), null, 2)}

Criteria: ${criteria || defaultCriteria[contentType as keyof typeof defaultCriteria]}

Please:
1. Select the TOP 5 most relevant and valuable items
2. Rank them by relevance to our learners
3. Explain why each is valuable
4. Assign difficulty levels where appropriate
5. Suggest who would benefit most

Consider:
- Accessibility for beginners and career changers
- Practical application and real-world relevance
- Motivational and encouraging content
- Diversity and inclusion aspects
- Skills that lead to employment

Return as JSON with this structure:
{
  "items": [
    {
      "title": "string",
      "url": "string", 
      "description": "string",
      "whyValuable": "string",
      "difficulty": "beginner|intermediate|advanced",
      "recommendedFor": ["week 1-4", "week 5-8", "job seekers", etc.]
    }
  ],
  "summary": "Brief overview of this content collection",
  "recommendedFor": ["specific learner groups who would benefit"]
}
`;

    try {
      const response = await this.claude.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const result = JSON.parse(response.content[0].text);
      return result;
    } catch (error) {
      console.error('Error curating content with Claude:', error);
      
      // Fallback: return top 5 items without AI curation
      return {
        items: content.slice(0, 5).map(item => ({
          ...item,
          whyValuable: 'Potentially relevant for learning journey',
          difficulty: 'beginner' as const,
        })),
        summary: `Top ${contentType.replace('_', ' ')} items`,
        recommendedFor: ['All learners'],
      };
    }
  }

  public async shareContent(contentType: string, channelId: string): Promise<void> {
    try {
      // Aggregate content
      const rawContent = await this.aggregateContent(contentType, 20);
      
      if (rawContent.length === 0) {
        console.log(`No content found for ${contentType}`);
        return;
      }

      // Curate with AI
      const curatedContent = await this.curateContent(rawContent, contentType);

      // Create Slack blocks
      const blocks = this.createSlackBlocks(curatedContent, contentType);

      // Post to Slack
      await this.slackApp.client.chat.postMessage({
        channel: channelId,
        blocks,
      });

      console.log(`Shared ${curatedContent.items.length} ${contentType} items to channel ${channelId}`);
    } catch (error) {
      console.error(`Error sharing ${contentType} content:`, error);
    }
  }

  private createSlackBlocks(curatedContent: CuratedContent, contentType: string): any[] {
    const typeEmojis = {
      tech_news: '📰',
      job_listings: '💼',
      learning_resources: '📚',
      career_advice: '💡',
    };

    const emoji = typeEmojis[contentType as keyof typeof typeEmojis] || '📌';
    const title = contentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${title} - Daily Curation`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${curatedContent.summary}*\n_Recommended for: ${curatedContent.recommendedFor.join(', ')}_`,
        },
      },
      {
        type: 'divider',
      },
    ];

    curatedContent.items.forEach((item, index) => {
      const difficultyEmoji = {
        beginner: '🟢',
        intermediate: '🟡', 
        advanced: '🔴',
      };

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${index + 1}. <${item.url}|${item.title}>*\n${item.description || ''}\n\n_Why it's valuable:_ ${item.whyValuable}\n${item.difficulty ? `${difficultyEmoji[item.difficulty]} ${item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}` : ''}`,
        },
      });

      if (index < curatedContent.items.length - 1) {
        blocks.push({ type: 'divider' });
      }
    });

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🤖 Curated by Second Story AI • ${new Date().toLocaleDateString()} • Questions? Just @mention me!`,
        },
      ],
    });

    return blocks;
  }

  public async getCuratedJobs(keywords?: string, location?: string): Promise<any[]> {
    try {
      const jobs = await this.aggregateContent('job_listings', 15);
      
      let filteredJobs = jobs;
      
      if (keywords) {
        const keywordArray = keywords.toLowerCase().split(' ');
        filteredJobs = jobs.filter(job => 
          keywordArray.some(keyword => 
            job.title.toLowerCase().includes(keyword) ||
            job.description?.toLowerCase().includes(keyword)
          )
        );
      }

      const curatedJobs = await this.curateContent(filteredJobs, 'job_listings', 
        keywords ? `Focus on roles matching: ${keywords}` : undefined
      );

      return this.createSlackBlocks(curatedJobs, 'job_listings');
    } catch (error) {
      console.error('Error getting curated jobs:', error);
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Sorry, I encountered an error while fetching job listings. Please try again later.',
          },
        },
      ];
    }
  }

  public async getCuratedLearningResources(topic?: string): Promise<any[]> {
    try {
      const resources = await this.aggregateContent('learning_resources', 15);
      
      let filteredResources = resources;
      
      if (topic) {
        const topicLower = topic.toLowerCase();
        filteredResources = resources.filter(resource => 
          resource.title.toLowerCase().includes(topicLower) ||
          resource.description?.toLowerCase().includes(topicLower) ||
          resource.tags?.some(tag => tag.toLowerCase().includes(topicLower))
        );
      }

      const curatedResources = await this.curateContent(filteredResources, 'learning_resources',
        topic ? `Focus on resources about: ${topic}` : undefined
      );

      return this.createSlackBlocks(curatedResources, 'learning_resources');
    } catch (error) {
      console.error('Error getting curated learning resources:', error);
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Sorry, I encountered an error while fetching learning resources. Please try again later.',
          },
        },
      ];
    }
  }
}