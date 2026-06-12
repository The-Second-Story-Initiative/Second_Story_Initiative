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
} from 'lucide-react';

const AboutPage = () => {
  const boardMembers = [
    {
      name: 'Mia E. Smith',
      role: 'Board Chair',
      bio: 'Leading strategic initiatives and organizational governance.',
    },
    {
      name: 'Page Pena',
      role: 'Board Member',
      bio: 'Contributing expertise in program development and community outreach.',
    },
    {
      name: 'Mary-Louise Joseph',
      role: 'Board Member',
      bio: 'Advising on organizational growth and impact measurement.',
    },
  ];

  const transparencyItems = [
    'All metrics publicly reported',
    'Financial statements available upon request',
    'Impact reports published quarterly',
    'Annual 990 filings available on GuideStar',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">SSI</span>
              </div>
              <span className="font-semibold text-secondary-900">Second Story Initiative</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
              >
                Home
              </Link>
              <Link
                to="/login"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
              >
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 leading-tight">
            Building Second Chances Through Code
          </h1>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto leading-relaxed">
            Empowering justice-impacted individuals to build meaningful careers in technology
            through education, mentorship, and opportunity.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-6 w-6 text-primary-600" />
                <h2 className="text-3xl font-bold text-secondary-900">Our Mission</h2>
              </div>
              <p className="text-lg text-secondary-700 leading-relaxed mb-6">
                We believe everyone deserves a second story. By combining technology education
                with personal narrative development, we create pathways to economic mobility
                for individuals who have been impacted by the justice system.
              </p>
              <p className="text-lg text-secondary-700 leading-relaxed">
                Our dual-track approach focuses on both technical skills (the code) and
                professional development (the story), ensuring our graduates are prepared
                for both the technical and human aspects of career transition.
              </p>
            </div>
            <div className="bg-secondary-50 rounded-2xl p-8">
              <div className="flex items-center space-x-2 mb-6">
                <Heart className="h-6 w-6 text-accent-accessible-600" />
                <h3 className="text-xl font-semibold text-secondary-900">Why We Exist</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-secondary-700">
                    <strong>85% reduction</strong> in recidivism when individuals maintain employment
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-secondary-700">
                    <strong>3.5 million</strong> unfilled tech jobs in the US market
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-secondary-700">
                    <strong>$55-75K</strong> average starting salary for program graduates
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Status Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Legal Status */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-primary-600" />
                  <h2 className="text-2xl font-bold text-secondary-900">Legal Status</h2>
                </div>
                <p className="card-description">Official organization information</p>
              </div>
              <div className="card-content space-y-4">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-secondary-900">Organization Founded</p>
                    <p className="text-secondary-600">2024</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-secondary-900">501(c)(3) Status</p>
                    <p className="text-secondary-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        Approved
                      </span>
                      <span className="ml-2">Tax-exempt public charity</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-secondary-900">Tax ID (EIN)</p>
                    <p className="text-secondary-600">Available upon request</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Board Members */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-primary-600" />
                  <h2 className="text-2xl font-bold text-secondary-900">Board of Directors</h2>
                </div>
                <p className="card-description">Guiding organizational strategy and governance</p>
              </div>
              <div className="card-content space-y-4">
                {boardMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-secondary-50 rounded-lg"
                  >
                    <div className="h-12 w-12 rounded-full bg-accent-accessible-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-accessible-700 font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900">{member.name}</p>
                      <p className="text-sm text-accent-accessible-600 font-medium">{member.role}</p>
                      <p className="text-sm text-secondary-600 mt-1">{member.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-primary-600" />
            <h2 className="text-3xl font-bold text-secondary-900">Transparency Commitment</h2>
          </div>
          <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
            We believe in radical transparency and accountability. As a 501(c)(3) organization,
            we are committed to ethical operations and open communication with our community.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {transparencyItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 bg-secondary-50 rounded-lg text-left"
              >
                <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0" />
                <span className="text-secondary-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Partner With Us</h2>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Interested in supporting our mission? We'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:eric@straydog-secondstory.org"
              className="btn bg-white text-primary-600 hover:bg-primary-50 inline-flex items-center"
            >
              <Mail className="mr-2 h-5 w-5" />
              eric@straydog-secondstory.org
            </a>
            <a
              href="https://www.linkedin.com/in/eric-petross/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 inline-flex items-center"
            >
              <Linkedin className="mr-2 h-5 w-5" />
              Connect on LinkedIn
            </a>
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
                A 501(c)(3) nonprofit organization empowering career transitions through
                technology education and mentorship.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-secondary-400">
                <li>
                  <Link to="/learning" className="hover:text-white">
                    Learning Paths
                  </Link>
                </li>
                <li>
                  <Link to="/mentor" className="hover:text-white">
                    AI Mentor
                  </Link>
                </li>
                <li>
                  <Link to="/mentorship" className="hover:text-white">
                    Mentorship
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="hover:text-white">
                    Projects
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Organization</h3>
              <ul className="space-y-2 text-secondary-400">
                <li>
                  <Link to="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Impact Reports
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Financials
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-secondary-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <span className="text-secondary-500">501(c)(3) Nonprofit</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-800 mt-8 pt-8 text-center text-secondary-400">
            <p>&copy; {new Date().getFullYear()} Second Story Initiative. All rights reserved.</p>
            <p className="mt-2 text-sm text-secondary-500">
              A registered 501(c)(3) nonprofit organization. EIN available upon request.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
