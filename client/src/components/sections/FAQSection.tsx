import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

const FAQSection = () => {
  const faqs = [
    {
      question: "How does CodeReview AI integrate with GitHub and GitLab?",
      answer: "We use standard OAuth integration. Once you authorize Reviewly, we install a webhook that listens for pull request events. When a PR is opened or updated, we automatically trigger a review."
    },
    {
      question: "Does it replace human code review?",
      answer: "No. Reviewly is designed to be a co-pilot. It catches bugs, style issues, and security vulnerabilities so humans can focus on architecture, logic, and business requirements."
    },
    {
      question: "Can we control which repositories it can access?",
      answer: "Absolutely. During the installation process, you can select specific repositories to grant access to. You can change this at any time."
    },
    {
      question: "Is my code safe and private?",
      answer: "Yes. We do not store your code. We only analyze the diffs in real-time and discard the data immediately after generating the review. We are SOC2 compliant."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-surface/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Frequently asked questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border border-border rounded-lg bg-surface/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-surface transition-colors"
              >
                <span className="font-medium text-foreground">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="text-muted-foreground" />
                ) : (
                  <ChevronDown className="text-muted-foreground" />
                )}
              </button>
              
              <div 
                className={cn(
                  "px-6 text-muted-foreground overflow-hidden transition-all duration-300 ease-in-out",
                  openIndex === index ? "max-h-48 pb-6 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
