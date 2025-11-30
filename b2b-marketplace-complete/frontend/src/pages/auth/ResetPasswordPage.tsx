import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Card, CardBody } from '../../components/ui';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600">
            <Building2 className="w-8 h-8" />
            <span>B2B Market</span>
          </Link>
        </div>
        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold mb-4">Page Under Construction</h2>
            <p className="text-secondary-600">This page is being developed.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
