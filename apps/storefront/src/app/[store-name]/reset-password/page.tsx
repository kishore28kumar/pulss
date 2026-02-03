'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { authService } from '@/lib/auth';
import { Store, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { validatePassword, getPasswordRequirements } from '@/lib/utils';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Check for token and pre-fill email/phone on mount
  useEffect(() => {
    const token = authService.getPasswordResetToken();
    const storedEmail = authService.getPasswordResetEmail();
    const storedPhone = authService.getPasswordResetPhone();

    if (!token) {
      // No token found, redirect to forgot-password
      toast.error('Reset token not found. Please request a new password reset.');
      router.push(`/${storeName}/forgot-password`);
      return;
    }

    if (storedEmail) setEmail(storedEmail);
    if (storedPhone) setPhone(storedPhone);
  }, [router, storeName]);

  // Show loading while tenant is loading
  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if token exists in sessionStorage
    const token = authService.getPasswordResetToken();
    if (!token) {
      setError('Reset token not found. Please request a new password reset.');
      authService.clearPasswordResetData();
      setTimeout(() => {
        router.push(`/${storeName}/forgot-password`);
      }, 2000);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Invalid password');
      return;
    }

    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(formData.newPassword);
      toast.success('Password reset successful. Please login with your new credentials.');
      
      // Small delay to show toast before redirect
      setTimeout(() => {
        router.push(`/${storeName}/login`);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      
      // If token is invalid/expired, clear and redirect
      if (err.response?.status === 400 || err.response?.status === 401) {
        authService.clearPasswordResetData();
        setTimeout(() => {
          router.push(`/${storeName}/forgot-password`);
        }, 2000);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-lg object-cover" />
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl mb-3 sm:mb-4">
              <Store className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Enter your new password</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Pre-filled Email and Phone (Read-only) */}
            {(email || phone) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
                {email && (
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="ml-2 text-gray-900">{email}</span>
                  </div>
                )}
                {phone && (
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Phone:</span>
                    <span className="ml-2 text-gray-900">{phone}</span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.newPassword && (
                  <div className="mt-2 space-y-1">
                    {(() => {
                      const requirements = getPasswordRequirements(formData.newPassword);
                      return (
                        <>
                          <div className={`flex items-center text-xs ${requirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.minLength ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            At least 8 characters
                          </div>
                          <div className={`flex items-center text-xs ${requirements.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.hasUppercase ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            Password must contain at least one uppercase letter
                          </div>
                          <div className={`flex items-center text-xs ${requirements.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.hasLowercase ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            Password must contain at least one lowercase letter
                          </div>
                          <div className={`flex items-center text-xs ${requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.hasNumber ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            Password must contain at least one number
                          </div>
                          <div className={`flex items-center text-xs ${requirements.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                            {requirements.hasSpecial ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5" />}
                            Password must contain at least one special character
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
                {!formData.newPassword && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}

