import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, ShieldCheck, ShieldAlert, Copy, Download } from 'lucide-react';

interface TwoFactorAuthProps {
  apiBaseUrl?: string;
}

interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  message: string;
}

interface BackupCodesResponse {
  success: boolean;
  message: string;
  backupCodes: string[];
  warning: string;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ 
  apiBaseUrl = 'http://localhost:5000/api' 
}) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };

  // Check 2FA status on component mount
  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch(`${apiBaseUrl}/auth/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check 2FA status');
      }

      const data = await response.json();
      setIs2FAEnabled(data.enabled);
    } catch (err) {
      console.error('Error checking 2FA status:', err);
      setError('Failed to check 2FA status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${apiBaseUrl}/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to enable 2FA');
      }

      const data: TwoFactorSetupResponse = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowSetupModal(true);
    } catch (err) {
      setError('Failed to initiate 2FA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${apiBaseUrl}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid verification code');
      }

      const data: BackupCodesResponse = await response.json();
      setBackupCodes(data.backupCodes);
      setIs2FAEnabled(true);
      setShowSetupModal(false);
      setShowBackupCodesModal(true);
      setSuccess('Two-factor authentication enabled successfully!');
      setVerificationToken('');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${apiBaseUrl}/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setIs2FAEnabled(false);
      setShowDisableModal(false);
      setPassword('');
      setSuccess('Two-factor authentication disabled successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setSuccess('Secret key copied to clipboard');
    setTimeout(() => setSuccess(''), 3000);
  };

  const downloadBackupCodes = () => {
    const content = `Pulss Two-Factor Authentication Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulss-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (checkingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {is2FAEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account by requiring a code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {is2FAEnabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
              </p>
            </div>
            <div>
              {is2FAEnabled ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDisableModal(true)}
                  disabled={loading}
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  onClick={handleEnable2FA}
                  disabled={loading}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>

          {is2FAEnabled && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Protected with 2FA</p>
              <p>
                You'll need to enter a code from your authenticator app each time you sign in.
                Make sure you have your backup codes saved in a secure location.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the 6-digit code to verify
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCode && (
              <div className="flex flex-col items-center space-y-2">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                
                <div className="w-full">
                  <Label>Or enter this key manually:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                      {secret}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copySecret}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verificationToken">Verification Code</Label>
              <Input
                id="verificationToken"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSetupModal(false);
                  setVerificationToken('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerify2FA}
                disabled={loading || verificationToken.length !== 6}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Modal */}
      <Dialog open={showBackupCodesModal} onOpenChange={setShowBackupCodesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Backup Codes</DialogTitle>
            <DialogDescription>
              Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-amber-600 font-medium">
                Each code can only be used once. Save them now!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {backupCodes.map((code, index) => (
                <code key={index} className="text-sm font-mono">
                  {code}
                </code>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadBackupCodes}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join('\n'));
                  setSuccess('Backup codes copied to clipboard');
                }}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy All
              </Button>
            </div>

            <Button
              onClick={() => setShowBackupCodesModal(false)}
              className="w-full"
            >
              I've Saved My Codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Modal */}
      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable 2FA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisableModal(false);
                  setPassword('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={loading || !password}
                className="flex-1"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TwoFactorAuth;
