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
import { Search, Gift, Users, Crown, Settings, Filter } from 'lucide-react';
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
      // Use the new database function to get all users
      const { data, error } = await supabase.rpc('get_all_users_admin');
      
      if (error) throw error;

      const enrichedUsers: User[] = (data || []).map((user: any) => ({
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        phone_number: user.phone_number,
        subscribed: user.subscribed,
        subscription_tier: user.subscription_tier,
        subscription_end: user.subscription_end,
        is_gifted: user.is_gifted,
        gifted_by: user.gifted_by,
        trial_end: user.trial_end,
        created_at: user.created_at
      }));

      setUsers(enrichedUsers);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message || "Failed to load user list",
        variant: "destructive",
      });
      console.error('Load users error:', error);
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
    </div>
  );
};

export default AdminPanel;