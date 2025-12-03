import axiosInstance from "@/utils/axiosConfig";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface CheckoutResponse {
  checkout_url: string;
}

export interface PortalResponse {
  portal_url: string;
}

export interface SubscriptionStatus {
  status: string;
  tier: string;
  cancel_at_period_end: boolean;
  current_period_end: number | null;
}

export interface UsageStats {
  tier: string;
  ai_reviews: {
    used: number;
    limit: number;
    unlimited: boolean;
    percentage: number;
  };
  resets_at: string;
}

export interface StripeConfig {
  publishable_key: string;
}

export interface SubscriptionActionResponse {
  status: string;
  message: string;
  tier?: string;
  cancel_at?: number;
}

export const paymentApi = {
  /**
   * Get Stripe publishable key
   */
  getConfig: async (): Promise<StripeConfig> => {
    const response = await axiosInstance.get(`${API_URL}/api/payments/config`);
    return response.data;
  },

  /**
   * Create a Stripe Checkout session for subscription purchase
   * @param tier - The subscription tier to purchase ('plus' or 'pro')
   * @returns The checkout URL to redirect the user to
   */
  createCheckoutSession: async (tier: "plus" | "pro"): Promise<string> => {
    const response = await axiosInstance.post<CheckoutResponse>(
      `${API_URL}/api/payments/create-checkout-session`,
      { tier }
    );
    return response.data.checkout_url;
  },

  /**
   * Create a Stripe Customer Portal session for subscription management
   * @returns The portal URL to redirect the user to
   */
  createPortalSession: async (): Promise<string> => {
    const response = await axiosInstance.post<PortalResponse>(
      `${API_URL}/api/payments/create-portal-session`
    );
    return response.data.portal_url;
  },

  /**
   * Get current subscription status
   */
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await axiosInstance.get<SubscriptionStatus>(
      `${API_URL}/api/payments/subscription`
    );
    return response.data;
  },

  /**
   * Get current usage stats (reviews used, limits, etc.)
   */
  getUsageStats: async (): Promise<UsageStats> => {
    const response = await axiosInstance.get<UsageStats>(
      `${API_URL}/api/subscription/status`
    );
    return response.data;
  },

  /**
   * Cancel subscription
   * @param immediate - If true, cancel immediately; otherwise cancel at period end
   */
  cancelSubscription: async (immediate: boolean = false): Promise<SubscriptionActionResponse> => {
    const response = await axiosInstance.post<SubscriptionActionResponse>(
      `${API_URL}/api/payments/cancel`,
      { immediate }
    );
    return response.data;
  },

  /**
   * Reactivate a subscription that was set to cancel
   */
  reactivateSubscription: async (): Promise<SubscriptionActionResponse> => {
    const response = await axiosInstance.post<SubscriptionActionResponse>(
      `${API_URL}/api/payments/reactivate`
    );
    return response.data;
  },

  /**
   * Switch subscription to a different tier
   * @param newTier - The new tier to switch to ('plus' or 'pro')
   */
  switchSubscription: async (newTier: 'plus' | 'pro'): Promise<SubscriptionActionResponse> => {
    const response = await axiosInstance.post<SubscriptionActionResponse>(
      `${API_URL}/api/payments/switch`,
      { new_tier: newTier }
    );
    return response.data;
  },
};
