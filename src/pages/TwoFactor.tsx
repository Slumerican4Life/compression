import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

const TwoFactor = () => {
  const { setupTwoFactor, enableTwoFactor } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await setupTwoFactor();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await enableTwoFactor(token, secret);
      if (error) throw error;
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
      
      // Show backup codes (in real implementation, get from API response)
      setBackupCodes([
        'abc123def456',
        '789ghi012jkl',
        '345mno678pqr',
        '901stu234vwx',
        '567yza890bcd'
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Two-Factor Authentication
            </h1>
            <p className="text-muted-foreground text-lg">
              Secure your account with an additional layer of protection
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'setup' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Enable Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account using an authenticator app like Google Authenticator or Authy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSetup} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Setup 2FA
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'verify' && !backupCodes.length && (
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Scan this QR code with your authenticator app, then enter the 6-digit code to verify.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Or enter this code manually:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm">{secret}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(secret)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Enter verification code:</label>
                  <div className="flex justify-center">
                    <InputOTP value={token} onChange={setToken} maxLength={6}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button 
                    onClick={handleVerify} 
                    disabled={loading || token.length !== 6}
                    className="w-full"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Verify & Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {backupCodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">2FA Successfully Enabled!</CardTitle>
                <CardDescription>
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="bg-muted px-2 py-1 rounded text-sm text-center">
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Backup Codes
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TwoFactor;