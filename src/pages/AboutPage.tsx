import { Link } from 'react-router-dom';
import {
  Target,
  Heart,
  Users,
  Shield,
  FileText,
  Mail,
  Linkedin,
  Building2,
  Award,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const boardMembers = [
  {
    id: 'mia-e-smith',
    name: 'Mia E. Smith',
    initials: 'MS',
    role: 'Board Chair',
    bio: 'Leading strategic initiatives and organizational governance.',
  },
  {
    id: 'page-pena',
    name: 'Page Pena',
    initials: 'PP',
    role: 'Board Member',
    bio: 'Contributing expertise in program development and community outreach.',
  },
  {
    id: 'mary-louise-joseph',
    name: 'Mary-Louise Joseph',
    initials: 'MJ',
    role: 'Board Member',
    bio: 'Advising on organizational growth and impact measurement.',
  },
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

const transparencyItems = [
  { id: 'metrics', text: 'All program metrics publicly reported' },
  { id: 'financials', text: 'Financial statements available upon request' },
  { id: 'impact', text: 'Impact reports published quarterly once operational' },
  { id: '990', text: 'Annual 990 filings available on GuideStar' },
];

const AboutPage = () => {
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
                className="px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 font-medium rounded-lg hover:bg-secondary-50 no-underline hover:no-underline transition-colors"
              >
                Home
              </Link>
              <Link
                to="/about"
                aria-current="page"
                className="px-3 py-2 text-sm text-primary-700 font-semibold rounded-lg bg-primary-50 no-underline hover:no-underline"
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
              501(c)(3) Approved · Founded 2024
            </div>
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight"
            >
              Building Second Chances
              <span className="block text-primary-300">Through Code</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed max-w-none">
              Empowering justice-impacted individuals to build meaningful careers in technology
              through education, mentorship, and community.
            </p>
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

        {/* Mission Section */}
        <section aria-labelledby="mission-heading" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-3">
                  Our Mission
                </p>
                <h2
                  id="mission-heading"
                  className="text-3xl font-bold text-secondary-900 mb-6"
                >
                  We believe everyone deserves a second story
                </h2>
                <p className="text-lg text-secondary-700 leading-relaxed mb-5 max-w-none">
                  By combining technology education with personal narrative development, we create
                  pathways to economic mobility for individuals who have been impacted by the
                  justice system.
                </p>
                <p className="text-lg text-secondary-700 leading-relaxed max-w-none">
                  Our dual-track approach builds both technical skills — the code — and
                  professional identity — the story — so graduates are prepared for every
                  dimension of a career transition.
                </p>
              </div>

              <div className="bg-secondary-50 rounded-2xl p-8 border border-secondary-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">Why We Exist</h3>
                </div>
                <ul className="space-y-5" role="list">
                  {impactStats.map((stat) => (
                    <li key={stat.id} className="flex items-start gap-3">
                      <TrendingUp
                        className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="text-secondary-700 text-sm leading-relaxed max-w-none">
                        <strong className="text-secondary-900">{stat.value} {stat.label}</strong>
                        {' '}— {stat.detail}.
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Org Info Section */}
        <section aria-labelledby="org-heading" className="py-20 bg-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-3">
                Organization
              </p>
              <h2
                id="org-heading"
                className="text-3xl font-bold text-secondary-900"
              >
                Transparency &amp; Governance
              </h2>
              <p className="mt-4 text-lg text-secondary-600 max-w-2xl mx-auto max-w-none">
                Accountability is core to our mission. Here is everything you need to know
                about Second Story as an organization.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Legal Status */}
              <div className="card flex flex-col">
                <div className="card-header pb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                    <Shield className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">Legal Status</h3>
                  <p className="card-description">Official organization information</p>
                </div>
                <div className="card-content flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-secondary-400 flex-shrink-0 mt-1" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-0.5">
                        Founded
                      </p>
                      <p className="text-sm font-medium text-secondary-900">2024</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-4 w-4 text-success-600 flex-shrink-0 mt-1" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-0.5">
                        501(c)(3) Status
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-success">Approved</span>
                        <span className="text-sm text-secondary-600">Tax-exempt public charity</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-secondary-400 flex-shrink-0 mt-1" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-0.5">
                        Tax ID (EIN)
                      </p>
                      <p className="text-sm text-secondary-600">Available upon request</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Board of Directors */}
              <div className="card flex flex-col">
                <div className="card-header pb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                    <Users className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">Board of Directors</h3>
                  <p className="card-description">Guiding organizational strategy and governance</p>
                </div>
                <div className="card-content flex-1 space-y-3">
                  {boardMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 border border-secondary-100"
                    >
                      <div
                        className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
                        aria-hidden="true"
                      >
                        <span className="text-primary-700 font-semibold text-xs">
                          {member.initials}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-secondary-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-primary-600 font-medium">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transparency Commitment */}
              <div className="card flex flex-col">
                <div className="card-header pb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                    <Target className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Transparency Commitment
                  </h3>
                  <p className="card-description">
                    Radical transparency and accountability in all operations
                  </p>
                </div>
                <div className="card-content flex-1">
                  <ul className="space-y-3" role="list">
                    {transparencyItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <CheckCircle
                          className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span className="text-sm text-secondary-700 leading-snug max-w-none">
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact / CTA Section */}
        <section
          aria-labelledby="contact-heading"
          className="py-20 bg-gradient-primary"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-primary-200 uppercase tracking-widest mb-3">
              Get Involved
            </p>
            <h2
              id="contact-heading"
              className="text-3xl font-bold text-white mb-4"
            >
              Partner With Us
            </h2>
            <p className="text-lg text-primary-100 mb-10 leading-relaxed max-w-none">
              Whether you are an employer, donor, volunteer, or prospective participant,
              we would love to connect and explore how we can build this mission together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:eric@straydog-secondstory.org"
                className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50 inline-flex items-center shadow-medium no-underline hover:no-underline"
                aria-label="Send email to eric@straydog-secondstory.org"
              >
                <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
                Send Us an Email
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/in/eric-petross/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg border-2 border-white/70 text-white hover:bg-white/10 inline-flex items-center no-underline hover:no-underline"
                aria-label="Connect with Eric Petross on LinkedIn (opens in new tab)"
              >
                <Linkedin className="mr-2 h-5 w-5" aria-hidden="true" />
                Connect on LinkedIn
                <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" aria-hidden="true" />
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
                  <Link
                    to="/about"
                    aria-current="page"
                    className="text-white font-medium no-underline hover:no-underline"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white no-underline hover:no-underline transition-colors">
                    Impact Reports
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white no-underline hover:no-underline transition-colors">
                    Financials
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white no-underline hover:no-underline transition-colors">
                    Careers
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
                  <a href="#" className="hover:text-white no-underline hover:no-underline transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white no-underline hover:no-underline transition-colors">
                    Terms of Service
                  </a>
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

export default AboutPage;
