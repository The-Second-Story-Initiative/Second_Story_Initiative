import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Users,
  Github,
  Star,
  CheckCircle,
  Code,
  Briefcase,
  Target,
} from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Structured Learning Paths',
      description: 'Follow curated learning tracks designed for career changers, from basics to advanced concepts.',
    },
    {
      icon: Bot,
      title: 'AI-Powered Mentorship',
      description: 'Get personalized code reviews, learning recommendations, and 24/7 support from Claude AI.',
    },
    {
      icon: Users,
      title: 'Expert Mentorship',
      description: 'Connect with industry professionals for guidance, career advice, and networking opportunities.',
    },
    {
      icon: Github,
      title: 'Project Portfolio',
      description: 'Build and showcase real-world projects with integrated GitHub workflow and collaboration.',
    },
  ];

  const benefits = [
    'Personalized learning paths based on your goals',
    'Real-time AI feedback on your code',
    'Industry mentor matching system',
    'Portfolio building with GitHub integration',
    'Progress tracking and analytics',
    'Community support and networking',
  ];

  const stats = [
    { label: 'Active Learners', value: '2,500+' },
    { label: 'Expert Mentors', value: '150+' },
    { label: 'Projects Built', value: '5,000+' },
    { label: 'Success Rate', value: '85%' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">SSI</span>
              </div>
              <span className="font-semibold text-secondary-900">Second Story Initiative</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
              Your <span className="text-primary-600">Second Story</span> Starts Here
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Empowering career changers to transition into tech with AI-powered learning,
              expert mentorship, and hands-on project experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn btn-primary btn-lg inline-flex items-center"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/learning"
                className="btn btn-outline btn-lg"
              >
                Explore Learning Paths
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-secondary-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and support you need
              for a successful career transition.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="card-content">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">
                Why Choose Second Story Initiative?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-secondary-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="btn btn-primary inline-flex items-center"
                >
                  Join Our Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-soft">
                    <Code className="h-8 w-8 text-primary-600 mb-2" />
                    <div className="text-sm font-medium text-secondary-900">Learn to Code</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-soft">
                    <Bot className="h-8 w-8 text-accent-600 mb-2" />
                    <div className="text-sm font-medium text-secondary-900">AI Mentorship</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-soft">
                    <Users className="h-8 w-8 text-success-600 mb-2" />
                    <div className="text-sm font-medium text-secondary-900">Expert Guidance</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-soft">
                    <Briefcase className="h-8 w-8 text-warning-600 mb-2" />
                    <div className="text-sm font-medium text-secondary-900">Land Your Job</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Second Story?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of career changers who have successfully transitioned into tech.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn bg-white text-primary-600 hover:bg-primary-50 btn-lg inline-flex items-center"
            >
              Get Started Free
              <Target className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/learning"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg"
            >
              View Learning Paths
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SSI</span>
                </div>
                <span className="font-semibold">Second Story Initiative</span>
              </div>
              <p className="text-secondary-400">
                Empowering career transitions through technology education and mentorship.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-secondary-400">
                <li><Link to="/learning" className="hover:text-white">Learning Paths</Link></li>
                <li><Link to="/mentor" className="hover:text-white">AI Mentor</Link></li>
                <li><Link to="/mentorship" className="hover:text-white">Mentorship</Link></li>
                <li><Link to="/projects" className="hover:text-white">Projects</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-secondary-400">
                <li><a href="#" className="hover:text-white">Discord</a></li>
                <li><a href="#" className="hover:text-white">GitHub</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Newsletter</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-secondary-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-800 mt-8 pt-8 text-center text-secondary-400">
            <p>&copy; 2024 Second Story Initiative. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;