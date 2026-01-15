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
  Loader2,
  ShieldCheck
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

      {/* Pharmacist Details Section */}
      {(tenant?.pharmacistName || tenant?.pharmacistRegNumber || tenant?.pharmacistPhoto) && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Our Licensed Pharmacist
                </h2>
                <p className="text-gray-600">
                  Meet our qualified pharmacist ready to assist you with your healthcare needs.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Pharmacist Photo */}
                  <div className="flex-shrink-0">
                    {tenant?.pharmacistPhoto ? (
                      <img
                        src={tenant.pharmacistPhoto}
                        alt={tenant.pharmacistName || 'Pharmacist'}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Crect fill="%23e5e7eb" width="128" height="128" rx="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="48" font-weight="600"%3E👨‍⚕️%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 border-4 border-white flex items-center justify-center shadow-xl">
                        <span className="text-5xl">👨‍⚕️</span>
                      </div>
                    )}
                  </div>

                  {/* Pharmacist Info */}
                  <div className="flex-1 text-center md:text-left">
                    {tenant?.pharmacistName && (
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {tenant.pharmacistName}
                      </h3>
                    )}

                    {tenant?.pharmacistRegNumber && (
                      <div className="mb-4">
                        <p className="text-gray-700">
                          <span className="font-semibold">Registration Number:</span>{' '}
                          <span className="text-gray-900">{tenant.pharmacistRegNumber}</span>
                        </p>
                      </div>
                    )}

                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white shadow-md">
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      <span className="text-sm font-semibold">Licensed & Certified Pharmacist</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
