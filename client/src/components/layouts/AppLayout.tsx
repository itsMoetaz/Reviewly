import { AppNav } from '@/components/navigation/AppNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};
