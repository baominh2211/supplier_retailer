// Placeholder pages - these would be fully implemented in a complete application

import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { Button, Card, CardBody } from '../components/ui';
import { useAuth } from '../context/AuthContext';

// Home Page
export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-secondary-900">
      {/* Navbar */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
              <Building2 className="w-8 h-8" />
              <span>B2B Market</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/suppliers" className="text-white/80 hover:text-white transition">
                Suppliers
              </Link>
              <Link to="/products" className="text-white/80 hover:text-white transition">
                Products
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to={user?.role === 'SUPPLIER' ? '/supplier/dashboard' : '/shop/dashboard'}>
                  <Button variant="primary" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Connect. Negotiate.{' '}
            <span className="text-primary-400">Grow.</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            The premier B2B marketplace connecting manufacturers and suppliers
            with retail businesses worldwide.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Free Today
              </Button>
            </Link>
            <Link to="/suppliers">
              <Button variant="secondary" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Browse Suppliers
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-24 max-w-3xl mx-auto">
          {[
            { label: 'Verified Suppliers', value: '10,000+' },
            { label: 'Products Listed', value: '1M+' },
            { label: 'Countries', value: '150+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold text-white">{stat.value}</p>
              <p className="text-white/60 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
            Why Choose B2B Market?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Verified Suppliers',
                description: 'All suppliers undergo thorough verification to ensure quality and reliability.',
              },
              {
                title: 'Direct Negotiation',
                description: 'Negotiate prices, quantities, and terms directly with suppliers in real-time.',
              },
              {
                title: 'Secure Transactions',
                description: 'Protected payments and purchase intents for peace of mind.',
              },
            ].map((feature) => (
              <Card key={feature.title}>
                <CardBody>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600">{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2024 B2B Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
