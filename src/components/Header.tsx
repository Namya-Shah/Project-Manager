import { useState, useEffect } from 'react';
import { GitBranch, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStatus, type ActivityStatus } from '@/hooks/useActivityStatus';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfileSettings } from '@/components/UserProfileSettings';
import { supabase } from '@/lib/supabase';

const EMOJI_AVATARS = ['😀', '😎', '🥳', '🤓', '😍', '🚀', '💻', '⭐', '🔥', '💡', '🎯', '🌟', '👨‍💻', '👩‍💻', '🧑‍🚀', '👽'];
const ICON_AVATARS = ['😊', '🎨', '🎭', '🎪', '🎬', '🎤', '🎸', '🎹', '⚡', '🌈', '🦄', '🐉'];

const STATUS_CONFIG: Record<ActivityStatus, { label: string; color: string; pulse: boolean }> = {
  active: { label: 'Active', color: 'bg-activity-max', pulse: true },
  idle: { label: 'Idle', color: 'bg-yellow-500', pulse: false },
  away: { label: 'Away', color: 'bg-orange-500', pulse: false },
  inactive: { label: 'Inactive', color: 'bg-gray-500', pulse: false },
};

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const activityStatus = useActivityStatus();
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const statusConfig = STATUS_CONFIG[activityStatus];
  const pulseClass = statusConfig.pulse ? 'animate-pulse' : '';

  return (
    <header className="border-b border-border/50 glass sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">DevLog</h1>
            <p className="text-xs text-muted-foreground font-mono">Track your progress</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${statusConfig.color} ${pulseClass}`} />
            <span className="text-xs text-muted-foreground font-mono">{statusConfig.label}</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileSettings(true)}
                className="gap-2"
                title="Profile settings"
              >
                <Avatar className="h-8 w-8">
                  {profile?.avatar_url && !EMOJI_AVATARS.includes(profile.avatar_url) && !ICON_AVATARS.includes(profile.avatar_url) ? (
                    <>
                      <AvatarImage src={profile.avatar_url} alt={displayName} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className={`text-lg ${profile?.avatar_url ? 'bg-transparent' : 'bg-primary/10 text-primary text-xs'}`}>
                      {profile?.avatar_url || initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {displayName}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <UserProfileSettings
        open={showProfileSettings}
        onOpenChange={(open) => {
          setShowProfileSettings(open);
          if (!open) loadProfile(); // Reload profile when dialog closes
        }}
      />
    </header>
  );
};

export default Header;
