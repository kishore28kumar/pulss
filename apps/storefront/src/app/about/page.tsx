'use client';

import Link from 'next/link';
import { 
  Heart, 
  Shield, 
  Truck, 
  Award,
  Users,
  Target,
  Zap,
  Globe,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We put our customers at the heart of everything we do, ensuring satisfaction with every purchase.',
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'Your data and transactions are protected with industry-leading security measures.',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Award,
      title: 'Quality Assured',
      description: 'Every product is carefully selected and vetted to meet our high quality standards.',
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      icon: Globe,
      title: 'Local & Global',
      description: 'Supporting local businesses while providing access to quality products worldwide.',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    }
  ];

  const features = [
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping to get your products when you need them.'
    },
    {
      icon: Users,
      title: '24/7 Support',
      description: 'Our customer service team is always ready to help you.'
    },
    {
      icon: Target,
      title: 'Wide Selection',
      description: 'Thousands of products across multiple categories.'
    },
    {
      icon: Zap,
      title: 'Easy Shopping',
      description: 'Simple and intuitive shopping experience.'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Customers' },
    { value: '5,000+', label: 'Products' },
    { value: '50+', label: 'Local Partners' },
    { value: '99%', label: 'Satisfaction Rate' }
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Company Founded',
      description: 'Started with a vision to revolutionize online shopping experience.'
    },
    {
      year: '2021',
      title: 'Platform Launch',
      description: 'Launched our white-label e-commerce platform for local businesses.'
    },
    {
      year: '2022',
      title: 'Rapid Growth',
      description: 'Expanded to 50+ retail partners and served 5,000+ customers.'
    },
    {
      year: '2023',
      title: 'Going Global',
      description: 'Scaled operations and introduced international shipping options.'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About Pulss Store
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Connecting communities with quality products through innovative technology and trusted local partnerships.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              <span>Get in Touch</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                We're on a mission to empower local businesses and provide customers with a seamless, 
                trustworthy shopping experience. By bridging the gap between traditional retail and 
                modern e-commerce, we help communities thrive while delivering exceptional value.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To become the leading platform connecting local businesses with customers, 
                  creating a sustainable ecosystem where everyone benefits from quality products 
                  and exceptional service.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Purpose</h3>
                <p className="text-gray-600 leading-relaxed">
                  We exist to make quality products accessible to everyone while supporting 
                  local economies. Every purchase on our platform helps sustain small businesses 
                  and strengthens communities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do and shape the experience we deliver to our customers and partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="group">
                  <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 hover:border-transparent">
                    <div className={`w-16 h-16 ${value.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-8 h-8 ${value.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose Pulss?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We combine the best of technology and customer service to provide an unmatched shopping experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From a small startup to a thriving platform serving thousands of customers.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6 group">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-6 group-hover:bg-blue-50 transition-colors duration-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        {milestone.title}
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Shopping?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and discover quality products from trusted retailers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/products"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition w-full sm:w-auto"
            >
              Browse Products
            </Link>
            <Link
              href="/categories"
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition w-full sm:w-auto"
            >
              View Categories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

