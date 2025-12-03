import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CheckoutCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
            <XCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Checkout Cancelled
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          Your payment was cancelled. Don't worry, you weren't charged anything.
        </p>

        {/* Info box */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Changed your mind?</h3>
              <p className="text-sm text-muted-foreground">
                That's okay! You can continue using the free plan or upgrade anytime 
                when you're ready. All your projects and data are safe.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Go Back
          </Button>
          
          <Button 
            onClick={() => navigate('/home')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          >
            Continue to Dashboard
          </Button>
        </div>

        {/* Support note */}
        <p className="text-sm text-muted-foreground mt-8">
          Have questions about our plans?{' '}
          <a href="mailto:support@reviewly.com" className="text-indigo-500 hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
};

export default CheckoutCancelPage;
