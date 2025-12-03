import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUser } = useAuthStore();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh user data to get updated subscription tier
    if (sessionId) {
      fetchUser();
    }
  }, [sessionId, fetchUser]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          
          {/* Sparkles */}
          <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute bottom-4 left-1/4 w-4 h-4 text-yellow-400 animate-pulse delay-150" />
          <Sparkles className="absolute top-8 left-1/3 w-5 h-5 text-yellow-400 animate-pulse delay-300" />
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Welcome to Premium! 🎉
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          Your subscription has been activated successfully. 
          You now have access to all premium features!
        </p>

        {/* Features highlight */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-foreground mb-4">What's unlocked:</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Enhanced AI code reviews</span>
            </li>
            <li className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Priority support</span>
            </li>
            <li className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>More projects & reviews per month</span>
            </li>
            <li className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Advanced security analysis</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/home')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/profile')}
          >
            View Profile
          </Button>
        </div>

        {/* Receipt note */}
        <p className="text-sm text-muted-foreground mt-8">
          A confirmation email with your receipt has been sent to your email address.
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
