import { useState } from 'react';
import { GitMerge, Settings, Zap, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import ShinyText from '../ui/shiny-text';

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: "01",
      title: "Connect your repos",
      description: "Link your GitHub or GitLab repositories in a few clicks. We support both public and private repos.",
      icon: Settings,
      details: [
        "OAuth authentication",
        "Support for organizations",
        "Automatic webhook setup"
      ],
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      number: "02",
      title: "Open a Pull Request",
      description: "Work as usual. When you open a PR, Reviewly automatically detects the changes and starts analyzing.",
      icon: GitMerge,
      details: [
        "Instant PR detection",
        "Diff analysis",
        "Context-aware review"
      ],
      gradient: "from-purple-500 to-pink-600"
    },
    {
      number: "03",
      title: "Get AI Feedback",
      description: "Within minutes, you'll receive a detailed review with code suggestions, bug detections, and improvements.",
      icon: Zap,
      details: [
        "Line-by-line comments",
        "Security vulnerability detection",
        "Performance recommendations"
      ],
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden bg-gradient-to-b from-transparent via-surface/30 to-transparent">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, rgb(99, 102, 241, 0.1) 1px, transparent 1px),
                           linear-gradient(to bottom, rgb(99, 102, 241, 0.1) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem'
        }} />
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium uppercase tracking-wider mb-6">
            <Zap size={14} />
            How it works
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Get started in{' '}
            <ShinyText 
              size="5xl"
              baseColor="rgba(168, 85, 247, 0.4)"
              shineColor="rgba(236, 72, 153, 0.9)"
              speed={2}
            >
              3 simple steps
            </ShinyText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Seamlessly integrates into your existing workflow. No new tools to learn, no complex setup.
          </p>
        </div>

        {/* Steps - Desktop Timeline */}
        <div className="hidden lg:block relative">
          {/* Connecting animated line */}
          <div className="absolute top-24 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: `${((activeStep + 1) / steps.length) * 100}%`, transition: 'width 0.5s ease' }} />
          </div>

          <div className="grid grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative pt-16 cursor-pointer group"
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Number Badge */}
                <div className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl flex items-center justify-center z-10 shadow-2xl transition-all duration-500 border-2",
                  activeStep === index 
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent scale-110" 
                    : "bg-surface border-border group-hover:scale-105"
                )}>
                  {activeStep > index ? (
                    <Check size={32} className="text-white" />
                  ) : (
                    <span className={cn(
                      "text-2xl font-bold transition-colors duration-300",
                      activeStep === index ? "text-white" : "text-indigo-400"
                    )}>
                      {step.number}
                    </span>
                  )}
                </div>

                {/* Card */}
                <div className={cn(
                  "relative mt-8 p-6 rounded-2xl border transition-all duration-500",
                  activeStep === index 
                    ? "bg-surface border-indigo-500/50 shadow-2xl shadow-indigo-500/20" 
                    : "bg-surface/50 border-border group-hover:border-indigo-500/30"
                )}>
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-4 transition-transform duration-300",
                    step.gradient,
                    activeStep === index && "scale-110"
                  )}>
                    <step.icon size={24} />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Details list */}
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps - Mobile/Tablet Vertical */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-indigo-500/20 to-purple-500/20" />
              )}

              <div className="flex gap-6">
                {/* Number Badge */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <span className="text-xl font-bold text-white">{step.number}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="p-6 rounded-2xl bg-surface border border-border">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-4",
                      step.gradient
                    )}>
                      <step.icon size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {step.description}
                    </p>

                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
