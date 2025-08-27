-- Insert sample projects for demonstration
-- Note: This assumes there's at least one user in auth.users table
-- If no users exist, these inserts will be skipped

DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Get the first user ID from auth.users, or create a placeholder if none exists
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- Only insert sample data if we have a user
    IF sample_user_id IS NOT NULL THEN
        INSERT INTO projects (user_id, title, description, github_repo_url, live_demo_url, technologies, status, visibility, featured, image_url, likes_count, views_count) VALUES
        (
            sample_user_id,
            'AI-Powered Learning Assistant',
            'An intelligent tutoring system that adapts to individual learning styles and provides personalized feedback. Built with machine learning algorithms to track progress and suggest optimal learning paths.',
            'https://github.com/example/ai-learning-assistant',
            'https://ai-learning-demo.vercel.app',
            ARRAY['React', 'TypeScript', 'Python', 'TensorFlow', 'Node.js'],
            'completed',
            'public',
            true,
            'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20AI%20learning%20interface%20with%20dashboard%20charts%20and%20progress%20tracking%20clean%20blue%20theme&image_size=landscape_4_3',
            15,
            234
        ),
        (
            sample_user_id,
            'Community Project Hub',
            'A collaborative platform for developers to showcase projects, find team members, and get feedback from the community. Features real-time collaboration tools and project management.',
            'https://github.com/example/community-hub',
            'https://community-hub-demo.netlify.app',
            ARRAY['Vue.js', 'Firebase', 'Tailwind CSS', 'Express.js'],
            'in_progress',
            'public',
            false,
            'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=collaborative%20developer%20platform%20interface%20with%20project%20cards%20team%20collaboration%20modern%20design&image_size=landscape_4_3',
            8,
            156
        ),
        (
            sample_user_id,
            'Code Review Automation Tool',
            'An automated code review system that uses static analysis and machine learning to identify potential issues, suggest improvements, and maintain code quality standards.',
            'https://github.com/example/code-review-tool',
            NULL,
            ARRAY['Python', 'Docker', 'PostgreSQL', 'Redis', 'FastAPI'],
            'planning',
            'public',
            false,
            'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=code%20review%20automation%20interface%20with%20code%20analysis%20metrics%20and%20suggestions%20professional%20dark%20theme&image_size=landscape_4_3',
            3,
            89
        );
        
        RAISE NOTICE 'Sample projects inserted successfully';
    ELSE
        RAISE NOTICE 'No users found in auth.users table. Sample projects not inserted.';
    END IF;
END $$;