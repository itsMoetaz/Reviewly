import { useState } from 'react';
import { Bell, Mail, MessageSquare, GitPullRequest, Loader2, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export const NotificationsSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'email_reviews',
      label: 'Review Notifications',
      description: 'Get notified when your code is reviewed',
      icon: <GitPullRequest className="w-5 h-5 text-indigo-500" />,
      enabled: true,
    },
    {
      id: 'email_comments',
      label: 'Comment Notifications',
      description: 'Receive emails for new comments on your PRs',
      icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
      enabled: true,
    },
    {
      id: 'email_mentions',
      label: 'Mention Notifications',
      description: 'Get notified when someone mentions you',
      icon: <Mail className="w-5 h-5 text-pink-500" />,
      enabled: false,
    },
    {
      id: 'email_weekly',
      label: 'Weekly Digest',
      description: 'Receive a weekly summary of your activity',
      icon: <Bell className="w-5 h-5 text-amber-500" />,
      enabled: true,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-500" />
          Notification Preferences
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Manage how you receive notifications</p>
      </div>

      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface/30 hover:bg-surface/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-background">{setting.icon}</div>
              <div>
                <Label className="text-sm font-medium text-foreground">{setting.label}</Label>
                <p className="text-sm text-muted-foreground mt-0.5">{setting.description}</p>
              </div>
            </div>
            <Switch checked={setting.enabled} onCheckedChange={() => toggleSetting(setting.id)} />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="min-w-[160px]">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  );
};
