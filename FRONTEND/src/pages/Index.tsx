import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Calendar, 
  Video, 
  ShoppingBag, 
  FileText, 
  Users,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Easy Appointments',
      description: 'Book and manage appointments with top healthcare professionals'
    },
    {
      icon: Video,
      title: 'Video Consultations',
      description: 'Connect with doctors remotely through secure video calls'
    },
    {
      icon: ShoppingBag,
      title: 'Online Pharmacy',
      description: 'Order medications and healthcare products with delivery'
    },
    {
      icon: FileText,
      title: 'Health Records',
      description: 'Access your medical history and prescriptions anytime'
    }
  ];

  const benefits = [
    '24/7 access to healthcare professionals',
    'Secure and encrypted patient data',
    'Quick prescription renewals',
    'Track your health journey',
    'Easy insurance claims'
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                PRANIKOV UPHILL
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="gradient-primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your Health, Our Priority
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience modern healthcare with easy appointment booking, video consultations, 
              and comprehensive health management all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="gradient-primary text-lg px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Better Health
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive healthcare services designed for your convenience
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-xl border bg-card shadow-soft hover:shadow-medium transition-smooth"
              >
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose HealthCare?
              </h2>
              <p className="text-muted-foreground text-lg">
                Join thousands of satisfied patients and healthcare providers
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success mt-1 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Who We Serve
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-xl border bg-card shadow-soft">
              <Users className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Patients</h3>
              <p className="text-muted-foreground mb-4">
                Book appointments, manage prescriptions, and access your health records
              </p>
              <Link to="/register?role=patient">
                <Button variant="outline" className="w-full">Sign Up as Patient</Button>
              </Link>
            </div>
            <div className="text-center p-8 rounded-xl border bg-card shadow-soft">
              <Heart className="h-16 w-16 text-secondary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Doctors</h3>
              <p className="text-muted-foreground mb-4">
                Manage appointments, write prescriptions, and track patient care
              </p>
              <Link to="/register?role=doctor">
                <Button variant="outline" className="w-full">Sign Up as Doctor</Button>
              </Link>
            </div>
            <div className="text-center p-8 rounded-xl border bg-card shadow-soft">
              <FileText className="h-16 w-16 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Admins</h3>
              <p className="text-muted-foreground mb-4">
                Manage platform operations, users, and system analytics
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">Admin Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join our platform today and experience healthcare the modern way
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 PRANIKOV. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
