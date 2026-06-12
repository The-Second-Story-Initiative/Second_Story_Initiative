import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-secondary-200">404</h1>
          <h2 className="text-3xl font-semibold text-secondary-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-secondary-600 mb-8 max-w-none">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="btn btn-primary btn-lg inline-flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline btn-lg inline-flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}