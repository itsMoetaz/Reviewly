import { useState } from 'react';
import { lazy, Suspense } from "react";
import { User, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const ProfileHeader = lazy(() => import("./components/ProfileHeader"));
const GeneralSection = lazy(() => import("./components/GeneralSection"));
const SecuritySection = lazy(() => import("./components/SecuritySection"));
const DangerSection = lazy(() => import("./components/DangerSection"));

const tabs = [
  { value: 'general', label: 'General', icon: User },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

  const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  const ProfileLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Profile Header */}
        <div className="mb-8">
          <Suspense fallback={<ProfileLoader />}>
            <ProfileHeader />
          </Suspense>
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
              <Suspense fallback={<ProfileLoader />}>
                <GeneralSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <Suspense fallback={<ProfileLoader />}>
                <SecuritySection />
              </Suspense>
            </TabsContent>

            <TabsContent value="danger" className="mt-0">
              <Suspense fallback={<ProfileLoader />}>
                <DangerSection />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;

