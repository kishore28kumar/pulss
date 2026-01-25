'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, UserPlus, Eye, EyeOff, RefreshCw, Store, Copy, ShieldCheck, RotateCcw, Image as ImageIcon, Upload, X, FileText, RotateCcw as ResetIcon } from 'lucide-react';
import FormattedContent from '@/components/content/FormattedContent';
import FormattedFAQ from '@/components/content/FormattedFAQ';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { getUserRole } from '@/lib/permissions';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  // Store fields - only required when SUPER_ADMIN creates Admin
  storeName: z.string().min(2, 'Store name must be at least 2 characters').optional(),
  storeRoute: z.string()
    .min(2, 'Store route must be at least 2 characters')
    .max(15, 'Store route must be at most 15 characters')
    .regex(/^[a-z0-9-]+$/, 'Store route must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  // Address fields - only required when SUPER_ADMIN creates Admin
  address: z.string().min(5, 'Address must be at least 5 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').optional(),
  state: z.string().min(2, 'State must be at least 2 characters').optional(),
  country: z.string().default('India'),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters').max(6, 'Pincode must be 6 characters').optional(),
  // Regulatory fields
  gstNumber: z.string().min(1, 'GST number is required').optional(),
  drugLicNumber: z.string().min(1, 'Drug License number is required').optional(),
  pharmacistName: z.string().min(1, 'Pharmacist Name is required').optional(),
  pharmacistRegNumber: z.string().min(1, 'Pharmacist Registration number is required').optional(),
  scheduleDrugEligible: z.boolean().default(false).optional(),
  returnPolicy: z.string().optional(),
  shippingContent: z.string().optional(),
  privacyContent: z.string().optional(),
  termsContent: z.string().optional(),
  aboutContent: z.string().optional(),
  contactContent: z.string().optional(),
  faqContent: z.string().optional(),
  heroImages: z.array(z.string().url('Must be a valid URL')).max(10, 'Maximum 10 hero images allowed').optional(),
  isPrimaryContactWhatsApp: z.boolean().default(false).optional(),
  primaryContactWhatsApp: z.string().optional().or(z.literal('')),
  shopFrontPhoto: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  ownerPhoto: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  upiId: z.string()
    .min(1, 'UPI ID is required')
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/, 'UPI ID must be an alphanumeric string with an "@" symbol (e.g., username@bankname)')
    .optional()
    .or(z.literal('')),
  upiScannerPhoto: z.string().url('Must be a valid URL').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  // Only validate WhatsApp number if checkbox is unchecked and field has a value
  if (!data.isPrimaryContactWhatsApp && data.primaryContactWhatsApp && data.primaryContactWhatsApp.trim() !== '') {
    const trimmed = data.primaryContactWhatsApp.trim().replace(/\D/g, '');
    if (trimmed.length !== 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primaryContactWhatsApp'],
        message: 'WhatsApp number must be exactly 10 digits',
      });
    }
  }
});

type InviteFormData = z.infer<typeof inviteSchema>;

// Default Return Policy Template (Markdown-style)
const DEFAULT_RETURN_POLICY = `# Return Policy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 30-Day Return Window
You have 30 days from the date of delivery to initiate a return.

# Original Condition Required
Items must be unused, unwashed, and in original packaging with tags attached.

# Free Return Shipping
We provide free return shipping labels for eligible returns.

# Quick Refund Processing
Refunds are processed within 5-7 business days after we receive your return.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Non-Returnable Items
• Perishable goods (food, beverages, etc.)
• Personalized or custom-made items
• Items damaged by misuse or normal wear
• Items without original packaging or tags
• Gift cards and digital products

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Refund Information

## Refund Method:
Refunds will be issued to the original payment method used for the purchase. Processing time may vary by payment method.

## Refund Timeline:
Once we receive your return, we'll inspect it and process your refund within 5-7 business days. You'll receive an email confirmation when the refund is processed.

## Partial Refunds:
If you're returning only part of your order, you'll receive a partial refund for the returned items. Shipping costs are non-refundable unless the return is due to our error.`;

// Default Content Page Templates
const DEFAULT_SHIPPING_CONTENT = `# Shipping Information
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
• Certain areas may have delivery restrictions`;

const DEFAULT_PRIVACY_CONTENT = `# Privacy Policy
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
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.`;

const DEFAULT_TERMS_CONTENT = `# Terms & Conditions
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
We may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.`;

const DEFAULT_ABOUT_CONTENT = `# About Us
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
Our team consists of experienced professionals dedicated to serving you better every day.`;

const DEFAULT_CONTACT_CONTENT = `# Contact Us
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
For any questions, concerns, or feedback, please don't hesitate to contact our customer support team. We're here to help!`;

const DEFAULT_FAQ_CONTENT = `Q: How do I place an order?
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
A: If you receive a damaged item, please contact us immediately with photos of the damage. We'll arrange for a replacement or refund.`;

// Generate a strong random password
const generateStrongPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one character from each required set
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly (minimum 12 characters total)
  const remainingLength = Math.max(8, 12 - password.length);
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Generate a single strong password
const generatePassword = (): string => {
  return generateStrongPassword();
};

export default function NewStaffPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [storefrontUrl, setStorefrontUrl] = useState<string>('');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroImageKeywords, setHeroImageKeywords] = useState<string[]>([]);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [showHeroImageModal, setShowHeroImageModal] = useState(false);
  const [heroImageUrlInput, setHeroImageUrlInput] = useState('');
  const [heroImageKeywordInput, setHeroImageKeywordInput] = useState('');
  const heroImageFileInputRef = useRef<HTMLInputElement>(null);
  const [shopFrontPhoto, setShopFrontPhoto] = useState<string>('');
  const [ownerPhoto, setOwnerPhoto] = useState<string>('');
  const [uploadingShopFrontPhoto, setUploadingShopFrontPhoto] = useState(false);
  const [uploadingOwnerPhoto, setUploadingOwnerPhoto] = useState(false);
  const shopFrontPhotoInputRef = useRef<HTMLInputElement>(null);
  const ownerPhotoInputRef = useRef<HTMLInputElement>(null);
  const [upiId, setUpiId] = useState<string>('');
  const [upiScannerPhoto, setUpiScannerPhoto] = useState<string>('');
  const [uploadingUpiScannerPhoto, setUploadingUpiScannerPhoto] = useState(false);
  const upiScannerPhotoInputRef = useRef<HTMLInputElement>(null);
  const [activeContentTab, setActiveContentTab] = useState<'return' | 'shipping' | 'privacy' | 'terms' | 'about' | 'contact' | 'faq'>('return');
  const [showContentPreview, setShowContentPreview] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    clearErrors,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      storeName: '',
      storeRoute: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      gstNumber: '',
      drugLicNumber: '',
      pharmacistName: '',
      pharmacistRegNumber: '',
      scheduleDrugEligible: false,
      returnPolicy: DEFAULT_RETURN_POLICY,
      shippingContent: DEFAULT_SHIPPING_CONTENT,
      privacyContent: DEFAULT_PRIVACY_CONTENT,
      termsContent: DEFAULT_TERMS_CONTENT,
      aboutContent: DEFAULT_ABOUT_CONTENT,
      contactContent: DEFAULT_CONTACT_CONTENT,
      faqContent: DEFAULT_FAQ_CONTENT,
      heroImages: [],
      isPrimaryContactWhatsApp: false,
      primaryContactWhatsApp: '',
      shopFrontPhoto: '',
      ownerPhoto: '',
      upiId: '',
      upiScannerPhoto: '',
    },
  });

  // Reset form on mount to ensure it starts empty
  useEffect(() => {
    reset({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      storeName: '',
      storeRoute: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      gstNumber: '',
      drugLicNumber: '',
      pharmacistName: '',
      pharmacistRegNumber: '',
      scheduleDrugEligible: false,
      returnPolicy: DEFAULT_RETURN_POLICY,
      shippingContent: DEFAULT_SHIPPING_CONTENT,
      privacyContent: DEFAULT_PRIVACY_CONTENT,
      termsContent: DEFAULT_TERMS_CONTENT,
      aboutContent: DEFAULT_ABOUT_CONTENT,
      contactContent: DEFAULT_CONTACT_CONTENT,
      faqContent: DEFAULT_FAQ_CONTENT,
      heroImages: [],
      isPrimaryContactWhatsApp: false,
      primaryContactWhatsApp: '',
      shopFrontPhoto: '',
      ownerPhoto: '',
      upiId: '',
      upiScannerPhoto: '',
    });
    setHeroImages([]);
    setUpiId('');
    setUpiScannerPhoto('');
    setShopFrontPhoto('');
    setOwnerPhoto('');
  }, [reset]);

  // Watch storeRoute to update storefront URL preview
  const storeRoute = watch('storeRoute');
  const isCreatingAdmin = mounted && userRole === 'SUPER_ADMIN';

  useEffect(() => {
    if (isCreatingAdmin && storeRoute) {
      // Construct storefront URL using config
      const { getStorefrontUrl } = require('@/lib/config/urls');
      const storefrontBase = typeof window !== 'undefined'
        ? getStorefrontUrl()
        : (process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000');
      setStorefrontUrl(`${storefrontBase}/${storeRoute}`);
    } else {
      setStorefrontUrl('');
    }
  }, [storeRoute, isCreatingAdmin]);

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setValue('password', password);
    toast.success('Password generated');
  };

  // Hero Image Upload Handler
  const handleHeroImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG or PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (heroImages.length >= 10) {
      toast.error('Maximum 10 hero images allowed');
      return;
    }

    setUploadingHeroImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.data.url;
      const updatedImages = [...heroImages, uploadedUrl];
      const updatedKeywords = [...heroImageKeywords, '']; // Add empty keyword for uploaded image
      setHeroImages(updatedImages);
      setHeroImageKeywords(updatedKeywords);
      setValue('heroImages', updatedImages);
      toast.success('Hero image uploaded successfully');

      if (heroImageFileInputRef.current) {
        heroImageFileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload hero image');
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleHeroImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleHeroImageUpload(file);
    }
  };

  const handleAddHeroImageUrl = () => {
    setHeroImageUrlInput('');
    setHeroImageKeywordInput('');
    setShowHeroImageModal(true);
  };

  const handleSubmitHeroImage = () => {
    const url = heroImageUrlInput.trim();
    const keyword = heroImageKeywordInput.trim();

    if (!url) {
      toast.error('Please enter an image URL');
      return;
    }

    try {
      new URL(url); // Validate URL
      if (heroImages.length >= 10) {
        toast.error('Maximum 10 hero images allowed');
        return;
      }
      const updatedImages = [...heroImages, url];
      const updatedKeywords = [...heroImageKeywords, keyword || ''];
      setHeroImages(updatedImages);
      setHeroImageKeywords(updatedKeywords);
      setValue('heroImages', updatedImages);
      setShowHeroImageModal(false);
      setHeroImageUrlInput('');
      setHeroImageKeywordInput('');
      toast.success('Hero image added successfully');
    } catch {
      toast.error('Invalid URL');
    }
  };

  const handleCancelHeroImageModal = () => {
    setShowHeroImageModal(false);
    setHeroImageUrlInput('');
    setHeroImageKeywordInput('');
  };

  const handleRemoveHeroImage = (index: number) => {
    const updatedImages = heroImages.filter((_, i) => i !== index);
    const updatedKeywords = heroImageKeywords.filter((_, i) => i !== index);
    setHeroImages(updatedImages);
    setHeroImageKeywords(updatedKeywords);
    setValue('heroImages', updatedImages);
    toast.success('Hero image removed');
  };

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const payload: any = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        password: data.password,
      };

      // If creating Admin (SUPER_ADMIN), include store info
      if (isCreatingAdmin) {
        if (!data.storeName || !data.storeRoute) {
          throw new Error('Store name and store route are required when creating an Admin');
        }
        if (!data.address || !data.city || !data.state || !data.pincode) {
          throw new Error('All address fields are required when creating an Admin');
        }
        payload.storeName = data.storeName;
        payload.storeRoute = data.storeRoute;
        // Include address fields
        payload.address = data.address;
        payload.city = data.city;
        payload.state = data.state;
        payload.country = data.country || 'India';
        payload.pincode = data.pincode;

        // Include regulatory fields
        if (!data.gstNumber || !data.drugLicNumber || !data.pharmacistName || !data.pharmacistRegNumber) {
          throw new Error('All regulatory details are required when creating an Admin');
        }
        payload.gstNumber = data.gstNumber;
        payload.drugLicNumber = data.drugLicNumber;
        payload.pharmacistName = data.pharmacistName;
        payload.pharmacistRegNumber = data.pharmacistRegNumber;
        payload.scheduleDrugEligible = data.scheduleDrugEligible ?? false;
        payload.returnPolicy = data.returnPolicy || DEFAULT_RETURN_POLICY;
        // Add pageContent for content pages
        payload.pageContent = {
          shipping: data.shippingContent || DEFAULT_SHIPPING_CONTENT,
          privacy: data.privacyContent || DEFAULT_PRIVACY_CONTENT,
          terms: data.termsContent || DEFAULT_TERMS_CONTENT,
          about: data.aboutContent || DEFAULT_ABOUT_CONTENT,
          contact: data.contactContent || DEFAULT_CONTACT_CONTENT,
          faq: data.faqContent || DEFAULT_FAQ_CONTENT,
        };
        payload.heroImages = heroImages.length > 0 ? heroImages : [];
        payload.heroImageKeywords = heroImageKeywords.length > 0 ? heroImageKeywords : [];
        payload.isPrimaryContactWhatsApp = data.isPrimaryContactWhatsApp ?? false;
        payload.primaryContactWhatsApp = data.isPrimaryContactWhatsApp ? data.phone : (data.primaryContactWhatsApp || undefined);
        payload.shopFrontPhoto = shopFrontPhoto || undefined;
        payload.ownerPhoto = ownerPhoto || undefined;
        payload.upiId = upiId || undefined;
        payload.upiScannerPhoto = upiScannerPhoto || undefined;
      }

      return await api.post('/staff/invite', payload);
    },
    onSuccess: (_response, variables) => {
      const roleLabel = userRole === 'SUPER_ADMIN' ? 'Admin' : 'Staff';
      toast.success(`${roleLabel} user created successfully`);

      // If store route was provided, copy URL to clipboard
      if (isCreatingAdmin && variables.storeRoute) {
        const { getStorefrontUrl } = require('@/lib/config/urls');
        const storefrontBase = typeof window !== 'undefined'
          ? getStorefrontUrl()
          : (process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000');
        const url = `${storefrontBase}/${variables.storeRoute}`;
        if (typeof window !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(url);
          toast.success('Storefront URL copied to clipboard!');
        }
      }

      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });

      // Navigate back to staff page
      router.push('/dashboard/staff');
    },
    onError: (error: any) => {
      const errorMessage = 'Failed to create user';
      const errorMessages: string[] = [];

      if (error.response) {
        // API returned an error response
        const responseData = error.response.data;
        
        // Check for error message in different possible formats
        if (responseData?.error) {
          // Single error message
          if (typeof responseData.error === 'string') {
            errorMessages.push(responseData.error);
          } else if (Array.isArray(responseData.error)) {
            // Array of error messages
            errorMessages.push(...responseData.error);
          } else if (typeof responseData.error === 'object') {
            // Object with field errors
            Object.entries(responseData.error).forEach(([field, msg]: [string, any]) => {
              const fieldName = field
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              errorMessages.push(`${fieldName}: ${msg}`);
            });
          }
        } else if (responseData?.message) {
          errorMessages.push(responseData.message);
        } else if (responseData?.errors) {
          // Handle validation errors (array or object)
          if (Array.isArray(responseData.errors)) {
            errorMessages.push(...responseData.errors);
          } else if (typeof responseData.errors === 'object') {
            Object.entries(responseData.errors).forEach(([field, msg]: [string, any]) => {
              const fieldName = field
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              if (Array.isArray(msg)) {
                msg.forEach((m: string) => errorMessages.push(`${fieldName}: ${m}`));
              } else {
                errorMessages.push(`${fieldName}: ${msg}`);
              }
            });
          }
        } else if (typeof responseData === 'string') {
          errorMessages.push(responseData);
        }
      } else if (error.message) {
        // Network error or other error
        if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
          errorMessages.push('Network error: Unable to connect to server. Please check your internet connection.');
        } else {
          errorMessages.push(error.message);
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessages.push('Network error: No response from server. Please check your connection.');
      }

      // Show error toast with all messages
      if (errorMessages.length > 0) {
        if (errorMessages.length === 1) {
          toast.error(errorMessages[0]);
        } else {
          // Format multiple errors with bullet points
          toast.error(
            <div className="space-y-1">
              <div className="font-semibold">The following errors occurred:</div>
              <ul className="list-disc list-inside space-y-0.5 text-sm">
                {errorMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>,
            {
              duration: 5000,
            }
          );
        }
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const onSubmit = (data: InviteFormData) => {
    mutation.mutate(data);
  };

  const onValidationError = (errors: any) => {
    // Extract all validation errors
    const errorMessages: string[] = [];
    
    Object.entries(errors).forEach(([field, error]: [string, any]) => {
      if (error?.message) {
        // Format field name (e.g., "firstName" -> "First Name")
        const fieldName = field
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        errorMessages.push(`${fieldName}: ${error.message}`);
      }
    });

    if (errorMessages.length > 0) {
      toast.error(
        <div className="space-y-1">
          <div className="font-semibold">Please fix the following errors:</div>
          <ul className="list-disc list-inside space-y-0.5 text-sm">
            {errorMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>,
        {
          duration: 5000,
        }
      );
    }
  };

  const roleLabel = mounted && userRole === 'SUPER_ADMIN' ? 'Tenant' : 'Staff';
  const title = mounted && userRole === 'SUPER_ADMIN' ? 'Create Tenant Admin' : 'Add Staff Member';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-500 font-medium">
              Add a new {roleLabel.toLowerCase()} member to your team
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          {isCreatingAdmin && (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Contact Number *
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone', { required: isCreatingAdmin })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="1234567890"
                maxLength={10}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
              )}
              
              {/* WhatsApp Checkbox */}
              <div className="mt-3 flex items-center">
                <input
                  id="isPrimaryContactWhatsApp"
                  type="checkbox"
                  {...register('isPrimaryContactWhatsApp')}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
                <label htmlFor="isPrimaryContactWhatsApp" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Is this a WhatsApp number?
                </label>
              </div>
              
              {/* WhatsApp Number Input (shown if checkbox unchecked) */}
              {!watch('isPrimaryContactWhatsApp') && (
                <div className="mt-3">
                  <label htmlFor="primaryContactWhatsApp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    WhatsApp Number *
                  </label>
                  <input
                    id="primaryContactWhatsApp"
                    type="tel"
                    {...register('primaryContactWhatsApp', { 
                      required: isCreatingAdmin && !watch('isPrimaryContactWhatsApp') ? 'WhatsApp number is required' : false,
                      validate: (value) => {
                        // Only validate if checkbox is unchecked and field has value
                        if (!watch('isPrimaryContactWhatsApp')) {
                          if (!value || value.trim() === '') {
                            // Required check will handle empty case
                            return true;
                          }
                          const trimmed = value.trim().replace(/\D/g, '');
                          if (trimmed.length !== 10) {
                            return 'WhatsApp number must be exactly 10 digits';
                          }
                        }
                        return true;
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="1234567890"
                    maxLength={10}
                    onChange={(e) => {
                      // Remove any non-digit characters and limit to 10 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      e.target.value = value;
                      // Trigger react-hook-form onChange
                      register('primaryContactWhatsApp').onChange(e);
                    }}
                  />
                  {errors.primaryContactWhatsApp && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.primaryContactWhatsApp.message}</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Phone (for non-admin creation) */}
          {!isCreatingAdmin && (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
              )}
            </div>
          )}

          {/* Store Name & Store Route - Only for SUPER_ADMIN creating Admin */}
          {isCreatingAdmin && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Store Information
                </h3>
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name *
                </label>
                <input
                  id="storeName"
                  type="text"
                  {...register('storeName', { required: isCreatingAdmin })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="City Pharmacy"
                />
                {errors.storeName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.storeName.message}</p>
                )}
              </div>

              {/* Store Route */}
              <div>
                <label htmlFor="storeRoute" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Route (URL Slug) *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {typeof window !== 'undefined'
                      ? window.location.origin.replace(':3001', ':3000')
                      : 'http://localhost:3000'}
                    /
                  </span>
                  <input
                    id="storeRoute"
                    type="text"
                    {...register('storeRoute', { required: isCreatingAdmin })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent lowercase bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="city-pharmacy"
                    maxLength={15}
                    onChange={(e) => {
                      // Auto-lowercase and replace spaces with hyphens
                      // Limit to 15 characters
                      let value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      if (value.length > 15) {
                        value = value.substring(0, 15);
                      }
                      setValue('storeRoute', value);
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be used in the storefront URL. Only lowercase letters, numbers, and hyphens allowed. Maximum 15 characters.
                </p>
                {errors.storeRoute && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.storeRoute.message}</p>
                )}

                {/* Storefront URL Preview */}
                {storeRoute && storefrontUrl && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-2">Storefront URL:</p>
                    <div className="flex items-center space-x-2">
                      <a
                        href={storefrontUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 underline truncate"
                      >
                        {storefrontUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(storefrontUrl);
                            toast.success('URL copied to clipboard!');
                          }
                        }}
                        className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Address Fields */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Store Address</h3>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address *
                </label>
                <input
                  id="address"
                  type="text"
                  {...register('address', { required: isCreatingAdmin })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="123 Main Street, Suite 100"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.message}</p>
                )}
              </div>

              {/* City and State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    id="city"
                    type="text"
                    {...register('city', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Mumbai"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State *
                  </label>
                  <input
                    id="state"
                    type="text"
                    {...register('state', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Maharashtra"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state.message}</p>
                  )}
                </div>
              </div>

              {/* Country and Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country *
                  </label>
                  <input
                    id="country"
                    type="text"
                    {...register('country')}
                    value="India"
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pincode *
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    {...register('pincode', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="400001"
                    maxLength={6}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      setValue('pincode', value);
                    }}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pincode.message}</p>
                  )}
                </div>
              </div>

              {/* Regulatory Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Regulatory/Pharmacy Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* GST Number */}
                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Number *
                  </label>
                  <input
                    id="gstNumber"
                    type="text"
                    {...register('gstNumber', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 uppercase"
                    placeholder="27AAAAA0000A1Z5"
                  />
                  {errors.gstNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gstNumber.message}</p>
                  )}
                </div>

                {/* Drug License Number */}
                <div>
                  <label htmlFor="drugLicNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Drug License Number *
                  </label>
                  <input
                    id="drugLicNumber"
                    type="text"
                    {...register('drugLicNumber', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="DL NO: 123456"
                  />
                  {errors.drugLicNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.drugLicNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pharmacist Name */}
                <div>
                  <label htmlFor="pharmacistName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Registered Pharmacist Name *
                  </label>
                  <input
                    id="pharmacistName"
                    type="text"
                    {...register('pharmacistName', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="John Doe"
                  />
                  {errors.pharmacistName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pharmacistName.message}</p>
                  )}
                </div>

                {/* Pharmacist Registration Number */}
                <div>
                  <label htmlFor="pharmacistRegNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pharmacist Registration Number *
                  </label>
                  <input
                    id="pharmacistRegNumber"
                    type="text"
                    {...register('pharmacistRegNumber', { required: isCreatingAdmin })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="REG-12345/2023"
                  />
                  {errors.pharmacistRegNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pharmacistRegNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Schedule Drug Eligibility Toggle */}
              <div className="mt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <label htmlFor="scheduleDrugEligible" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Eligible to sell Schedule H, H1, and X
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable this if the store is licensed to sell Schedule H, H1, and X drugs
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = watch('scheduleDrugEligible') ?? false;
                        setValue('scheduleDrugEligible', !currentValue);
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        watch('scheduleDrugEligible') ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={watch('scheduleDrugEligible') ?? false}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          watch('scheduleDrugEligible') ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <input
                      type="hidden"
                      {...register('scheduleDrugEligible')}
                    />
                  </div>
                </div>
              </div>

              {/* Content Pages */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Content Pages
                </h3>
                
                {/* Important Note */}
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Note:</strong> Use the tabs below to switch between different content pages. All content will be saved together when you submit the form.
                  </p>
                </div>

                {/* Tabs */}
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex overflow-x-auto space-x-1" aria-label="Content Tabs">
                    {[
                      { id: 'return' as const, name: 'Return Policy' },
                      { id: 'shipping' as const, name: 'Shipping Info' },
                      { id: 'privacy' as const, name: 'Privacy Policy' },
                      { id: 'terms' as const, name: 'Terms & Conditions' },
                      { id: 'about' as const, name: 'About Us' },
                      { id: 'contact' as const, name: 'Contact' },
                      { id: 'faq' as const, name: 'FAQ' },
                    ].map((tab) => {
                      const isActive = activeContentTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            clearErrors();
                            setActiveContentTab(tab.id);
                          }}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                            isActive
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {tab.name}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Active Tab Content */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor={activeContentTab === 'return' ? 'returnPolicy' : `${activeContentTab}Content`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {activeContentTab === 'return' && 'Return and Refund Policy'}
                      {activeContentTab === 'shipping' && 'Shipping Info'}
                      {activeContentTab === 'privacy' && 'Privacy Policy'}
                      {activeContentTab === 'terms' && 'Terms & Conditions'}
                      {activeContentTab === 'about' && 'About Us'}
                      {activeContentTab === 'contact' && 'Contact'}
                      {activeContentTab === 'faq' && 'FAQ'}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const defaultContent = 
                            activeContentTab === 'return' ? DEFAULT_RETURN_POLICY :
                            activeContentTab === 'shipping' ? DEFAULT_SHIPPING_CONTENT :
                            activeContentTab === 'privacy' ? DEFAULT_PRIVACY_CONTENT :
                            activeContentTab === 'terms' ? DEFAULT_TERMS_CONTENT :
                            activeContentTab === 'about' ? DEFAULT_ABOUT_CONTENT :
                            activeContentTab === 'contact' ? DEFAULT_CONTACT_CONTENT :
                            DEFAULT_FAQ_CONTENT;
                          if (activeContentTab === 'return') {
                            setValue('returnPolicy', defaultContent);
                          } else {
                            setValue(`${activeContentTab}Content`, defaultContent);
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                      >
                        <ResetIcon className="w-3 h-3 mr-1.5" />
                        Reset to Default
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowContentPreview(true)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                      >
                        <Eye className="w-3 h-3 mr-1.5" />
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Textarea for active tab */}
                  {activeContentTab === 'return' && (
                    <textarea
                      id="returnPolicy"
                      {...register('returnPolicy')}
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
                      placeholder={DEFAULT_RETURN_POLICY}
                    />
                  )}
                  {activeContentTab === 'shipping' && (
                    <textarea
                      id="shippingContent"
                      {...register('shippingContent')}
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
                      placeholder={DEFAULT_SHIPPING_CONTENT}
                    />
                  )}
                  {activeContentTab === 'privacy' && (
                    <textarea
                      id="privacyContent"
                      {...register('privacyContent')}
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
                      placeholder={DEFAULT_PRIVACY_CONTENT}
                    />
                  )}
                  {activeContentTab === 'terms' && (
                    <textarea
                      id="termsContent"
                      {...register('termsContent')}
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
                      placeholder={DEFAULT_TERMS_CONTENT}
                    />
                  )}
                  {activeContentTab === 'about' && (
                    <textarea
                      id="aboutContent"
                      {...register('aboutContent')}
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
                      placeholder={DEFAULT_ABOUT_CONTENT}
                    />
                  )}
                  {activeContentTab === 'contact' && (
                    <textarea
                      id="contactContent"
                      {...register('contactContent')}
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
                      placeholder={DEFAULT_CONTACT_CONTENT}
                    />
                  )}
                  {activeContentTab === 'faq' && (
                    <textarea
                      id="faqContent"
                      {...register('faqContent')}
                      rows={15}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono whitespace-pre-wrap"
                      placeholder={DEFAULT_FAQ_CONTENT}
                    />
                  )}

                  {/* Formatting Hints */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Formatting Tips:</p>
                    {activeContentTab === 'faq' ? (
                      <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                        <li>Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Q: Question</code> for questions</li>
                        <li>Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">A: Answer</code> for answers</li>
                        <li>Each Q/A pair will be displayed as an expandable FAQ item</li>
                      </ul>
                    ) : (
                      <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                        <li><strong>Headers:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded"># Header Text</code> for main section headers</li>
                        <li><strong>Sub-headers:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">## Sub-header Text</code> or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Label:</code> format</li>
                        <li><strong>Bullets:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">•</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">-</code>, or <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">*</code> for lists</li>
                        <li><strong>Separators:</strong> Use separator lines (━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━) to divide sections</li>
                        <li><strong>Paragraphs:</strong> Regular text will be displayed as paragraphs</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Hero Images */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Homepage Hero Images
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload up to 10 hero images to display on the storefront homepage. If no images are uploaded, default images will be shown.
                </p>

                {/* Upload Options */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    ref={heroImageFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleHeroImageFileChange}
                    className="hidden"
                    disabled={uploadingHeroImage || heroImages.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={() => heroImageFileInputRef.current?.click()}
                    disabled={uploadingHeroImage || heroImages.length >= 10}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingHeroImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddHeroImageUrl}
                    disabled={heroImages.length >= 10}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image URL
                  </button>
                </div>

                {/* Hero Images Grid */}
                {heroImages.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Drag images to reorder. Images will be displayed in this order on the homepage.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {heroImages.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="aspect-square relative">
                            <img
                              src={imageUrl}
                              alt={`Hero ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveHeroImage(index)}
                                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                  title="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                            {heroImageKeywords[index] && (
                              <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded truncate" title={heroImageKeywords[index]}>
                                🔍 {heroImageKeywords[index]}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {heroImages.length} / 10 images uploaded
                    </p>
                  </div>
                )}

                {heroImages.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      No hero images uploaded
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Default images will be displayed on the homepage if no images are uploaded.
                    </p>
                  </div>
                )}

                {errors.heroImages && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.heroImages.message}</p>
                )}
              </div>

              {/* Shop Front Photo & Owner Photo */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Shop Photos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload shop front photo and owner photo. These will be displayed on the storefront contact page.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Shop Front Photo */}
                  <div>
                    <label htmlFor="shopFrontPhoto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shop Front Photo
                    </label>
                    <div className="space-y-2">
                      {/* URL Input */}
                      <input
                        id="shopFrontPhoto"
                        type="url"
                        {...register('shopFrontPhoto')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                        placeholder="https://example.com/shop-front.jpg"
                        onChange={(e) => setShopFrontPhoto(e.target.value)}
                      />
                      {/* File Upload */}
                      <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                        <input
                          type="file"
                          ref={shopFrontPhotoInputRef}
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image size must be less than 5MB');
                                return;
                              }
                              setUploadingShopFrontPhoto(true);
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const response = await api.post('/upload', formData, {
                                  headers: { 'Content-Type': 'multipart/form-data' },
                                });
                                const uploadedUrl = response.data.data.url;
                                setShopFrontPhoto(uploadedUrl);
                                setValue('shopFrontPhoto', uploadedUrl);
                                toast.success('Shop front photo uploaded successfully');
                                if (shopFrontPhotoInputRef.current) shopFrontPhotoInputRef.current.value = '';
                              } catch (error: any) {
                                toast.error(error.response?.data?.error || 'Failed to upload image');
                              } finally {
                                setUploadingShopFrontPhoto(false);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => shopFrontPhotoInputRef.current?.click()}
                          disabled={uploadingShopFrontPhoto}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {uploadingShopFrontPhoto ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {uploadingShopFrontPhoto ? 'Uploading...' : 'Upload Image'}
                        </button>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Max 5MB. JPG, PNG.
                        </p>
                      </div>
                      {/* Preview */}
                      {shopFrontPhoto && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gray-100 dark:bg-gray-800">
                          <img 
                            src={shopFrontPhoto} 
                            alt="Shop Front Preview" 
                            className="w-full h-full object-cover"
                            onLoad={() => {
                              // Image loaded successfully
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
                              target.onerror = null; // Prevent infinite loop
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShopFrontPhoto('');
                              setValue('shopFrontPhoto', '');
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition z-10 shadow-lg"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Preview
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.shopFrontPhoto && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shopFrontPhoto.message}</p>
                    )}
                  </div>

                  {/* Owner Photo */}
                  <div>
                    <label htmlFor="ownerPhoto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Owner Photo
                    </label>
                    <div className="space-y-2">
                      {/* URL Input */}
                      <input
                        id="ownerPhoto"
                        type="url"
                        {...register('ownerPhoto')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                        placeholder="https://example.com/owner.jpg"
                        onChange={(e) => setOwnerPhoto(e.target.value)}
                      />
                      {/* File Upload */}
                      <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                        <input
                          type="file"
                          ref={ownerPhotoInputRef}
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image size must be less than 5MB');
                                return;
                              }
                              setUploadingOwnerPhoto(true);
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const response = await api.post('/upload', formData, {
                                  headers: { 'Content-Type': 'multipart/form-data' },
                                });
                                const uploadedUrl = response.data.data.url;
                                setOwnerPhoto(uploadedUrl);
                                setValue('ownerPhoto', uploadedUrl);
                                toast.success('Owner photo uploaded successfully');
                                if (ownerPhotoInputRef.current) ownerPhotoInputRef.current.value = '';
                              } catch (error: any) {
                                toast.error(error.response?.data?.error || 'Failed to upload image');
                              } finally {
                                setUploadingOwnerPhoto(false);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => ownerPhotoInputRef.current?.click()}
                          disabled={uploadingOwnerPhoto}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {uploadingOwnerPhoto ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {uploadingOwnerPhoto ? 'Uploading...' : 'Upload Image'}
                        </button>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Max 5MB. JPG, PNG.
                        </p>
                      </div>
                      {/* Preview */}
                      {ownerPhoto && (
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gray-100 dark:bg-gray-800">
                          <img 
                            src={ownerPhoto} 
                            alt="Owner Photo Preview" 
                            className="w-full h-full object-cover"
                            onLoad={() => {
                              // Image loaded successfully
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                              target.onerror = null; // Prevent infinite loop
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setOwnerPhoto('');
                              setValue('ownerPhoto', '');
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition z-10 shadow-lg"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Preview
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.ownerPhoto && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ownerPhoto.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* UPI Payment Details */}
              {userRole === 'SUPER_ADMIN' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    UPI Payment Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Add UPI ID and scanner photo. These will be displayed to customers when they select online payment.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* UPI ID */}
                    <div>
                      <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        UPI ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="upiId"
                        type="text"
                        {...register('upiId')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="username@bankname (e.g., john@paytm)"
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      {errors.upiId && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.upiId.message}</p>
                      )}
                    </div>

                    {/* UPI Scanner Photo */}
                    <div>
                      <label htmlFor="upiScannerPhoto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        UPI Scanner Photo (QR Code)
                      </label>
                      <div className="space-y-2">
                        {/* URL Input */}
                        <input
                          id="upiScannerPhoto"
                          type="url"
                          {...register('upiScannerPhoto')}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                          placeholder="https://example.com/upi-qr.jpg"
                          onChange={(e) => setUpiScannerPhoto(e.target.value)}
                        />
                        {/* File Upload */}
                        <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                          <input
                            type="file"
                            ref={upiScannerPhotoInputRef}
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error('Image size must be less than 5MB');
                                  return;
                                }
                                setUploadingUpiScannerPhoto(true);
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const response = await api.post('/upload', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                  });
                                  const uploadedUrl = response.data.data.url;
                                  setUpiScannerPhoto(uploadedUrl);
                                  setValue('upiScannerPhoto', uploadedUrl);
                                  toast.success('UPI scanner photo uploaded successfully');
                                  if (upiScannerPhotoInputRef.current) upiScannerPhotoInputRef.current.value = '';
                                } catch (error: any) {
                                  toast.error(error.response?.data?.error || 'Failed to upload image');
                                } finally {
                                  setUploadingUpiScannerPhoto(false);
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => upiScannerPhotoInputRef.current?.click()}
                            disabled={uploadingUpiScannerPhoto}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {uploadingUpiScannerPhoto ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {uploadingUpiScannerPhoto ? 'Uploading...' : 'Upload QR Code'}
                          </button>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Max 5MB. JPG, PNG.
                          </p>
                        </div>
                        {/* Preview */}
                        {upiScannerPhoto && (
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-w-xs">
                            <img src={upiScannerPhoto} alt="UPI QR Code" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setUpiScannerPhoto('');
                                setValue('upiScannerPhoto', '');
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {errors.upiScannerPhoto && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.upiScannerPhoto.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Password</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                autoComplete="new-password"
                className="w-full px-4 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter password (min 12 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 12 characters with uppercase, lowercase, numbers, and special characters
            </p>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> {mounted && userRole === 'SUPER_ADMIN'
                ? 'You are creating a Tenant Admin who will have full access to manage this tenant.'
                : 'You are creating a Staff user who will have limited access to manage products and orders.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition bg-white dark:bg-gray-800"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create {roleLabel}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Content Preview Modal */}
      {showContentPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={() => setShowContentPreview(false)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl m-4 transition-colors max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Preview: {
                    activeContentTab === 'return' ? 'Return and Refund Policy' :
                    activeContentTab === 'shipping' ? 'Shipping Info' :
                    activeContentTab === 'privacy' ? 'Privacy Policy' :
                    activeContentTab === 'terms' ? 'Terms & Conditions' :
                    activeContentTab === 'about' ? 'About Us' :
                    activeContentTab === 'contact' ? 'Contact' :
                    'FAQ'
                  }
                </h2>
                <button
                  onClick={() => setShowContentPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  {(() => {
                    const content = activeContentTab === 'return' 
                      ? (watch('returnPolicy') || DEFAULT_RETURN_POLICY)
                      : (watch(`${activeContentTab}Content`) || 
                         (activeContentTab === 'shipping' ? DEFAULT_SHIPPING_CONTENT :
                          activeContentTab === 'privacy' ? DEFAULT_PRIVACY_CONTENT :
                          activeContentTab === 'terms' ? DEFAULT_TERMS_CONTENT :
                          activeContentTab === 'about' ? DEFAULT_ABOUT_CONTENT :
                          activeContentTab === 'contact' ? DEFAULT_CONTACT_CONTENT :
                          DEFAULT_FAQ_CONTENT));
                    return activeContentTab === 'faq' ? (
                      <FormattedFAQ text={content} />
                    ) : (
                      <FormattedContent text={content} />
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowContentPreview(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Image Modal */}
      {showHeroImageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={handleCancelHeroImageModal}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md m-4 transition-colors">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Hero Image</h2>
                <button
                  onClick={handleCancelHeroImageModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={heroImageUrlInput}
                    onChange={(e) => setHeroImageUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitHeroImage();
                      }
                    }}
                    autoFocus
                  />
                </div>

                {/* Keyword */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Keyword <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={heroImageKeywordInput}
                    onChange={(e) => setHeroImageKeywordInput(e.target.value)}
                    placeholder="e.g., vitamins, skincare, medicines"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitHeroImage();
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    When customers click this image, they&apos;ll be taken to products filtered by this keyword. Leave empty to go to shop page.
                  </p>
                </div>

                {/* Preview */}
                {heroImageUrlInput && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                      <img
                        src={heroImageUrlInput}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect fill="%23e5e7eb" width="400" height="225"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af"%3EInvalid Image URL%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCancelHeroImageModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitHeroImage}
                  disabled={!heroImageUrlInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

