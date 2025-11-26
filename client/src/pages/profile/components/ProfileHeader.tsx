import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/core/services/userService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ProfileHeaderProps {
  onAvatarUpdate?: () => void;
}

export const ProfileHeader = ({ onAvatarUpdate }: ProfileHeaderProps) => {
  const { user, fetchUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await userService.uploadAvatar(file);

      if (result.success) {
        await fetchUser();
        onAvatarUpdate?.();
      } else {
        alert(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-border">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="relative p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={`${API_URL}${user.avatar_url}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-foreground">{getInitials()}</span>
                )}
              </div>
            </div>

            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-foreground">{user?.full_name || user?.username}</h1>
            <p className="text-muted-foreground">@{user?.username}</p>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>

            <div className="flex flex-wrap items-center gap-3 mt-4 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {user?.role}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  user?.subscription_tier === 'PRO'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : user?.subscription_tier === 'PLUS'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                {user?.subscription_tier} plan
              </span>

              <span className="text-xs text-muted-foreground">
                Member since {user?.created_at ? formatDate(user.created_at) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
