import { AppLayout } from '@/components/layouts/AppLayout';
import { useAuthStore } from '@/store/authStore';

export const DashboardPage = () => {
  const { user } = useAuthStore();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your code reviews today.
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-colors">
            <h3 className="font-semibold text-foreground mb-2">Recent Reviews</h3>
            <p className="text-3xl font-bold text-indigo-500 mb-2">12</p>
            <p className="text-sm text-muted-foreground">In the last 7 days</p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-colors">
            <h3 className="font-semibold text-foreground mb-2">Active PRs</h3>
            <p className="text-3xl font-bold text-purple-500 mb-2">5</p>
            <p className="text-sm text-muted-foreground">Awaiting review</p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-colors">
            <h3 className="font-semibold text-foreground mb-2">Time Saved</h3>
            <p className="text-3xl font-bold text-green-500 mb-2">8.5h</p>
            <p className="text-sm text-muted-foreground">This month</p>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="mt-12 p-8 rounded-lg border border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Dashboard Coming Soon
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We're building an amazing dashboard experience for you. Stay tuned for real-time analytics, PR insights, and more!
          </p>
        </div>
      </div>
    </AppLayout>
  );
};
