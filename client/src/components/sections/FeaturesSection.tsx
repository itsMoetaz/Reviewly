import { GitBranch, Sparkles, Shield, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { BorderBeam } from '../ui/border-beam';
import ShinyText from '../ui/shiny-text';

const FeaturesSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Analysis",
      description: "Our LLMs analyze every line of code, understanding context and logic to catch bugs that linters miss.",
      gradient: "from-indigo-500 to-purple-600",
      glowColor: "indigo",
      stats: "99.9% accuracy"
    },
    {
      icon: GitBranch,
      title: "GitHub & GitLab",
      description: "Seamless integration with your existing workflow. Connect your repositories in seconds.",
      gradient: "from-purple-500 to-pink-600",
      glowColor: "purple",
      stats: "2-min setup"
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Detects potential security vulnerabilities and suggests fixes before they reach production.",
      gradient: "from-pink-500 to-rose-600",
      glowColor: "pink",
      stats: "CVE detection"
    },
    {
      icon: MessageSquare,
      title: "Human-Like Feedback",
      description: "Comments are written in natural language, explaining the 'why' behind every suggestion.",
      gradient: "from-violet-500 to-indigo-600",
      glowColor: "violet",
      stats: "Natural language"
    }
  ];

  return (
    <section id="features" className="py-32 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium uppercase tracking-wider mb-6">
            <Sparkles size={14} />
            Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Built for modern{' '}
            <ShinyText 
              size="5xl"
              baseColor="rgba(99, 102, 241, 0.4)"
              shineColor="rgba(147, 51, 234, 0.9)"
              speed={2}
            >
              engineering teams
            </ShinyText>
          </h2>
          <p className="text-xl text-muted-foreground">
            Reviewly isn't just a linter. It's an intelligent teammate that helps you ship higher quality code, faster.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border hover:border-indigo-500/50 transition-all duration-500 overflow-hidden">
                {/* BorderBeam effect */}
                <BorderBeam 
                  size={250} 
                  duration={12 + index * 2} 
                  delay={index * 2}
                  colorFrom="#6366f1" 
                  colorTo="#a855f7" 
                />
                
                {/* Gradient overlay on hover */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                  feature.gradient
                )} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon with animated background */}
                  <div className="relative w-16 h-16 mb-6">
                    <div className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-xl",
                      feature.gradient
                    )} />
                    <div className={cn(
                      "relative w-full h-full rounded-2xl bg-gradient-to-br flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300",
                      feature.gradient
                    )}>
                      <feature.icon size={28} />
                    </div>
                  </div>

                  {/* Stats badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    {feature.stats}
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Learn more link */}
                  <button className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors group/btn">
                    Learn more
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            And many more features to help you ship better code
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {['Real-time collaboration', 'Custom rules', 'Team analytics', 'Slack integration'].map((item, i) => (
              <div key={i} className="px-3 py-1.5 rounded-full bg-surface border border-border text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
