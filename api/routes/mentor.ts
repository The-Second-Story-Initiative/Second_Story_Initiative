/**
 * AI Mentor API routes for Second Story Initiative
 * Handle Claude AI integration for code reviews, chat support, and learning assistance
 */
import { Router, type Request, type Response } from 'express';
import { anthropic } from '../config/claude.js';
import { supabase } from '../config/supabase.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * AI Code Review
 * POST /api/mentor/review
 */
router.post('/review', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { code, context, language = 'javascript', learner_id } = req.body;

    if (!code) {
      res.status(400).json({ success: false, error: 'Code content is required' });
      return;
    }

    // Create AI prompt for code review
    const prompt = `You are an experienced software engineering mentor working with formerly incarcerated individuals learning to code through the Second Story Initiative. Your role is to provide encouraging, educational, and constructive code reviews.

Please review the following ${language} code and provide:
1. Positive feedback on what's working well
2. Specific improvement suggestions with explanations
3. Learning resources or concepts to explore
4. Encouragement and next steps

Code to review:
\`\`\`${language}
${code}
\`\`\`

${context ? `Additional context: ${context}` : ''}

Provide your review in a supportive, educational tone that builds confidence while promoting best practices.`;

    // Get AI review from Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const reviewContent = message.content[0];
    const review = reviewContent.type === 'text' ? reviewContent.text : 'Unable to generate review';

    // Store the review in database for tracking
    const { data: reviewRecord, error: dbError } = await supabase
      .from('ai_reviews')
      .insert({
        user_id: req.user.id,
        code_content: code,
        language,
        context,
        review_content: review,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error storing review:', dbError);
    }

    // Parse review into structured format
    const suggestions = extractSuggestions(review);
    const resources = extractResources(review);

    res.status(200).json({
      success: true,
      data: {
        review: {
          id: reviewRecord?.id,
          content: review,
          language,
          created_at: new Date().toISOString()
        },
        suggestions,
        resources
      },
      message: 'Code review completed successfully'
    });
  } catch (error) {
    console.error('AI review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate code review'
    });
  }
});

/**
 * AI Chat Support
 * POST /api/mentor/chat
 */
router.post('/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { message, conversation_history = [] } = req.body;

    if (!message) {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    // Build conversation context
    const systemPrompt = `You are an AI mentor for the Second Story Initiative, supporting formerly incarcerated individuals learning software development. You should:

1. Be encouraging and supportive
2. Provide clear, practical coding help
3. Explain concepts in beginner-friendly terms
4. Suggest relevant learning resources
5. Celebrate progress and achievements
6. Be patient and understanding
7. Focus on building confidence and skills

Always maintain a positive, professional tone while providing accurate technical guidance.`;

    // Prepare messages for Claude
    const messages = [
      { role: 'user' as const, content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    // Get AI response from Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: messages.slice(-10) // Keep last 10 messages for context
    });

    const responseContent = response.content[0];
    const aiResponse = responseContent.type === 'text' ? responseContent.text : 'I apologize, but I\'m having trouble responding right now.';

    // Store chat interaction
    const { error: dbError } = await supabase
      .from('ai_chat_logs')
      .insert({
        user_id: req.user.id,
        user_message: message,
        ai_response: aiResponse,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error storing chat:', dbError);
    }

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
        timestamp: new Date().toISOString()
      },
      message: 'Chat response generated successfully'
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate chat response'
    });
  }
});

/**
 * Get Learning Recommendations
 * POST /api/mentor/recommendations
 */
router.post('/recommendations', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { current_skills, learning_goals, difficulty_level = 'beginner' } = req.body;

    // Get user's progress data
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select(`
        *,
        modules:module_id (
          title,
          track_id,
          learning_tracks:track_id (name)
        )
      `)
      .eq('user_id', req.user.id);

    if (progressError) {
      console.error('Progress fetch error:', progressError);
    }

    // Create personalized recommendation prompt
    const prompt = `As an AI mentor for the Second Story Initiative, provide personalized learning recommendations for a ${difficulty_level} level learner.

Current skills: ${current_skills || 'Not specified'}
Learning goals: ${learning_goals || 'General software development'}
Progress data: ${progress ? JSON.stringify(progress.slice(0, 5)) : 'No progress data available'}

Provide:
1. 3-5 specific next learning topics
2. Recommended resources for each topic
3. Practical project ideas to apply the skills
4. Estimated timeline for each recommendation
5. Motivational message

Format as a structured JSON response.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseContent = response.content[0];
    const recommendations = responseContent.type === 'text' ? responseContent.text : 'Unable to generate recommendations';

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        generated_at: new Date().toISOString(),
        user_context: {
          current_skills,
          learning_goals,
          difficulty_level
        }
      },
      message: 'Learning recommendations generated successfully'
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    });
  }
});

/**
 * Get AI Review History
 * GET /api/mentor/reviews
 */
router.get('/reviews', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { data: reviews, error } = await supabase
      .from('ai_reviews')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { reviews },
      message: 'Reviews fetched successfully'
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

// Helper functions
function extractSuggestions(review: string): string[] {
  const suggestions: string[] = [];
  const lines = review.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('suggest') || 
        line.toLowerCase().includes('improve') || 
        line.toLowerCase().includes('consider')) {
      suggestions.push(line.trim());
    }
  }
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

function extractResources(review: string): string[] {
  const resources: string[] = [];
  const lines = review.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('resource') || 
        line.toLowerCase().includes('learn more') || 
        line.toLowerCase().includes('documentation')) {
      resources.push(line.trim());
    }
  }
  
  return resources.slice(0, 3); // Limit to 3 resources
}

export default router;