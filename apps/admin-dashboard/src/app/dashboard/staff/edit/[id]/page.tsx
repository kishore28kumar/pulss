'use client';

import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Store, Copy, ShieldCheck, RotateCcw, Image as ImageIcon, Upload, X, Lock, FileText, Eye, RotateCcw as ResetIcon } from 'lucide-react';
import FormattedContent from '@/components/content/FormattedContent';
import FormattedFAQ from '@/components/content/FormattedFAQ';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { getUserRole, isSuperAdmin } from '@/lib/permissions';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';

// Configurable read-only fields - easily extensible
const READ_ONLY_FIELDS = {
  storeRoute: true, // Store route/slug is read-only after creation
  // Add more fields here as needed in the future:
  // email: false, // Example: email could be made read-only if needed
  // id: true,     // Example: ID is always read-only
} as const;

// Edit schema - similar to create but password is optional
const editSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  password: z.string().min(12, 'Password must be at least 12 characters').optional().or(z.literal('')),
  // Store fields
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  storeRoute: z.string().min(2, 'Store route must be at least 2 characters').max(15, 'Store route must be at most 15 characters'),
  // Address fields
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  country: z.string().default('India'),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters').max(6, 'Pincode must be 6 characters'),
  // Regulatory fields
  gstNumber: z.string().min(1, 'GST number is required'),
  drugLicNumber: z.string().min(1, 'Drug License number is required'),
  pharmacistName: z.string().min(1, 'Pharmacist Name is required'),
  pharmacistRegNumber: z.string().min(1, 'Pharmacist Registration number is required'),
  scheduleDrugEligible: z.boolean().default(false),
  returnPolicy: z.string().optional(),
  shippingContent: z.string().optional(),
  privacyContent: z.string().optional(),
  termsContent: z.string().optional(),
  aboutContent: z.string().optional(),
  contactContent: z.string().optional(),
  faqContent: z.string().optional(),
  heroImages: z.array(z.string().url('Must be a valid URL')).max(10, 'Maximum 10 hero images allowed').optional(),
  heroImageKeywords: z.array(z.string()).max(10).optional(),
  isPrimaryContactWhatsApp: z.boolean().default(false),
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

type EditFormData = z.infer<typeof editSchema>;

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

// Default Content Page Templates (same as Create Tenant)
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

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  drugLicNumber?: string;
  pharmacistName?: string;
  pharmacistRegNumber?: string;
  pharmacistPhoto?: string;
  scheduleDrugEligible?: boolean;
  returnPolicy?: string;
  heroImages?: string[];
  heroImageKeywords?: string[];
  primaryContactWhatsApp?: string;
  isPrimaryContactWhatsApp?: boolean;
  shopFrontPhoto?: string;
  ownerPhoto?: string;
  upiId?: string;
  upiScannerPhoto?: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
  const [changePassword, setChangePassword] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<'return' | 'shipping' | 'privacy' | 'terms' | 'about' | 'contact' | 'faq'>('return');
  const [showContentPreview, setShowContentPreview] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  // Check if user is SUPER_ADMIN
  const isSuperAdminUser = mounted && isSuperAdmin();

  // Fetch tenant details
  const { data: tenantData, isLoading: isLoadingTenant, error: tenantError } = useQuery<Tenant>({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      try {
        const response = await api.get(`/tenants/${tenantId}`);
        return response.data.data;
      } catch (error: any) {
        console.error('Error fetching tenant:', error);
        // If tenant endpoint fails, try getting from tenants list
        if (error.response?.status === 403 || error.response?.status === 404) {
          const allTenantsResponse = await api.get('/tenants');
          const tenants = allTenantsResponse.data.data?.data || allTenantsResponse.data.data || [];
          const tenant = Array.isArray(tenants) 
            ? tenants.find((t: any) => t.id === tenantId)
            : null;
          if (tenant) {
            return tenant;
          }
        }
        throw error;
      }
    },
    enabled: !!tenantId && isSuperAdminUser,
    retry: false,
  });

  // Fetch admin user for this tenant
  const { data: adminData, isLoading: isLoadingAdmin, error: adminError } = useQuery<AdminUser>({
    queryKey: ['admin-user', tenantId],
    queryFn: async () => {
      try {
        // Get staff list with a high limit to ensure we get all admins
        const response = await api.get('/staff', {
          params: { page: 1, limit: 1000 },
        });
        
        // Staff API returns paginated data: { data: { data: [...], meta: {...} } }
        const staffArray = response.data?.data?.data || response.data?.data || [];
        
        if (!Array.isArray(staffArray)) {
          console.error('Invalid staff data structure:', response.data);
          throw new Error('Invalid response format from staff API');
        }
        
        // Find admin user for this tenant
        const admin = staffArray.find((s: any) => {
          // Check both possible structures: s.tenants?.id or s.tenantId
          const matchesTenant = s.tenants?.id === tenantId || s.tenantId === tenantId;
          const isAdmin = s.role === 'ADMIN';
          return matchesTenant && isAdmin;
        });
        
        if (!admin) {
          console.error('Admin user not found for tenant:', tenantId);
          console.error('Available staff count:', staffArray.length);
          console.error('Sample staff:', staffArray.slice(0, 3).map((s: any) => ({
            id: s.id,
            email: s.email,
            role: s.role,
            tenantId: s.tenantId,
            tenantsId: s.tenants?.id,
          })));
          throw new Error(`Admin user not found for tenant ${tenantId}`);
        }
        
        return admin;
      } catch (error: any) {
        console.error('Error fetching admin user:', error);
        throw error;
      }
    },
    enabled: !!tenantId && !!tenantData && isSuperAdminUser,
    retry: false, // Don't retry if admin not found
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    clearErrors,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  // Pre-populate form when data is loaded
  useEffect(() => {
    if (tenantData && adminData) {
      reset({
        email: adminData.email || '',
        firstName: adminData.firstName || '',
        lastName: adminData.lastName || '',
        phone: adminData.phone || '',
        password: '',
        storeName: tenantData.name || '',
        storeRoute: tenantData.slug || '',
        address: tenantData.address || '',
        city: tenantData.city || '',
        state: tenantData.state || '',
        country: tenantData.country || 'India',
        pincode: tenantData.pincode || '',
        gstNumber: tenantData.gstNumber || '',
        drugLicNumber: tenantData.drugLicNumber || '',
        pharmacistName: tenantData.pharmacistName || '',
        pharmacistRegNumber: tenantData.pharmacistRegNumber || '',
        scheduleDrugEligible: tenantData.scheduleDrugEligible ?? false,
        returnPolicy: tenantData.returnPolicy || '',
        shippingContent: tenantData.pageContent?.shipping || DEFAULT_SHIPPING_CONTENT,
        privacyContent: tenantData.pageContent?.privacy || DEFAULT_PRIVACY_CONTENT,
        termsContent: tenantData.pageContent?.terms || DEFAULT_TERMS_CONTENT,
        aboutContent: tenantData.pageContent?.about || DEFAULT_ABOUT_CONTENT,
        contactContent: tenantData.pageContent?.contact || DEFAULT_CONTACT_CONTENT,
        faqContent: tenantData.pageContent?.faq || DEFAULT_FAQ_CONTENT,
        heroImages: tenantData.heroImages || [],
        heroImageKeywords: tenantData.heroImageKeywords || [],
        isPrimaryContactWhatsApp: tenantData.isPrimaryContactWhatsApp ?? false,
        primaryContactWhatsApp: tenantData.primaryContactWhatsApp || '',
        shopFrontPhoto: tenantData.shopFrontPhoto || '',
        ownerPhoto: tenantData.ownerPhoto || '',
        upiId: tenantData.upiId || '',
        upiScannerPhoto: tenantData.upiScannerPhoto || '',
      });
      setHeroImages(tenantData.heroImages || []);
      setHeroImageKeywords(tenantData.heroImageKeywords || []);
      setShopFrontPhoto(tenantData.shopFrontPhoto || '');
      setOwnerPhoto(tenantData.ownerPhoto || '');
      setUpiId(tenantData.upiId || '');
      setUpiScannerPhoto(tenantData.upiScannerPhoto || '');
    }
  }, [tenantData, adminData, reset]);

  // Watch storeRoute to update storefront URL preview
  const storeRoute = watch('storeRoute');

  useEffect(() => {
    if (storeRoute) {
      const { getStorefrontUrl } = require('@/lib/config/urls');
      const storefrontBase = typeof window !== 'undefined'
        ? getStorefrontUrl()
        : (process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000');
      setStorefrontUrl(`${storefrontBase}/${storeRoute}`);
    } else {
      setStorefrontUrl('');
    }
  }, [storeRoute]);

  // Helper function to check if field is read-only
  const isReadOnly = (fieldName: keyof typeof READ_ONLY_FIELDS): boolean => {
    return READ_ONLY_FIELDS[fieldName] === true;
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
      const updatedKeywords = [...heroImageKeywords, ''];
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
      new URL(url);
      if (heroImages.length >= 10) {
        toast.error('Maximum 10 hero images allowed');
        return;
      }
      const updatedImages = [...heroImages, url];
      const updatedKeywords = [...heroImageKeywords, keyword || ''];
      setHeroImages(updatedImages);
      setHeroImageKeywords(updatedKeywords);
      setValue('heroImages', updatedImages);
      setValue('heroImageKeywords', updatedKeywords);
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

  // Photo upload handlers (similar to Create Tenant page)
  const handlePhotoUpload = async (file: File, type: 'shopFront' | 'owner' | 'upiScanner') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const setUploading = type === 'shopFront' ? setUploadingShopFrontPhoto : type === 'owner' ? setUploadingOwnerPhoto : setUploadingUpiScannerPhoto;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.data.url;

      if (type === 'shopFront') {
        setShopFrontPhoto(uploadedUrl);
        setValue('shopFrontPhoto', uploadedUrl);
      } else if (type === 'owner') {
        setOwnerPhoto(uploadedUrl);
        setValue('ownerPhoto', uploadedUrl);
      } else {
        setUpiScannerPhoto(uploadedUrl);
        setValue('upiScannerPhoto', uploadedUrl);
      }

      toast.success('Photo uploaded successfully');

      const inputRef = type === 'shopFront' ? shopFrontPhotoInputRef : type === 'owner' ? ownerPhotoInputRef : upiScannerPhotoInputRef;
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      // Update admin user
      const adminPayload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      };

      // Only update password if provided
      if (changePassword && data.password && data.password.trim() !== '') {
        adminPayload.password = data.password;
      }

      await api.put(`/staff/${adminData!.id}`, adminPayload);

      // Update tenant
      const tenantPayload: any = {
        name: data.storeName,
        // Don't update storeRoute if it's read-only
        ...(isReadOnly('storeRoute') ? {} : { slug: data.storeRoute }),
        email: data.email,
        phone: data.phone || undefined,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.pincode,
        gstNumber: data.gstNumber,
        drugLicNumber: data.drugLicNumber,
        pharmacistName: data.pharmacistName,
        pharmacistRegNumber: data.pharmacistRegNumber,
        scheduleDrugEligible: data.scheduleDrugEligible,
        returnPolicy: data.returnPolicy || undefined,
        pageContent: {
          shipping: data.shippingContent || DEFAULT_SHIPPING_CONTENT,
          privacy: data.privacyContent || DEFAULT_PRIVACY_CONTENT,
          terms: data.termsContent || DEFAULT_TERMS_CONTENT,
          about: data.aboutContent || DEFAULT_ABOUT_CONTENT,
          contact: data.contactContent || DEFAULT_CONTACT_CONTENT,
          faq: data.faqContent || DEFAULT_FAQ_CONTENT,
        },
        heroImages: heroImages,
        heroImageKeywords: heroImageKeywords,
        isPrimaryContactWhatsApp: data.isPrimaryContactWhatsApp,
        primaryContactWhatsApp: data.isPrimaryContactWhatsApp ? data.phone : (data.primaryContactWhatsApp || undefined),
        shopFrontPhoto: shopFrontPhoto || undefined,
        ownerPhoto: ownerPhoto || undefined,
        upiId: data.upiId || undefined,
        upiScannerPhoto: upiScannerPhoto || undefined,
      };

      await api.put(`/tenants/${tenantId}`, tenantPayload);
    },
    onSuccess: () => {
      toast.success('Tenant updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      router.push('/dashboard/staff');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update tenant';
      const errorMessages = error.response?.data?.errors;
      
      if (errorMessages && Array.isArray(errorMessages)) {
        if (errorMessages.length === 1) {
          toast.error(errorMessages[0]);
        } else {
          toast.error(
            <div className="space-y-1">
              <div className="font-semibold">The following errors occurred:</div>
              <ul className="list-disc list-inside space-y-0.5 text-sm">
                {errorMessages.map((msg: string, idx: number) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>,
            { duration: 5000 }
          );
        }
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const onSubmit = (data: EditFormData) => {
    mutation.mutate(data);
  };

  const onValidationError = (errors: any) => {
    const errorMessages: string[] = [];
    
    Object.entries(errors).forEach(([field, error]: [string, any]) => {
      if (error?.message) {
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
        { duration: 5000 }
      );
    }
  };

  // Show loading state
  if (!mounted || isLoadingTenant || isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading tenant information...</p>
        </div>
      </div>
    );
  }

  // Show error if tenant not found
  if (tenantError || (!tenantData && !isLoadingTenant)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">
            {tenantError?.message || 'Tenant not found'}
          </p>
          {tenantError && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Error: {tenantError instanceof Error ? tenantError.message : 'Unknown error'}
            </p>
          )}
          <button
            onClick={() => router.push('/dashboard/staff')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  // Show error if admin not found (but tenant exists)
  if (adminError || !adminData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">
            {adminError?.message || 'Admin user not found for this tenant'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Tenant exists but no admin user was found. This might indicate a data inconsistency.
          </p>
          <button
            onClick={() => router.push('/dashboard/staff')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission={Permission.STAFF_INVITE} fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">You do not have permission to edit tenants</p>
        </div>
      </div>
    }>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Tenant</h1>
              <p className="text-sm text-gray-500 font-medium">
                Update tenant and admin information
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
            {/* Admin User Information */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Admin User Information</h3>
              
              {/* Email */}
              <div className="mb-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Contact Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="1234567890"
                  maxLength={10}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setValue('phone', value);
                  }}
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
                
                {/* WhatsApp Number Input */}
                {!watch('isPrimaryContactWhatsApp') && (
                  <div className="mt-3">
                    <label htmlFor="primaryContactWhatsApp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      WhatsApp Number *
                    </label>
                    <input
                      id="primaryContactWhatsApp"
                      type="tel"
                      {...register('primaryContactWhatsApp')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="1234567890"
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setValue('primaryContactWhatsApp', value);
                      }}
                    />
                    {errors.primaryContactWhatsApp && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.primaryContactWhatsApp.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Password Change */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input
                    id="changePassword"
                    type="checkbox"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="changePassword" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Lock className="w-4 h-4 mr-1" />
                    Change Password
                  </label>
                </div>
                {changePassword && (
                  <div>
                    <input
                      id="password"
                      type="password"
                      {...register('password')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Enter new password (min 12 characters)"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Store Information */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Store className="w-5 h-5 mr-2" />
                Store Information
              </h3>

              {/* Store Name */}
              <div className="mb-4">
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name *
                </label>
                <input
                  id="storeName"
                  type="text"
                  {...register('storeName')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="City Pharmacy"
                />
                {errors.storeName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.storeName.message}</p>
                )}
              </div>

              {/* Store Route - Read-only */}
              <div className="mb-4">
                <label htmlFor="storeRoute" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Route (URL Slug) <span className="text-gray-500 text-xs">(Read-only)</span>
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
                    {...register('storeRoute')}
                    disabled={isReadOnly('storeRoute')}
                    className={`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg lowercase bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                      isReadOnly('storeRoute') 
                        ? 'bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed' 
                        : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="city-pharmacy"
                    maxLength={15}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Store route cannot be changed after creation. This ensures URL consistency.
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
            </div>

            {/* Address Fields */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Store Address</h3>

              {/* Address */}
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address *
                </label>
                <input
                  id="address"
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="123 Main Street, Suite 100"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.message}</p>
                )}
              </div>

              {/* City and State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    id="city"
                    type="text"
                    {...register('city')}
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
                    {...register('state')}
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
                    {...register('pincode')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="400001"
                    maxLength={6}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setValue('pincode', value);
                    }}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pincode.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Regulatory Details */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Regulatory/Pharmacy Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* GST Number */}
                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Number *
                  </label>
                  <input
                    id="gstNumber"
                    type="text"
                    {...register('gstNumber')}
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
                    {...register('drugLicNumber')}
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
                    {...register('pharmacistName')}
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
                    {...register('pharmacistRegNumber')}
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
            </div>

            {/* Content Pages */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
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
                        onClick={() => setActiveContentTab(tab.id)}
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

            {/* Shop Front Photo & Owner Photo */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
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
                      value={shopFrontPhoto}
                      onChange={(e) => {
                        setShopFrontPhoto(e.target.value);
                        setValue('shopFrontPhoto', e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      placeholder="https://example.com/shop-front.jpg"
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
                            await handlePhotoUpload(file, 'shopFront');
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
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
                            target.onerror = null;
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
                      value={ownerPhoto}
                      onChange={(e) => {
                        setOwnerPhoto(e.target.value);
                        setValue('ownerPhoto', e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      placeholder="https://example.com/owner.jpg"
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
                            await handlePhotoUpload(file, 'owner');
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
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                            target.onerror = null;
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
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
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
                    UPI ID
                  </label>
                  <input
                    id="upiId"
                    type="text"
                    {...register('upiId')}
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      setValue('upiId', e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="username@bankname (e.g., john@paytm)"
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
                      value={upiScannerPhoto}
                      onChange={(e) => {
                        setUpiScannerPhoto(e.target.value);
                        setValue('upiScannerPhoto', e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      placeholder="https://example.com/upi-qr.jpg"
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
                            await handlePhotoUpload(file, 'upiScanner');
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

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Tenant'
                )}
              </button>
            </div>
          </form>
        </div>
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
    </PermissionGuard>
  );
}

