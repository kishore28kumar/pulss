'use client';

import { useState } from 'react';
import { FileText, Eye, Save } from 'lucide-react';
import FormattedContent from '@/components/content/FormattedContent';
import FormattedFAQ from '@/components/content/FormattedFAQ';

interface ContentPagesTabProps {
  settings: any;
  onSave: (data: any) => void;
  isSaving: boolean;
  readOnly?: boolean;
}

type PageType = 'shipping' | 'privacy' | 'terms' | 'about' | 'contact' | 'faq';

const DEFAULT_TEMPLATES: Record<PageType, string> = {
  shipping: `# Shipping Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Shipping Methods
We offer multiple shipping options to meet your needs:

• Standard Shipping: 3-5 business days
• Express Shipping: 1-2 business days
• Same-Day Delivery: Available in select areas

# Shipping Rates
Shipping costs are calculated based on:

• Order weight and dimensions
• Delivery location
• Selected shipping method

Free shipping is available on orders over ₹500.

# Delivery Areas
We currently ship to all major cities and towns across India. Delivery times may vary based on your location.

# Order Tracking
Once your order is shipped, you'll receive:

• Tracking number via email and SMS
• Real-time tracking updates
• Estimated delivery date

# Shipping Restrictions
Some items may have shipping restrictions:

• Prescription medications require special handling
• Fragile items may have limited shipping options
• Certain areas may have delivery restrictions`,

  privacy: `# Privacy Policy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Information We Collect
We collect the following types of information:

• Personal information (name, email, phone number, address)
• Payment information (processed securely through our payment partners)
• Order history and preferences
• Device information and browsing behavior
• Cookies and tracking technologies

# How We Use Your Information
We use your information to:

• Process and fulfill your orders
• Communicate with you about your orders and account
• Send you marketing communications (with your consent)
• Improve our website and services
• Prevent fraud and ensure security
• Comply with legal obligations

# Information Sharing
We respect your privacy:

• We do not sell your personal information to third parties
• We may share information with service providers who assist us in operating our business
• We may disclose information if required by law or to protect our rights
• In case of business transfer, your information may be transferred to the new owner

# Your Rights
You have the right to:

• Access your personal information
• Correct inaccurate information
• Request deletion of your information
• Opt-out of marketing communications
• Request data portability
• File a complaint with regulatory authorities

# Security
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.`,

  terms: `# Terms & Conditions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Acceptance of Terms
By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.

# Use License
Permission is granted to temporarily access the materials on our website for personal, non-commercial transitory viewing only.

# Disclaimer
The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties.

# Limitations
In no event shall we or our suppliers be liable for any damages arising out of the use or inability to use the materials on our website.

# Accuracy of Materials
The materials appearing on our website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current.

# Links
We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site.

# Modifications
We may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.`,

  about: `# About Us
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Our Story
Welcome to our store! We are committed to providing you with the best products and exceptional service.

# Our Mission
Our mission is to:

• Provide high-quality products to our customers
• Deliver exceptional customer service
• Build lasting relationships with our community
• Maintain the highest standards of integrity and professionalism

# Our Values
We believe in:

• Customer satisfaction above all
• Quality products and services
• Transparent business practices
• Community engagement and support

# Why Choose Us
What sets us apart:

• Years of experience in the industry
• Dedicated customer support team
• Wide selection of quality products
• Competitive pricing
• Fast and reliable shipping

# Our Team
Our team consists of experienced professionals dedicated to serving you better every day.`,

  contact: `# Contact Us
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Get in Touch
We'd love to hear from you! Reach out to us through any of the contact methods shown above.

# Business Hours
Our customer service team is available:

• Monday to Friday: 9:00 AM - 6:00 PM
• Saturday: 10:00 AM - 4:00 PM
• Sunday: Closed

# Visit Us
We welcome you to visit our physical store during business hours. Our friendly staff will be happy to assist you.

# Customer Support
For any questions, concerns, or feedback, please don't hesitate to contact our customer support team. We're here to help!`,

  faq: `Q: How do I place an order?
A: You can place an order by browsing our products, adding items to your cart, and proceeding to checkout. Make sure you're logged in to your account first.

Q: What payment methods do you accept?
A: We accept Cash on Delivery (COD), Credit, and Online Payment methods including UPI, Net Banking, and Wallet payments.

Q: How long does shipping take?
A: Standard shipping typically takes 3-5 business days. Express shipping options are available at checkout for faster delivery.

Q: Can I track my order?
A: Yes! Once your order is shipped, you'll receive a tracking number via email. You can also track your order in the "Orders" section of your account.

Q: What is your return policy?
A: We offer a 30-day return policy for most items. Products must be unused and in original packaging. Please visit our Returns page for detailed information.

Q: Do you ship internationally?
A: Currently, we only ship within India. We're working on expanding our shipping options to other countries soon.

Q: How can I cancel my order?
A: You can cancel your order within 24 hours of placing it by contacting our customer support team or through your account dashboard.

Q: What if I receive a damaged item?
A: If you receive a damaged item, please contact us immediately with photos of the damage. We'll arrange for a replacement or refund.`
};

const PAGE_NAMES: Record<PageType, string> = {
  shipping: 'Shipping Info',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  about: 'About Us',
  contact: 'Contact',
  faq: 'FAQ'
};

export default function ContentPagesTab({ settings, onSave, isSaving, readOnly = false }: ContentPagesTabProps) {
  const [activePage, setActivePage] = useState<PageType>('shipping');
  const [showPreview, setShowPreview] = useState(false);
  const [pageContent, setPageContent] = useState<Record<PageType, string>>(() => {
    const saved = settings?.pageContent || {};
    return {
      shipping: saved.shipping || DEFAULT_TEMPLATES.shipping,
      privacy: saved.privacy || DEFAULT_TEMPLATES.privacy,
      terms: saved.terms || DEFAULT_TEMPLATES.terms,
      about: saved.about || DEFAULT_TEMPLATES.about,
      contact: saved.contact || DEFAULT_TEMPLATES.contact,
      faq: saved.faq || DEFAULT_TEMPLATES.faq,
    };
  });

  const handleContentChange = (page: PageType, content: string) => {
    setPageContent(prev => ({
      ...prev,
      [page]: content
    }));
  };

  const handleSave = () => {
    onSave({ pageContent });
  };

  const handleReset = (page: PageType) => {
    if (confirm(`Reset ${PAGE_NAMES[page]} to default template?`)) {
      setPageContent(prev => ({
        ...prev,
        [page]: DEFAULT_TEMPLATES[page]
      }));
    }
  };

  const currentContent = pageContent[activePage];
  const isFAQ = activePage === 'faq';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Content Pages</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage content for Shipping, Privacy, Terms, About, Contact, and FAQ pages
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Page Selector and Editor */}
        <div className="space-y-4">
          {/* Page Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Page to Edit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PAGE_NAMES) as PageType[]).map((page) => (
                <button
                  key={page}
                  onClick={() => setActivePage(page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activePage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {PAGE_NAMES[page]}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {PAGE_NAMES[activePage]} Content
              </label>
              {!readOnly && (
                <button
                  onClick={() => handleReset(activePage)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Reset to Default
                </button>
              )}
            </div>
            <textarea
              value={currentContent}
              onChange={(e) => handleContentChange(activePage, e.target.value)}
              disabled={readOnly}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
              placeholder={DEFAULT_TEMPLATES[activePage]}
            />
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Formatting Tips:</p>
              {isFAQ ? (
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Q: Question</code> for questions</li>
                  <li>Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">A: Answer</code> for answers</li>
                  <li>Each Q/A pair will be displayed as an expandable FAQ item</li>
                </ul>
              ) : (
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li><strong>Headers:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded"># Header Text</code></li>
                  <li><strong>Sub-headers:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">## Sub-header</code> or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Label:</code></li>
                  <li><strong>Bullets:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">•</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">-</code>, or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">*</code></li>
                  <li><strong>Separators:</strong> Use separator lines to divide sections</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        {showPreview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preview: {PAGE_NAMES[activePage]}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This is how the content will appear on your storefront
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 max-h-[600px] overflow-y-auto">
              {isFAQ ? (
                <FormattedFAQ text={currentContent} />
              ) : (
                <FormattedContent text={currentContent} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

