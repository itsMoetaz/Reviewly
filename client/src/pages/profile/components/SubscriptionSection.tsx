import { useState, useEffect } from 'react';
import { Crown, Zap, Sparkles, Check, Loader2, CreditCard, Calendar, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { paymentApi, type SubscriptionStatus } from '@/core/api/paymentApi';
import toast from 'react-hot-toast';

const plans = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for hobbyists and side projects',
    features: ['10 AI reviews / month', '3 projects', 'Community support', 'Basic analysis'],
    icon: Sparkles,
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-400',
  },
  {
    tier: 'plus',
    name: 'Plus',
    price: 29,
    description: 'For growing teams shipping regularly',
    features: ['100 AI reviews / month', '10 projects', 'Priority support', 'Advanced analysis', 'Custom rules'],
    icon: Zap,
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 49,
    description: 'Unlimited power for scaling organizations',
    features: ['Unlimited AI reviews', 'Unlimited projects', '24/7 Dedicated support', 'Custom security rules', 'SSO & Audit logs'],
    icon: Crown,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
  },
];

const SubscriptionSection = () => {
  const { user, fetchUser } = useAuthStore();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [changingTo, setChangingTo] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const currentTier = user?.subscription_tier?.toLowerCase() || 'free';

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        if (currentTier !== 'free') {
          const status = await paymentApi.getSubscriptionStatus();
          setSubscriptionStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [currentTier]);

  const handleChangePlan = async (tier: string) => {
    if (tier === currentTier) return;

    setChangingTo(tier);

    try {
      if (tier === 'free') {
        // Cancel subscription (at period end)
        const result = await paymentApi.cancelSubscription(false);
        toast.success(result.message);
        // Refresh subscription status
        const status = await paymentApi.getSubscriptionStatus();
        setSubscriptionStatus(status);
        setChangingTo(null);
        return;
      }

      // Check if subscription is canceled - if so, create new checkout
      const isCanceled = subscriptionStatus?.status === 'canceled';

      // For upgrading or changing paid plans
      if (currentTier !== 'free' && !isCanceled) {
        // Already has an active subscription - switch plan directly
        try {
          const result = await paymentApi.switchSubscription(tier as 'plus' | 'pro');
          toast.success(result.message);
          // Refresh user data and subscription status
          await fetchUser();
          const status = await paymentApi.getSubscriptionStatus();
          setSubscriptionStatus(status);
          setChangingTo(null);
        } catch (switchError: unknown) {
          // If switch fails due to canceled subscription, create new checkout
          const errorMsg = switchError instanceof Error ? switchError.message : String(switchError);
          if (errorMsg.includes('canceled') || errorMsg.includes('cancel')) {
            toast('Creating new subscription...', { icon: '🔄' });
            const checkoutUrl = await paymentApi.createCheckoutSession(tier as 'plus' | 'pro');
            window.location.href = checkoutUrl;
          } else {
            throw switchError;
          }
        }
      } else {
        // New subscription or canceled - create checkout session
        const checkoutUrl = await paymentApi.createCheckoutSession(tier as 'plus' | 'pro');
        window.location.href = checkoutUrl;
      }
    } catch (error: unknown) {
      console.error('Failed to change plan:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to change plan. Please try again.';
      toast.error(errorMsg);
      setChangingTo(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }

    setIsCanceling(true);
    try {
      const result = await paymentApi.cancelSubscription(false);
      toast.success(result.message);
      // Refresh subscription status
      const status = await paymentApi.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to cancel:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    try {
      const result = await paymentApi.reactivateSubscription();
      toast.success(result.message);
      // Refresh subscription status
      const status = await paymentApi.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to reactivate:', error);
      toast.error('Failed to reactivate subscription');
    } finally {
      setIsReactivating(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Status */}
      {currentTier !== 'free' && subscriptionStatus && (
        <div className="p-4 rounded-xl border border-border bg-surface/50">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Current Subscription</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentTier === 'pro' ? 'bg-amber-500/20' : 'bg-purple-500/20'}`}>
                <CreditCard className={`w-4 h-4 ${currentTier === 'pro' ? 'text-amber-400' : 'text-purple-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium text-foreground capitalize">{subscriptionStatus.status}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentTier === 'pro' ? 'bg-amber-500/20' : 'bg-purple-500/20'}`}>
                <Calendar className={`w-4 h-4 ${currentTier === 'pro' ? 'text-amber-400' : 'text-purple-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Billing</p>
                <p className="font-medium text-foreground">{formatDate(subscriptionStatus.current_period_end)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {!subscriptionStatus.cancel_at_period_end && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="gap-2 text-red-500 hover:text-red-600 hover:border-red-500/50"
                >
                  {isCanceling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {subscriptionStatus.cancel_at_period_end && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-500">Subscription Canceling</p>
                  <p className="text-xs text-muted-foreground">
                    Your subscription will end on {formatDate(subscriptionStatus.current_period_end)}. 
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isReactivating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Reactivate
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Plan Selection */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {currentTier === 'free' ? 'Choose a Plan' : 'Change Plan'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = plan.tier === currentTier;
            const Icon = plan.icon;
            
            return (
              <div
                key={plan.tier}
                className={`relative p-5 rounded-xl border-2 transition-all ${
                  isCurrentPlan
                    ? `${plan.borderColor} ${plan.bgColor}`
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                {isCurrentPlan && (
                  <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded-full text-xs font-bold ${plan.bgColor} ${plan.textColor} border ${plan.borderColor}`}>
                    Current Plan
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.gradient}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-bold text-foreground">{plan.name}</h4>
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className={`w-4 h-4 ${plan.textColor}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    isCurrentPlan
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90`
                  }`}
                  disabled={isCurrentPlan || changingTo !== null}
                  onClick={() => handleChangePlan(plan.tier)}
                >
                  {changingTo === plan.tier ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.tier === 'free' ? (
                    'Downgrade'
                  ) : currentTier === 'free' ? (
                    'Upgrade'
                  ) : plan.price > plans.find(p => p.tier === currentTier)!.price ? (
                    'Upgrade'
                  ) : (
                    'Switch'
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Note */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> When you upgrade, you'll be charged the prorated amount for the remainder of your billing cycle. 
          When downgrading, the change will take effect at the end of your current billing period.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSection;
