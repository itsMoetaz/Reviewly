import React from 'react';
import { Clock, AlertTriangle, GitPullRequest, Zap } from 'lucide-react';
import Marquee from '../ui/marquee';

const ProblemSection = () => {
  const problems = [
    {
      icon: GitPullRequest,
      title: "Drowning in PRs",
      description: "Tech leads spend 30% of their time reviewing code instead of building."
    },
    {
      icon: AlertTriangle,
      title: "Inconsistent Quality",
      description: "Manual reviews miss subtle bugs and security vulnerabilities."
    },
    {
      icon: Clock,
      title: "Slow Feedback Loops",
      description: "Developers wait days for feedback, slowing down the entire team."
    },
    {
      icon: Zap,
      title: "Context Switching",
      description: "Constant interruptions for reviews break flow state and reduce productivity."
    }
  ];

  return (
    <section className="py-12 border-y border-border bg-surface/50 backdrop-blur-sm overflow-hidden">
      <div className="max-w-full">
        <Marquee pauseOnHover className="[--duration:20s]">
          {problems.map((problem, index) => (
            <div key={index} className="flex items-start gap-4 mx-8 w-[300px] md:w-[400px] shrink-0">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <problem.icon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{problem.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
};

export default ProblemSection;
