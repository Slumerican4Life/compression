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
import { Search, Gift, Users, Crown, Settings, Filter, UserX } from 'lucide-react';
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
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'members' | 'trial' | 'free'>('all');
  const [giftMonths, setGiftMonths] = useState(1);
  const [giftMessage, setGiftMessage] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);

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
      console.log('Loading users - fetching profiles and subscribers...');
      
      // Fetch all profiles and subscribers in parallel
      const [profilesResult, subscribersResult] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, phone_number, created_at').order('created_at', { ascending: false }),
        supabase.from('subscribers').select('*')
      ]);

      if (profilesResult.error) {
        console.error('Profiles error:', profilesResult.error);
        throw profilesResult.error;
      }

      if (subscribersResult.error) {
        console.error('Subscribers error:', subscribersResult.error);
        throw subscribersResult.error;
      }

      console.log('Profiles data:', profilesResult.data);
      console.log('Subscribers data:', subscribersResult.data);

      // Create enriched users list
      const enrichedUsers: User[] = [];
      
      // Process each subscriber record (since they have the email)
      for (const subscriber of subscribersResult.data || []) {
        // Find matching profile if exists
        const profile = profilesResult.data?.find(p => p.user_id === subscriber.user_id);
        
        enrichedUsers.push({
          user_id: subscriber.user_id || '',
          email: subscriber.email,
          display_name: profile?.display_name || null,
          phone_number: profile?.phone_number || null,
          subscribed: subscriber.subscribed || false,
          subscription_tier: subscriber.subscription_tier || null,
          subscription_end: subscriber.subscription_end || null,
          is_gifted: subscriber.is_gifted || false,
          gifted_by: subscriber.gifted_by || null,
          trial_end: subscriber.trial_end || null,
          created_at: profile?.created_at || subscriber.created_at
        });
      }

      console.log('Final enriched users:', enrichedUsers);
      setUsers(enrichedUsers);
    } catch (error: any) {
      console.error('Complete error:', error);
      toast({
        title: "Error loading users",
        description: error.message || "Failed to load user list",
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

  const deactivateSubscription = async () => {
    if (!selectedUser) return;

    setDeactivateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('deactivate-subscription', {
        body: {
          targetUserEmail: selectedUser.email,
          reason: deactivateReason
        }
      });

      if (error) throw error;

      toast({
        title: "Subscription deactivated!",
        description: `Successfully deactivated subscription for ${selectedUser.email}`,
      });

      setSelectedUser(null);
      setDeactivateReason('');
      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Failed to deactivate subscription",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
    setDeactivateLoading(false);
  };

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone_number && user.phone_number.includes(searchTerm));
    
    // Membership filter
    const matchesMembership = (() => {
      switch (membershipFilter) {
        case 'members':
          return user.subscribed;
        case 'trial':
          return !user.subscribed && user.trial_end && new Date(user.trial_end) > new Date();
        case 'free':
          return !user.subscribed && (!user.trial_end || new Date(user.trial_end) <= new Date());
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesMembership;
  });

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
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <select
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Users ({users.length})</option>
                <option value="members">Members ({users.filter(u => u.subscribed).length})</option>
                <option value="trial">Trial ({users.filter(u => !u.subscribed && u.trial_end && new Date(u.trial_end) > new Date()).length})</option>
                <option value="free">Free ({users.filter(u => !u.subscribed && (!u.trial_end || new Date(u.trial_end) <= new Date())).length})</option>
              </select>
            </div>
            <Button onClick={loadUsers} variant="outline">
              Refresh
            </Button>
          </div>

          <div className="space-y-2 h-96 overflow-auto border rounded-lg p-2 bg-muted/20">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your search criteria
              </div>
            ) : (
              filteredUsers.map((userData) => (
                <div
                  key={userData.email}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors bg-background ${
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
                          👤 {userData.display_name}
                        </div>
                      )}
                      {userData.phone_number && (
                        <div className="text-sm text-muted-foreground">
                          📱 {userData.phone_number}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        📅 Joined: {new Date(userData.created_at).toLocaleDateString()}
                      </div>
                      {userData.is_gifted && userData.gifted_by && (
                        <div className="text-xs text-muted-foreground">
                          🎁 Gifted by: {userData.gifted_by}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {userData.subscribed ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-600">
                            💎 {userData.subscription_tier || 'Premium'} 
                            {userData.is_gifted && ' (Gift)'}
                          </Badge>
                        </div>
                      ) : userData.trial_end && new Date(userData.trial_end) > new Date() ? (
                        <Badge variant="outline" className="border-blue-500 text-blue-600">
                          🆓 Trial Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          🚫 Free User
                        </Badge>
                      )}
                      {userData.subscription_end && (
                        <div className="text-xs text-muted-foreground">
                          ⏰ Expires: {new Date(userData.subscription_end).toLocaleDateString()}
                        </div>
                      )}
                      {userData.trial_end && !userData.subscribed && new Date(userData.trial_end) > new Date() && (
                        <div className="text-xs text-muted-foreground">
                          ⏰ Trial ends: {new Date(userData.trial_end).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
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

      {/* Deactivate Subscription */}
      {selectedUser && selectedUser.subscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Deactivate Subscription
            </CardTitle>
            <CardDescription>
              Deactivate the subscription for {selectedUser.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Add a reason for deactivation..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={deactivateSubscription}
                disabled={deactivateLoading}
                variant="destructive"
                className="flex-1"
              >
                {deactivateLoading ? 'Deactivating...' : 'Deactivate Subscription'}
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