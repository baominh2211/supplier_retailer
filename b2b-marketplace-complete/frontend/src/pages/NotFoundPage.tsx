import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-200">404</h1>
        <h2 className="text-2xl font-semibold text-secondary-900 mt-4 mb-2">
          Page Not Found
        </h2>
        <p className="text-secondary-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/">
            <Button leftIcon={<Home className="w-4 h-4" />}>
              Go Home
            </Button>
          </Link>
          <Button variant="secondary" onClick={() => window.history.back()} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
