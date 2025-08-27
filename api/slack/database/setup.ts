/**
 * Database Setup Script for Second Story Initiative
 * Sets up the complete database schema in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SetupResult {
  success: boolean;
  message: string;
  errors?: string[];
}

class DatabaseSetup {
  private supabase: any;

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async setupDatabase(): Promise<SetupResult> {
    try {
      console.log('🚀 Starting Second Story database setup...');

      // Read the schema SQL file
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

      console.log('📄 Executing database schema...');

      // Split the SQL into individual statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      const errors: string[] = [];
      let successCount = 0;

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          const { error } = await this.supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (error) {
            // Try executing directly if RPC fails
            const { error: directError } = await this.supabase
              .from('__direct_sql__')
              .select('*')
              .limit(0); // This will fail but might give us a connection

            // For most operations, we'll need to execute via a custom function
            // or use the Supabase dashboard for initial setup
            console.log(`⚠️  Statement ${i + 1} may need manual execution: ${error.message}`);
            errors.push(`Statement ${i + 1}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} execution error:`, err);
          errors.push(`Statement ${i + 1}: ${err}`);
        }
      }

      console.log(`✅ Database setup completed. ${successCount} statements executed successfully.`);
      
      if (errors.length > 0) {
        console.log(`⚠️  ${errors.length} statements may need manual execution.`);
        console.log('💡 You can execute the schema.sql file manually in the Supabase dashboard.');
      }

      // Test the setup by checking if tables exist
      const tablesExist = await this.verifyTablesExist();
      
      if (tablesExist) {
        await this.createInitialData();
        return {
          success: true,
          message: 'Database setup completed successfully!',
          errors: errors.length > 0 ? errors : undefined
        };
      } else {
        return {
          success: false,
          message: 'Database setup incomplete. Please run schema.sql manually in Supabase dashboard.',
          errors
        };
      }

    } catch (error) {
      console.error('❌ Database setup failed:', error);
      return {
        success: false,
        message: 'Database setup failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async verifyTablesExist(): Promise<boolean> {
    try {
      // Try to query one of our main tables
      const { data, error } = await this.supabase
        .from('learner_profiles')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.log('Tables verification failed:', error);
      return false;
    }
  }

  private async createInitialData(): Promise<void> {
    try {
      console.log('📊 Creating initial sample data...');

      // Check if sample data already exists
      const { data: existingChallenges } = await this.supabase
        .from('challenges')
        .select('id')
        .limit(1);

      if (existingChallenges && existingChallenges.length > 0) {
        console.log('📋 Sample data already exists, skipping creation.');
        return;
      }

      // Create sample challenges
      const sampleChallenges = [
        {
          title: 'HTML Basics',
          description: 'Create your first HTML page with proper structure',
          difficulty: 'beginner',
          track: 'web_development',
          week_number: 1,
          skills_required: [],
          skills_learned: ['HTML', 'basic_structure'],
          instructions: 'Create an HTML file with head, body, and basic tags',
          success_criteria: ['Valid HTML structure', 'Includes head and body', 'Has at least 3 different HTML tags'],
          created_by: 'system',
          resources: [
            {
              title: 'HTML Introduction',
              url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
              type: 'documentation'
            }
          ]
        },
        {
          title: 'CSS Styling',
          description: 'Add styles to your HTML page',
          difficulty: 'beginner',
          track: 'web_development',
          week_number: 2,
          skills_required: ['HTML'],
          skills_learned: ['CSS', 'styling', 'selectors'],
          instructions: 'Create a CSS file and style your HTML page',
          success_criteria: ['External CSS file', 'At least 5 CSS rules', 'Responsive design principles'],
          created_by: 'system',
          resources: [
            {
              title: 'CSS Basics',
              url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
              type: 'documentation'
            }
          ]
        },
        {
          title: 'JavaScript Basics',
          description: 'Add interactivity to your webpage',
          difficulty: 'beginner',
          track: 'web_development',
          week_number: 3,
          skills_required: ['HTML', 'CSS'],
          skills_learned: ['JavaScript', 'DOM_manipulation', 'events'],
          instructions: 'Add JavaScript functionality to your webpage',
          success_criteria: ['Interactive elements', 'Event listeners', 'DOM manipulation'],
          created_by: 'system',
          resources: [
            {
              title: 'JavaScript Guide',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
              type: 'documentation'
            }
          ]
        }
      ];

      const { error: challengesError } = await this.supabase
        .from('challenges')
        .insert(sampleChallenges);

      if (challengesError) {
        console.error('Error creating sample challenges:', challengesError);
      } else {
        console.log('✅ Sample challenges created successfully');
      }

      // Create sample learning resources
      const sampleResources = [
        {
          title: 'HTML & CSS Crash Course',
          description: 'Complete beginner guide to HTML and CSS',
          url: 'https://www.freecodecamp.org/learn/',
          resource_type: 'course',
          difficulty: 'beginner',
          topics: ['HTML', 'CSS', 'web_development'],
          estimated_time_minutes: 120,
          source: 'FreeCodeCamp'
        },
        {
          title: 'JavaScript for Beginners',
          description: 'Learn JavaScript from scratch',
          url: 'https://www.codecademy.com/learn/introduction-to-javascript',
          resource_type: 'course',
          difficulty: 'beginner',
          topics: ['JavaScript', 'programming_basics'],
          estimated_time_minutes: 480,
          source: 'Codecademy'
        },
        {
          title: 'Git Version Control Tutorial',
          description: 'Master Git and GitHub',
          url: 'https://git-scm.com/docs/gittutorial',
          resource_type: 'tutorial',
          difficulty: 'beginner',
          topics: ['Git', 'version_control', 'GitHub'],
          estimated_time_minutes: 90,
          source: 'Git Documentation'
        }
      ];

      const { error: resourcesError } = await this.supabase
        .from('learning_resources')
        .insert(sampleResources);

      if (resourcesError) {
        console.error('Error creating sample resources:', resourcesError);
      } else {
        console.log('✅ Sample learning resources created successfully');
      }

      console.log('🎉 Initial data creation completed!');

    } catch (error) {
      console.error('Error creating initial data:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('learner_profiles')
        .select('count')
        .limit(0);

      return !error;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getSetupInstructions(): Promise<string> {
    return `
📋 Second Story Database Setup Instructions

1. **Manual Setup via Supabase Dashboard:**
   - Log into your Supabase dashboard: https://app.supabase.com
   - Go to your project
   - Navigate to SQL Editor
   - Copy and paste the contents of 'api/slack/database/schema.sql'
   - Execute the SQL commands

2. **Environment Variables Required:**
   - SUPABASE_URL=your_supabase_project_url
   - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   - SUPABASE_ANON_KEY=your_anon_key

3. **Verify Setup:**
   - Run this script again to test the connection
   - Check that all tables are created in the Supabase dashboard
   - Verify sample data exists in the 'challenges' table

4. **Row Level Security:**
   - RLS is enabled on all tables
   - Service role has full access
   - Adjust policies as needed for your security requirements

🔗 Need help? Check the Supabase documentation:
   https://supabase.com/docs/guides/database
`;
  }
}

// Run setup if this file is executed directly
async function main() {
  try {
    const setup = new DatabaseSetup();
    
    console.log('🔍 Testing Supabase connection...');
    const connectionOk = await setup.testConnection();
    
    if (!connectionOk) {
      console.log('❌ Could not connect to Supabase');
      console.log(await setup.getSetupInstructions());
      return;
    }

    const result = await setup.setupDatabase();
    
    if (result.success) {
      console.log('✅', result.message);
      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Some statements may need manual execution:');
        result.errors.forEach(error => console.log('  -', error));
        console.log('\n💡 See setup instructions below:');
        console.log(await setup.getSetupInstructions());
      }
    } else {
      console.log('❌', result.message);
      console.log('\n📋 Manual setup instructions:');
      console.log(await setup.getSetupInstructions());
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n📋 Please set up manually using the instructions below:');
    const setup = new DatabaseSetup();
    console.log(await setup.getSetupInstructions());
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseSetup };