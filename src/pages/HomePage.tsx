import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Users,
  Github,
  CheckCircle,
  Code,
  Briefcase,
  Target,
  Mail,
  Linkedin,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';

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

const impactStats = [
  {
    id: 'recidivism',
    value: '85%',
    label: 'Reduction in recidivism',
    detail: 'when individuals maintain stable employment',
  },
  {
    id: 'tech-jobs',
    value: '3.5M',
    label: 'Unfilled U.S. tech jobs',
    detail: 'a workforce gap our graduates are positioned to fill',
  },
  {
    id: 'salary',
    value: '$55–75K',
    label: 'Average starting salary',
    detail: 'for graduates entering technology roles',
  },
];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 btn btn-primary"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav
        role="navigation"
        aria-label="Primary navigation"
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-secondary-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="flex items-center space-x-2 no-underline hover:no-underline"
              aria-label="Second Story Initiative — home"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm" aria-hidden="true">SSI</span>
              </div>
              <span className="font-semibold text-secondary-900">Second Story Initiative</span>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Link
                to="/"
                aria-current="page"
                className="px-3 py-2 text-sm text-primary-700 font-semibold rounded-lg bg-primary-50 no-underline hover:no-underline"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 font-medium rounded-lg hover:bg-secondary-50 no-underline hover:no-underline transition-colors"
              >
                About
              </Link>
              <Link
                to="/login"
                className="px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 font-medium rounded-lg hover:bg-secondary-50 no-underline hover:no-underline transition-colors"
              >
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm ml-2">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* Hero Section */}
        <section
          aria-labelledby="hero-heading"
          className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-24 sm:py-32 overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 20%, #7c3aed 0%, transparent 45%)',
            }}
          />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium text-primary-200 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
              </span>
              501(c)(3) Approved · Now Enrolling
            </div>
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight"
            >
              Your <span className="text-primary-300">Second Story</span> Starts Here
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed max-w-none">
              Empowering justice-impacted individuals to build meaningful careers in technology
              through education, mentorship, and community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link
                to="/register"
                className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50 inline-flex items-center shadow-medium no-underline hover:no-underline"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/about"
                className="btn btn-lg border-2 border-white/70 text-white hover:bg-white/10 inline-flex items-center no-underline hover:no-underline"
              >
                Learn About Our Mission
              </Link>
            </div>
          </div>
        </section>

        {/* Impact Stats Banner */}
        <section aria-label="Key impact statistics" className="bg-white border-b border-secondary-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-secondary-100">
              {impactStats.map((stat) => (
                <div key={stat.id} className="py-8 px-6 text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">{stat.value}</div>
                  <div className="text-sm font-semibold text-secondary-900 mb-1">{stat.label}</div>
                  <div className="text-xs text-secondary-500 leading-snug max-w-none">{stat.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section aria-labelledby="features-heading" className="py-20 bg-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-3">
                Our Platform
              </p>
              <h2 id="features-heading" className="text-3xl font-bold text-secondary-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto max-w-none">
                A comprehensive platform providing the tools and support for a successful
                career transition into technology.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="card text-center">
                  <div className="card-content">
                    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-secondary-600 max-w-none">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section aria-labelledby="benefits-heading" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-3">
                  Why Second Story
                </p>
                <h2 id="benefits-heading" className="text-3xl font-bold text-secondary-900 mb-6">
                  Built for Real Career Transitions
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-secondary-700 max-w-none">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link
                    to="/register"
                    className="btn btn-primary inline-flex items-center no-underline hover:no-underline"
                  >
                    Join Our Community
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-soft">
                      <Code className="h-8 w-8 text-primary-600 mb-2" aria-hidden="true" />
                      <div className="text-sm font-medium text-secondary-900">Learn to Code</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-soft">
                      <Bot className="h-8 w-8 text-accent-600 mb-2" aria-hidden="true" />
                      <div className="text-sm font-medium text-secondary-900">AI Mentorship</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-soft">
                      <Users className="h-8 w-8 text-success-600 mb-2" aria-hidden="true" />
                      <div className="text-sm font-medium text-secondary-900">Expert Guidance</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-soft">
                      <Briefcase className="h-8 w-8 text-warning-600 mb-2" aria-hidden="true" />
                      <div className="text-sm font-medium text-secondary-900">Land Your Job</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          aria-labelledby="cta-heading"
          className="py-20 bg-gradient-primary"
        >
          <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-primary-200 uppercase tracking-widest mb-3">
              Get Involved
            </p>
            <h2 id="cta-heading" className="text-3xl font-bold text-white mb-4">
              Ready to Write Your Second Story?
            </h2>
            <p className="text-lg text-primary-100 mb-10 leading-relaxed max-w-none">
              Whether you are a prospective learner, potential mentor, employer partner,
              or supporter — we would love to connect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50 inline-flex items-center shadow-medium no-underline hover:no-underline"
              >
                Create Your Account
                <Target className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
              <a
                href="mailto:eric@straydog-secondstory.org"
                className="btn btn-lg border-2 border-white/70 text-white hover:bg-white/10 inline-flex items-center no-underline hover:no-underline"
                aria-label="Send email to eric@straydog-secondstory.org"
              >
                <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm" aria-hidden="true">SSI</span>
                </div>
                <span className="font-semibold">Second Story Initiative</span>
              </div>
              <p className="text-secondary-400 text-sm max-w-none">
                A 501(c)(3) nonprofit organization empowering career transitions through
                technology education and mentorship.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-secondary-200 uppercase tracking-wide mb-4">
                Platform
              </h3>
              <ul className="space-y-2 text-secondary-400 text-sm" role="list">
                <li>
                  <Link to="/learning" className="hover:text-white no-underline hover:no-underline transition-colors">
                    Learning Paths
                  </Link>
                </li>
                <li>
                  <Link to="/mentor" className="hover:text-white no-underline hover:no-underline transition-colors">
                    AI Mentor
                  </Link>
                </li>
                <li>
                  <Link to="/mentorship" className="hover:text-white no-underline hover:no-underline transition-colors">
                    Mentorship
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="hover:text-white no-underline hover:no-underline transition-colors">
                    Projects
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-secondary-200 uppercase tracking-wide mb-4">
                Organization
              </h3>
              <ul className="space-y-2 text-secondary-400 text-sm" role="list">
                <li>
                  <Link to="/about" className="hover:text-white no-underline hover:no-underline transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:eric@straydog-secondstory.org"
                    className="hover:text-white no-underline hover:no-underline transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/eric-petross/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white no-underline hover:no-underline transition-colors inline-flex items-center gap-1"
                  >
                    LinkedIn
                    <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-secondary-200 uppercase tracking-wide mb-4">
                Legal
              </h3>
              <ul className="space-y-2 text-secondary-400 text-sm" role="list">
                <li>
                  <span className="text-secondary-500">Privacy Policy — coming soon</span>
                </li>
                <li>
                  <span className="text-secondary-500">Terms of Service — coming soon</span>
                </li>
                <li>
                  <span className="text-secondary-500">501(c)(3) Nonprofit</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-800 mt-10 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-secondary-400">
            <p>&copy; {new Date().getFullYear()} Second Story Initiative. All rights reserved.</p>
            <p className="text-secondary-500">
              Registered 501(c)(3) nonprofit &middot; EIN available upon request
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;