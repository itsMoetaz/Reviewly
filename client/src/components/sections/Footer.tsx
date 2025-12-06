import { Button } from '../ui/button';
import { ArrowRight, Github, Linkedin } from 'lucide-react';

import BeamGridBackground from '../ui/beam-grid-background';

export const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <BeamGridBackground 
        className="absolute inset-0 z-0"
        gridSize={60}
        beamSpeed={0.01}
        beamThickness={2}
        beamColor="rgba(99, 102, 241, 0.6)" // Indigo-500
        darkBeamColor="rgba(129, 140, 248, 0.6)" // Indigo-400
        gridColor="rgba(99, 102, 241, 0.1)"
        darkGridColor="rgba(255, 255, 255, 0.05)"
        interactive={true}
      />
      
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 tracking-tight">
          Ready to ship better code reviews?
        </h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join engineering teams who are saving hours every week with AI-powered code analysis.
        </p>
        <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-14 px-8 text-lg rounded-full shadow-xl shadow-indigo-500/10">
          Get started in 2 minutes
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
};

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              R
            </div>
            <span className="text-sm font-semibold text-muted-foreground">© {new Date().getFullYear()} CodeReview AI</span>
          </div>
          
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Status</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/itsMoetaz" className="text-muted-foreground hover:text-foreground transition-colors"><Github size={18} /></a>
            <a href="https://www.linkedin.com/in/benkhedhermoetaz" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};
