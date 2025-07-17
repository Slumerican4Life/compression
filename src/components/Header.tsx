import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, LogOut, User, Crown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import neuronixLogo from '@/assets/neuronix-brain-logo.png';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, subscribed } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img src={neuronixLogo} alt="Neuronix Brain" className="w-10 h-10" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Neuronix A.I. Image Compression
            </h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/faq">
              <Button variant="ghost">FAQ</Button>
            </Link>
            <Link to="/subscription">
              <Button variant="ghost">Pricing</Button>
            </Link>
            
            {/* Theme Toggle */}
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <Switch 
                checked={theme === 'dark'} 
                onCheckedChange={toggleTheme}
              />
              <Moon className="w-4 h-4" />
            </div>

            {user ? (
              <div className="flex items-center space-x-2">
                {subscribed && (
                  <Badge variant="default" className="bg-gradient-primary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {user.email}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;