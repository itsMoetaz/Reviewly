import TopNavigation from '../components/shared/TopNavigation';
import HeroSection from '../components/sections/HeroSection';
import ProblemSection from '../components/sections/ProblemSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import CodeReviewPreviewSection from '../components/sections/CodeReviewPreviewSection';
import PricingSection from '../components/sections/PricingSection';
import FAQSection from '../components/sections/FAQSection';
import { CTASection, Footer } from '../components/sections/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
      <TopNavigation />
      
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CodeReviewPreviewSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
