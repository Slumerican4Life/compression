import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Gift, Users, Crown, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  email: string;
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  is_gifted: boolean;
  gifted_by: string | null;
  trial_end: string | null;
  created_at: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [giftMonths, setGiftMonths] = useState(1);
  const [giftMessage, setGiftMessage] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .single();

      setIsAdmin(!!data);
      if (data) {
        await loadUsers();
      }
    } catch (error) {
      console.log('Not an admin user');
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      // First fetch all subscribers
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscribersError) throw subscribersError;

      // Then fetch profiles for each user
      const enrichedUsers: User[] = [];
      
      for (const subscriber of subscribersData || []) {
        let profileData = null;
        
        if (subscriber.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, phone_number')
            .eq('user_id', subscriber.user_id)
            .single();
          profileData = profile;
        }

        enrichedUsers.push({
          user_id: subscriber.user_id || '',
          email: subscriber.email,
          display_name: profileData?.display_name || null,
          phone_number: profileData?.phone_number || null,
          subscribed: subscriber.subscribed,
          subscription_tier: subscriber.subscription_tier,
          subscription_end: subscriber.subscription_end,
          is_gifted: subscriber.is_gifted || false,
          gifted_by: subscriber.gifted_by,
          trial_end: subscriber.trial_end,
          created_at: subscriber.created_at
        });
      }

      setUsers(enrichedUsers);
    } catch (error) {
      toast({
        title: "Error loading users",
        description: "Failed to load user list",
        variant: "destructive",
      });
    }
  };

  const giftSubscription = async () => {
    if (!selectedUser) return;

    setGiftLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gift-subscription', {
        body: {
          targetUserEmail: selectedUser.email,
          months: giftMonths,
          message: giftMessage
        }
      });

      if (error) throw error;

      toast({
        title: "Subscription gifted!",
        description: `Successfully gifted ${giftMonths} month${giftMonths > 1 ? 's' : ''} to ${selectedUser.email}`,
      });

      setSelectedUser(null);
      setGiftMessage('');
      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Failed to gift subscription",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
    setGiftLoading(false);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phone_number && user.phone_number.includes(searchTerm))
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Access denied. Admin privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Crown className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <Badge variant="default">Owner</Badge>
      </div>

      {/* Search Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Search and manage user subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={loadUsers} variant="outline">
              Refresh
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-auto">
            {filteredUsers.map((userData) => (
              <div
                key={userData.email}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.email === userData.email
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedUser(userData)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{userData.email}</div>
                    {userData.display_name && (
                      <div className="text-sm text-muted-foreground">
                        Name: {userData.display_name}
                      </div>
                    )}
                    {userData.phone_number && (
                      <div className="text-sm text-muted-foreground">
                        Phone: {userData.phone_number}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Joined: {new Date(userData.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {userData.subscribed ? (
                      <Badge variant="default">
                        {userData.subscription_tier} {userData.is_gifted && '(Gifted)'}
                      </Badge>
                    ) : userData.trial_end && new Date(userData.trial_end) > new Date() ? (
                      <Badge variant="outline">Trial</Badge>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                    {userData.subscription_end && (
                      <div className="text-xs text-muted-foreground">
                        Expires: {new Date(userData.subscription_end).toLocaleDateString()}
                      </div>
                    )}
                    {userData.trial_end && !userData.subscribed && new Date(userData.trial_end) > new Date() && (
                      <div className="text-xs text-muted-foreground">
                        Trial ends: {new Date(userData.trial_end).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gift Subscription */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Gift Subscription
            </CardTitle>
            <CardDescription>
              Gift a premium subscription to {selectedUser.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="months">Duration (months)</Label>
              <Input
                id="months"
                type="number"
                min="1"
                max="12"
                value={giftMonths}
                onChange={(e) => setGiftMonths(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div>
              <Label htmlFor="message">Gift Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message..."
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={giftSubscription}
                disabled={giftLoading}
                className="flex-1"
              >
                {giftLoading ? 'Gifting...' : `Gift ${giftMonths} Month${giftMonths > 1 ? 's' : ''}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPanel;