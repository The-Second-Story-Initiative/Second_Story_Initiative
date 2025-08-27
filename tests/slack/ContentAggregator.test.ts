/**
 * Tests for ContentAggregator
 */

import { ContentAggregator } from '../../api/slack/ContentAggregator';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import Parser from 'rss-parser';

// Mock external dependencies
jest.mock('axios');
jest.mock('rss-parser');
jest.mock('@anthropic-ai/sdk');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockParser = Parser as jest.MockedClass<typeof Parser>;
const mockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe('ContentAggregator', () => {
  let contentAggregator: ContentAggregator;
  let mockClaude: jest.Mocked<Anthropic>;
  let mockSlackApp: any;
  let mockRssParser: jest.Mocked<Parser>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Claude
    mockClaude = {
      messages: {
        create: jest.fn()
      }
    } as any;

    // Mock Slack App
    mockSlackApp = {
      client: {
        chat: {
          postMessage: jest.fn().mockResolvedValue({ ok: true })
        }
      }
    };

    // Mock RSS Parser
    mockRssParser = {
      parseURL: jest.fn()
    } as any;

    mockParser.mockImplementation(() => mockRssParser);

    contentAggregator = new ContentAggregator(mockClaude, mockSlackApp);
  });

  describe('aggregateContent', () => {
    it('should aggregate tech news from multiple sources', async () => {
      // Mock RSS feed response
      mockRssParser.parseURL.mockResolvedValue({
        title: 'Tech News Feed',
        items: [
          {
            title: 'New JavaScript Framework Released',
            link: 'https://example.com/js-framework',
            contentSnippet: 'A revolutionary new framework...',
            pubDate: '2024-01-01T00:00:00Z'
          },
          {
            title: 'CSS Grid Tutorial',
            link: 'https://example.com/css-grid',
            contentSnippet: 'Learn CSS Grid layout...',
            pubDate: '2024-01-01T00:00:00Z'
          }
        ]
      });

      // Mock JSON API response
      mockAxios.get.mockResolvedValue({
        data: [
          {
            title: 'Dev.to Article',
            url: 'https://dev.to/article',
            description: 'Great article about React',
            published_at: '2024-01-01T00:00:00Z',
            tag_list: ['react', 'javascript']
          }
        ]
      });

      const result = await contentAggregator.aggregateContent('tech_news', 5);

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Dev.to Article');
      expect(result[1].title).toBe('New JavaScript Framework Released');
      expect(result[2].title).toBe('CSS Grid Tutorial');
    });

    it('should handle job listings aggregation', async () => {
      mockAxios.get.mockResolvedValue({
        data: [
          {
            id: 'job1',
            position: 'Frontend Developer',
            company: 'TechCorp',
            description: 'Join our team...',
            tags: ['react', 'javascript']
          },
          {
            id: 'job2',
            position: 'Backend Developer',
            company: 'StartupCo',
            description: 'Build scalable APIs...',
            tags: ['node', 'express']
          }
        ]
      });

      const result = await contentAggregator.aggregateContent('job_listings', 3);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Frontend Developer at TechCorp');
      expect(result[1].title).toBe('Backend Developer at StartupCo');
      expect(result[0].url).toContain('remoteok.io');
    });

    it('should handle errors gracefully', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));
      mockRssParser.parseURL.mockRejectedValue(new Error('RSS error'));

      const result = await contentAggregator.aggregateContent('tech_news', 5);

      expect(result).toHaveLength(0);
    });

    it('should limit results correctly', async () => {
      const mockItems = Array.from({ length: 20 }, (_, i) => ({
        title: `Item ${i}`,
        link: `https://example.com/${i}`,
        contentSnippet: `Description ${i}`,
        pubDate: '2024-01-01T00:00:00Z'
      }));

      mockRssParser.parseURL.mockResolvedValue({
        title: 'Large Feed',
        items: mockItems
      });

      const result = await contentAggregator.aggregateContent('tech_news', 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('curateContent', () => {
    const mockContent = [
      {
        title: 'Advanced React Patterns',
        url: 'https://example.com/react-advanced',
        description: 'Deep dive into React patterns',
        source: 'Dev.to'
      },
      {
        title: 'HTML for Beginners',
        url: 'https://example.com/html-basics',
        description: 'Learn HTML from scratch',
        source: 'FreeCodeCamp'
      },
      {
        title: 'JavaScript ES2024 Features',
        url: 'https://example.com/js-features',
        description: 'New JavaScript features',
        source: 'MDN'
      }
    ];

    it('should curate content using Claude AI', async () => {
      const mockClaudeResponse = {
        content: [{
          text: JSON.stringify({
            items: [
              {
                title: 'HTML for Beginners',
                url: 'https://example.com/html-basics',
                description: 'Learn HTML from scratch',
                whyValuable: 'Perfect starting point for new developers',
                difficulty: 'beginner',
                recommendedFor: ['week 1-2']
              },
              {
                title: 'JavaScript ES2024 Features',
                url: 'https://example.com/js-features',
                description: 'New JavaScript features',
                whyValuable: 'Keeps developers up to date with latest features',
                difficulty: 'intermediate',
                recommendedFor: ['week 8+']
              }
            ],
            summary: 'Mix of beginner and intermediate content',
            recommendedFor: ['New developers', 'Intermediate learners']
          })
        }]
      };

      mockClaude.messages.create.mockResolvedValue(mockClaudeResponse as any);

      const result = await contentAggregator.curateContent(mockContent, 'learning_resources');

      expect(mockClaude.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: expect.stringContaining('learning_resources') }]
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].difficulty).toBe('beginner');
      expect(result.items[1].difficulty).toBe('intermediate');
      expect(result.summary).toBe('Mix of beginner and intermediate content');
    });

    it('should fallback gracefully when Claude fails', async () => {
      mockClaude.messages.create.mockRejectedValue(new Error('Claude API error'));

      const result = await contentAggregator.curateContent(mockContent, 'tech_news');

      expect(result.items).toHaveLength(3);
      expect(result.items[0].whyValuable).toBe('Potentially relevant for learning journey');
      expect(result.items[0].difficulty).toBe('beginner');
      expect(result.summary).toBe('Top tech news items');
    });

    it('should handle invalid JSON from Claude', async () => {
      const mockClaudeResponse = {
        content: [{
          text: 'Invalid JSON response'
        }]
      };

      mockClaude.messages.create.mockResolvedValue(mockClaudeResponse as any);

      const result = await contentAggregator.curateContent(mockContent, 'tech_news');

      expect(result.items).toHaveLength(3);
      expect(result.summary).toBe('Top tech news items');
    });
  });

  describe('shareContent', () => {
    it('should share curated content to Slack', async () => {
      const mockCuratedContent = {
        items: [
          {
            title: 'Test Article',
            url: 'https://example.com/test',
            description: 'Test description',
            whyValuable: 'Great for learning',
            difficulty: 'beginner' as const
          }
        ],
        summary: 'Test content summary',
        recommendedFor: ['New learners']
      };

      // Mock aggregateContent
      mockRssParser.parseURL.mockResolvedValue({
        title: 'Test Feed',
        items: [
          {
            title: 'Test Article',
            link: 'https://example.com/test',
            contentSnippet: 'Test description'
          }
        ]
      });

      // Mock curateContent
      const mockClaudeResponse = {
        content: [{
          text: JSON.stringify(mockCuratedContent)
        }]
      };
      mockClaude.messages.create.mockResolvedValue(mockClaudeResponse as any);

      await contentAggregator.shareContent('tech_news', 'C1234567890');

      expect(mockSlackApp.client.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C1234567890',
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'header',
            text: expect.objectContaining({
              text: expect.stringContaining('Tech News')
            })
          })
        ])
      });
    });

    it('should handle empty content gracefully', async () => {
      // Mock empty content
      mockRssParser.parseURL.mockResolvedValue({
        title: 'Empty Feed',
        items: []
      });

      await contentAggregator.shareContent('tech_news', 'C1234567890');

      expect(mockSlackApp.client.chat.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('getCuratedJobs', () => {
    it('should return curated job blocks for Slack', async () => {
      const mockJobs = [
        {
          id: 'job1',
          position: 'Junior Developer',
          company: 'TechCorp',
          description: 'Entry level position',
          tags: ['javascript', 'html']
        }
      ];

      mockAxios.get.mockResolvedValue({
        data: mockJobs
      });

      const mockCuratedJobs = {
        items: [
          {
            title: 'Junior Developer at TechCorp',
            url: 'https://remoteok.io/remote-jobs/job1',
            description: 'Entry level position',
            whyValuable: 'Great for new developers',
            difficulty: 'entry_level' as const
          }
        ],
        summary: 'Entry-level opportunities',
        recommendedFor: ['New developers']
      };

      mockClaude.messages.create.mockResolvedValue({
        content: [{ text: JSON.stringify(mockCuratedJobs) }]
      } as any);

      const result = await contentAggregator.getCuratedJobs('javascript');

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('type', 'header');
    });

    it('should filter jobs by keywords', async () => {
      const mockJobs = [
        {
          id: 'job1',
          position: 'JavaScript Developer',
          company: 'TechCorp',
          description: 'JavaScript position',
          tags: ['javascript']
        },
        {
          id: 'job2',
          position: 'Python Developer',
          company: 'StartupCo',
          description: 'Python position',
          tags: ['python']
        }
      ];

      mockAxios.get.mockResolvedValue({
        data: mockJobs
      });

      // Mock the content aggregation by overriding the method temporarily
      const originalMethod = contentAggregator.aggregateContent;
      contentAggregator.aggregateContent = jest.fn().mockResolvedValue([
        {
          title: 'JavaScript Developer at TechCorp',
          url: 'https://remoteok.io/remote-jobs/job1',
          description: 'JavaScript position'
        }
      ]);

      mockClaude.messages.create.mockResolvedValue({
        content: [{ text: JSON.stringify({
          items: [{
            title: 'JavaScript Developer at TechCorp',
            url: 'https://remoteok.io/remote-jobs/job1',
            description: 'JavaScript position',
            whyValuable: 'Matches your skills',
            difficulty: 'junior'
          }],
          summary: 'JavaScript opportunities',
          recommendedFor: ['JavaScript learners']
        }) }]
      } as any);

      await contentAggregator.getCuratedJobs('javascript');

      expect(contentAggregator.aggregateContent).toHaveBeenCalledWith('job_listings', 15);

      // Restore original method
      contentAggregator.aggregateContent = originalMethod;
    });
  });

  describe('getCuratedLearningResources', () => {
    it('should return curated learning resources', async () => {
      const mockResources = [
        {
          title: 'React Tutorial',
          link: 'https://reactjs.org/tutorial',
          contentSnippet: 'Learn React',
          pubDate: '2024-01-01'
        }
      ];

      mockRssParser.parseURL.mockResolvedValue({
        title: 'Learning Feed',
        items: mockResources
      });

      const mockCuratedResources = {
        items: [
          {
            title: 'React Tutorial',
            url: 'https://reactjs.org/tutorial',
            description: 'Learn React',
            whyValuable: 'Essential for modern web development',
            difficulty: 'intermediate' as const
          }
        ],
        summary: 'React learning materials',
        recommendedFor: ['Week 8+ learners']
      };

      mockClaude.messages.create.mockResolvedValue({
        content: [{ text: JSON.stringify(mockCuratedResources) }]
      } as any);

      const result = await contentAggregator.getCuratedLearningResources('react');

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('type', 'header');
      expect(result[0].text.text).toContain('Learning Resources');
    });

    it('should handle topic filtering', async () => {
      mockRssParser.parseURL.mockResolvedValue({
        title: 'Learning Feed',
        items: [
          {
            title: 'JavaScript Basics',
            link: 'https://example.com/js',
            contentSnippet: 'Learn JavaScript',
            tags: ['javascript', 'basics']
          },
          {
            title: 'Python Advanced',
            link: 'https://example.com/py',
            contentSnippet: 'Advanced Python',
            tags: ['python', 'advanced']
          }
        ]
      });

      // Mock the filtering logic
      const originalMethod = contentAggregator.aggregateContent;
      contentAggregator.aggregateContent = jest.fn().mockResolvedValue([
        {
          title: 'JavaScript Basics',
          url: 'https://example.com/js',
          description: 'Learn JavaScript',
          tags: ['javascript', 'basics']
        }
      ]);

      mockClaude.messages.create.mockResolvedValue({
        content: [{ text: JSON.stringify({
          items: [{
            title: 'JavaScript Basics',
            url: 'https://example.com/js',
            description: 'Learn JavaScript',
            whyValuable: 'Fundamental programming concepts',
            difficulty: 'beginner'
          }],
          summary: 'JavaScript fundamentals',
          recommendedFor: ['New programmers']
        }) }]
      } as any);

      await contentAggregator.getCuratedLearningResources('javascript');

      expect(contentAggregator.aggregateContent).toHaveBeenCalledWith('learning_resources', 15);

      // Restore original method
      contentAggregator.aggregateContent = originalMethod;
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      mockAxios.get.mockRejectedValue(new Error('TIMEOUT'));

      const result = await contentAggregator.aggregateContent('tech_news', 5);

      expect(result).toEqual([]);
    });

    it('should handle malformed RSS feeds', async () => {
      mockRssParser.parseURL.mockRejectedValue(new Error('Invalid XML'));

      const result = await contentAggregator.aggregateContent('tech_news', 5);

      expect(result).toEqual([]);
    });

    it('should handle Claude API rate limits', async () => {
      mockClaude.messages.create.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await contentAggregator.curateContent([], 'tech_news');

      expect(result.items).toEqual([]);
      expect(result.summary).toBe('Top tech news items');
    });

    it('should handle Slack API errors', async () => {
      mockSlackApp.client.chat.postMessage.mockRejectedValue(new Error('Slack API error'));

      // Should not throw
      await expect(contentAggregator.shareContent('tech_news', 'C1234567890'))
        .resolves.toBeUndefined();
    });
  });
});