import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, Crown, Zap, Star, Sparkles } from 'lucide-react';
import Header from '@/components/Header';

const Subscription = () => {
  const { user, subscribed, subscriptionTier, subscriptionEnd, isTrial, checkSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open customer portal');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setLoading(true);
    await checkSubscription();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground text-lg">
              Upgrade to Premium for advanced compression features
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Free Plan
                </CardTitle>
                <CardDescription>Perfect for occasional use</CardDescription>
                <div className="text-3xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Up to 5 images per batch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Basic compression</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>JPEG, PNG support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Client-side processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Side-by-side comparison</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className={`relative ${subscribed ? 'border-primary shadow-lg' : ''}`}>
              {subscribed && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary">
                  <Crown className="w-3 h-3 mr-1" />
                  Current Plan
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Premium Plan
                  <Badge variant="secondary">Popular</Badge>
                </CardTitle>
                <CardDescription>For professionals and power users</CardDescription>
                <div className="text-3xl font-bold">$9.99<span className="text-sm font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Up to 50 images per batch</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Advanced compression algorithms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>All formats (JPEG, PNG, WebP)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Lossless compression modes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Advanced quality controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Premium support</span>
                  </li>
                </ul>
                
                {subscribed ? (
                  <div className="space-y-3 mt-6">
                    <div className="text-sm text-muted-foreground">
                      <div>Status: <Badge variant={isTrial ? "secondary" : "default"}>
                        {isTrial ? "7-Day Trial" : "Active"}
                      </Badge></div>
                      {subscriptionTier && <div>Tier: {subscriptionTier}</div>}
                      {subscriptionEnd && (
                        <div>{isTrial ? "Trial ends" : "Renews"}: {new Date(subscriptionEnd).toLocaleDateString()}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={handleManageSubscription}
                        disabled={loading}
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Manage Subscription
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleRefreshStatus}
                        disabled={loading}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full mt-6 bg-gradient-primary hover:opacity-90" 
                    onClick={handleSubscribe}
                    disabled={loading || !user}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {!user && (
            <Alert>
              <AlertDescription>
                Please sign in to subscribe to Premium features.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
};

export default Subscription;