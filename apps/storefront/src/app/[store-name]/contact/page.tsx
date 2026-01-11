'use client';

// import { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  // Send,
  MessageCircle,
  Headphones,
  Building,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
// import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTenant } from '@/contexts/TenantContext';

function ContactPageContent() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  /* Commented out as variables are unused due to form being commented out
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  */

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: tenant?.phone ? [tenant.phone] : ['Contact support for phone'],
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Mail,
      title: 'Email',
      details: tenant?.email ? [tenant.email] : ['support@pulss.com'],
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: MapPin,
      title: 'Office',
      details: tenant?.address
        ? [tenant.address, `${tenant.city || ''}${tenant.state ? `, ${tenant.state}` : ''} ${tenant.pincode || ''}`.trim()]
        : ['Online Store'],
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Mon - Fri: 9:00 AM - 6:00 PM', 'Sat - Sun: 10:00 AM - 4:00 PM'],
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  /* Commented out as team is unused
  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Customer Support Manager',
      email: tenant?.email || 'sarah.johnson@pulss.com',
      image: '👩‍💼'
    },
    {
      name: 'Michael Chen',
      role: 'Technical Support Lead',
      email: tenant?.email || 'michael.chen@pulss.com',
      image: '👨‍💻'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Sales Director',
      email: tenant?.email || 'emily.rodriguez@pulss.com',
      image: '👩‍💼'
    },
    {
      name: 'David Kim',
      role: 'Partnership Manager',
      email: tenant?.email || 'david.kim@pulss.com',
      image: '👨‍💼'
    }
  ];
  */

  const faqs = [
    {
      question: 'How can I track my order?',
      answer: 'You can track your order by logging into your account and visiting the "Orders" section. You\'ll receive tracking updates via email as well.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items. Products must be unused and in original packaging. Contact our support team to initiate a return.'
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. Check our shipping page for more details.'
    },
    {
      question: 'How do I become a partner?',
      answer: 'We\'re always looking for quality retailers to join our platform. Contact David Kim, our Partnership Manager, to discuss collaboration opportunities.'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Have questions? We'd love to hear from you. Our team is here to help!
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Live Chat Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <Headphones className="w-5 h-5" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                  <div className={`w-14 h-14 ${info.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-7 h-7 ${info.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {info.title}
                  </h3>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm mb-1">
                      {detail}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form + Map Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Contact Form - Commented out as requested
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Send us a Message
                </h2>
                <p className="text-gray-600">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., John Smith"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g., john.smith@example.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Customer Support</option>
                    <option value="order">Order Issue</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us how we can help you..."
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
            */}

            {/* Map / Additional Info */}
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Visit Our Office
                </h2>
                <p className="text-gray-600">
                  Stop by our office during business hours or schedule an appointment.
                </p>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl h-64 mb-6 flex items-center justify-center relative overflow-hidden max-w-2xl mx-auto">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>
                <div className="text-center z-10">
                  <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold">{tenant?.address || 'Online Only'}</p>
                  <p className="text-gray-600">{tenant?.city ? `${tenant.city}${tenant.state ? `, ${tenant.state}` : ''}` : ''}</p>
                </div>
              </div>

              {/* Quick Contact Cards */}
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Quick Response</h4>
                      <p className="text-sm text-gray-600">
                        We typically respond to inquiries within 2-4 hours during business hours.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start space-x-3">
                    <Building className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Enterprise Solutions</h4>
                      <p className="text-sm text-gray-600">
                        Need custom solutions? Contact our enterprise team for tailored packages.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Emergency Support</h4>
                      <p className="text-sm text-gray-600">
                        For urgent issues, call our {tenant?.phone ? <span>hotline: <a href={`tel:${tenant.phone}`} className="font-bold hover:underline">{tenant.phone}</a></span> : '24/7 support line.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Commented out as requested
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our dedicated team is here to ensure you have the best experience possible.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 text-center group">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {member.image}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-sm text-blue-600 font-semibold mb-3">
                  {member.role}
                </p>
                <a
                  href={`mailto:${member.email}`}
                  className="text-sm text-gray-600 hover:text-blue-600 transition break-all"
                >
                  {member.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600">
                Find quick answers to common questions
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-300">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start">
                    <span className="text-blue-600 mr-2">Q:</span>
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 ml-6">
                    <span className="text-green-600 font-semibold mr-2">A:</span>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Our support team is standing by to help you with any inquiries.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {tenant?.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition w-full sm:w-auto text-center"
              >
                Call Us Now
              </a>
            )}
            <a
              href={`mailto:${tenant?.email || 'support@pulss.com'}`}
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition w-full sm:w-auto text-center"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ContactPage() {
  return (
    <ProtectedRoute>
      <ContactPageContent />
    </ProtectedRoute>
  );
}
