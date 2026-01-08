import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, Loader2, Smile, Zap, Heart, Star, Shield, Flame, Code, Rocket } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined emoji and icon avatars
const EMOJI_AVATARS = ['😀', '😎', '🥳', '🤓', '😍', '🚀', '💻', '⭐', '🔥', '💡', '🎯', '🌟', '👨‍💻', '👩‍💻', '🧑‍🚀', '👽'];
const ICON_AVATARS = ['😊', '🎨', '🎭', '🎪', '🎬', '🎤', '🎸', '🎹', '⚡', '🌈', '🦄', '🐉'];

export function UserProfileSettings({ open, onOpenChange }: UserProfileSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      loadProfile();
    }
  }, [open, user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setFullName(data?.full_name || '');
      setAvatarUrl(data?.avatar_url || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Convert image to base64 for storage in database
      // This avoids needing a separate storage bucket
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          
          // Update profile with base64 image
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: base64String })
            .eq('id', user.id);

          if (updateError) throw updateError;

          setAvatarUrl(base64String);

          toast({
            title: 'Success',
            description: 'Avatar updated successfully',
          });
        } catch (error) {
          console.error('Error saving avatar:', error);
          toast({
            title: 'Error',
            description: 'Failed to save avatar',
            variant: 'destructive',
          });
        } finally {
          setIsSaving(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read image file',
          variant: 'destructive',
        });
        setIsSaving(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = fullName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Update your name and avatar to personalize your profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Display Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/50 border border-border">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{user?.email || 'Not available'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This is the email address associated with your account
            </p>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              {avatarUrl && !EMOJI_AVATARS.includes(avatarUrl) && !ICON_AVATARS.includes(avatarUrl) ? (
                <>
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className={`text-5xl ${avatarUrl ? 'bg-transparent' : 'bg-primary/10 text-primary'}`}>
                  {avatarUrl || initials}
                </AvatarFallback>
              )}
            </Avatar>
            
            <Tabs defaultValue="emoji" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="emoji">Emojis</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="emoji" className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setAvatarUrl(emoji)}
                      className={`flex items-center justify-center h-12 rounded-lg text-2xl transition-all ${
                        avatarUrl === emoji 
                          ? 'ring-2 ring-primary bg-primary/10' 
                          : 'hover:bg-secondary/50 border border-transparent'
                      }`}
                      disabled={isSaving}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-3">
                <div className="flex flex-col items-center gap-2">
                  <label htmlFor="avatar-upload" className="cursor-pointer w-full">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full"
                      disabled={isSaving}
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4" />
                        {avatarUrl && !EMOJI_AVATARS.includes(avatarUrl) && !ICON_AVATARS.includes(avatarUrl) ? 'Change Avatar' : 'Upload Avatar'}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isSaving}
                  />
                  {avatarUrl && !EMOJI_AVATARS.includes(avatarUrl) && !ICON_AVATARS.includes(avatarUrl) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatarUrl('')}
                      disabled={isSaving}
                      className="text-xs text-muted-foreground"
                    >
                      Remove Avatar
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Name Section */}
          <div className="space-y-2">
            <label htmlFor="full-name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="full-name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Your name will be displayed in team logs and project members
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
