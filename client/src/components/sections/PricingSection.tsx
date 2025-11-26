import { Mail } from 'lucide-react';
import { Button } from '../ui/button';
import ElectroBorder from '../ui/electro-border';
import { cn } from '../lib/utils';

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      currency: "DT",
      description: "Perfect for hobbyists and side projects.",
      features: [
        "10 reviews / month",
        "3 projects",
        "Community support",
        "Basic analysis"
      ],
      cta: "Start for free",
      popular: false,
      color: "#94a3b8", 
      hoverShadow: "hover:shadow-slate-500/20",
      buttonClass: "bg-slate-100 text-slate-900 hover:bg-slate-200"
    },
    {
      name: "Plus",
      price: "39",
      currency: "DT",
      description: "For growing teams shipping regularly.",
      features: [
        "100 reviews / month",
        "10 projects",
        "Priority support",
        "Advanced analysis",
        "Custom rules"
      ],
      cta: "Start free trial",
      popular: true,
      color: "#6366f1", // Indigo 500
      hoverShadow: "hover:shadow-indigo-500/20",
      buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
    },
    {
      name: "Pro",
      price: "109",
      currency: "DT",
      description: "Unlimited power for scaling organizations.",
      features: [
        "Unlimited reviews",
        "Unlimited projects",
        "24/7 Dedicated support",
        "Custom security rules",
        "SSO & Audit logs"
      ],
      cta: "Contact sales",
      popular: false,
      color: "#fbbf24", // Gold (Amber 400)
      hoverShadow: "hover:shadow-amber-500/20",
      buttonClass: "bg-amber-400 text-amber-950 hover:bg-amber-500"
    }
  ];

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground">
            Start for free, upgrade when you need more power.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <div key={index} className="relative group h-full">
              <ElectroBorder
                className="h-full"
                borderColor={plan.color}
                borderWidth={4}
                radius={24}
                glow={true}
                aura={true}
                animationSpeed={0.5}
              >
                <div className={cn(
                  "relative h-full p-8 rounded-3xl bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/5 overflow-hidden flex flex-col transition-all duration-300 text-center",
                  plan.popular ? "shadow-2xl shadow-indigo-500/10" : "shadow-xl",
                  plan.hoverShadow,
                  "group-hover:-translate-y-1"
                )}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 p-4">
                      <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 uppercase tracking-wide">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-3xl font-bold text-foreground mb-2" style={{ color: plan.color }}>{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-xl font-bold text-foreground">{plan.currency}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <p className="text-muted-foreground mb-8 min-h-[48px] max-w-[240px] mx-auto">
                    {plan.description}
                  </p>

                  <div className="space-y-4 mb-10 flex-grow flex flex-col justify-center">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="text-muted-foreground text-sm font-medium">
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={cn(
                      "w-auto px-8 min-w-[180px] h-12 text-base font-semibold transition-all duration-300 mx-auto rounded-xl",
                      plan.buttonClass
                    )}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </ElectroBorder>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 mx-auto transition-colors">
            <Mail size={14} />
            Startup or Open Source? Contact us for special discounts
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
