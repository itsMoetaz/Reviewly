import { useState } from 'react';
import { User, Shield, Bell, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ProfileHeader,
  GeneralSection,
  SecuritySection,
  NotificationsSection,
  DangerSection,
} from './components';

const tabs = [
  { value: 'general', label: 'General', icon: User },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

export const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Profile Header */}
        <div className="mb-8">
          <ProfileHeader />
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-2 bg-surface/50 p-1 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  tab.value === 'danger' ? 'data-[state=active]:text-red-500' : ''
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-6 rounded-xl border border-border bg-surface/30">
            <TabsContent value="general" className="mt-0">
              <GeneralSection />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <SecuritySection />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationsSection />
            </TabsContent>

            <TabsContent value="danger" className="mt-0">
              <DangerSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
};
