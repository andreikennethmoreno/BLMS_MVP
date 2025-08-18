import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: Building,
      title: "Property Management",
      description: "Comprehensive tools for managing your property listings, bookings, and guest communications."
    },
    {
      icon: Users,
      title: "Multi-Role Platform",
      description: "Designed for property managers, unit owners, and guests with role-based access and features."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Built with security in mind, featuring contract management and verified user systems."
    },
    {
      icon: Star,
      title: "Review System",
      description: "Comprehensive review and rating system to build trust and improve service quality."
    }
  ];

  const benefits = [
    "Real-time booking management",
    "Automated contract generation",
    "Integrated concern reporting",
    "Advanced analytics dashboard",
    "Multi-property support",
    "Secure payment tracking"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">HotelPlatform</span>
          </div>
          <Button onClick={onGetStarted} variant="outline">
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            The Complete Hotel
            <span className="text-primary"> Booking Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your property management with our comprehensive platform designed for 
            property managers, unit owners, and guests. Everything you need in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onGetStarted} size="lg" className="text-lg px-8 py-6">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our platform provides all the tools and features you need to manage your 
            properties efficiently and provide exceptional guest experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose Our Platform?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Built specifically for the hospitality industry, our platform combines 
                powerful features with an intuitive interface to help you manage your 
                properties more effectively.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-blue-100 mb-6">
                  Join thousands of property managers and owners who trust our platform 
                  to manage their bookings and grow their business.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                      1
                    </Badge>
                    <span>Create your account</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                      2
                    </Badge>
                    <span>Add your properties</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                      3
                    </Badge>
                    <span>Start accepting bookings</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start Managing Your Properties Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our platform and experience the difference that professional property 
            management tools can make for your business.
          </p>
          <Button onClick={onGetStarted} size="lg" className="text-lg px-12 py-6">
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building className="h-6 w-6" />
              <span className="text-xl font-bold">HotelPlatform</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              © 2024 HotelPlatform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;