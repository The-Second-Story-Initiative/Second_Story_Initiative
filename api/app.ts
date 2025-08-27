import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import authRoutes from './routes/auth.js';
import mentorRoutes from './routes/mentor.js';
import learningRoutes from './routes/learning.js';
import githubRoutes from './routes/github.js';
import mentorshipRoutes from './routes/mentorship.js';
import analyticsRoutes from './routes/analytics.js';
import slackRoutes from './routes/slack.js';

const app = express();

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/slack', slackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Second Story Initiative API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Second Story Initiative API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      mentor: '/api/mentor',
      learning: '/api/learning',
      github: '/api/github',
      mentorship: '/api/mentorship',
      analytics: '/api/analytics',
      slack: '/api/slack',
      health: '/api/health'
    },
    documentation: 'https://github.com/your-org/second-story-initiative'
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

export default app;