import { Button } from '../ui/button';
import ShinyText from '../ui/shiny-text';
import { BorderBeam } from '../ui/border-beam';
import InteractiveGridBackground from '../ui/interactive-grid-background';
import { ArrowRight, GitPullRequest, AlertCircle, Check } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import GradientButton from '../ui/gradient-button';
import { TrustedUsers } from '../ui/trusted-users';

const HeroSection = () => {
  const theme = useThemeStore((state) => state.theme);
  const isLightMode = theme === 'light';

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Interactive Grid Background */}
      <div className="absolute inset-0 pointer-events-none">
        <InteractiveGridBackground
          className="w-full h-full"
          gridSize={60}
          darkGridColor={isLightMode ? "rgba(53, 82, 176, 0.14)" : "#1e1b4b"}
          darkEffectColor="#818cf866"
          trailLength={5}
          idleSpeed={0.01}
          glow={true}
          glowRadius={30}
          showFade={true}
          fadeIntensity={25}
          idleRandomCount={5}
        />
      </div>
      
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-500/30 via-purple-500/20 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-purple-500/20 dark:bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[350px] h-[350px] bg-indigo-500/25 dark:bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Content */}
          <div className="flex flex-col items-start text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              New · AI-first code review
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
              Ship better code <br />
              <ShinyText 
                size='6xl'
                baseColor="rgba(11, 105, 255, 0.4)"
                shineColor="rgba(147, 51, 234, 0.9)"
                speed={2}
                
              >
                in minutes.
              </ShinyText>
            </h1>

            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Connect Reviewly to GitHub or GitLab. Let AI analyze your PRs, catch bugs, and summarize changes before you even look.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
<GradientButton 
  size="lg" 
  className="hover:!bg-gray-700 dark:hover:!bg-gray-300 text-white h-12 px-8 text-base"
>                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </GradientButton>
              <Button variant="ghost" size="lg" className="h-12 px-8 text-base border border-border/50 hover:!bg-indigo-300 dark:hover:!bg-indigo-500">
                View sample review
              </Button>
            </div>

            <TrustedUsers 
              avatars={[
                'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
              ]}
              rating={5}
              totalUsersText={1200}
              caption="Trusted by"
              className="pt-4"
            />
          </div>

          {/* Right Column: Product Preview */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative rounded-xl bg-surface border border-border shadow-2xl overflow-hidden">
              <BorderBeam size={300} duration={10} delay={5} colorFrom="#6366f1" colorTo="#a855f7" />
              
              {/* Fake Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="ml-4 text-xs text-zinc-500 font-mono">reviewly.app/prs/128</div>
              </div>

              {/* Fake Content */}
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                      <GitPullRequest size={14} />
                      <span>feature/optimize-rendering</span>
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-400">Optimize list rendering performance</h3>
                  </div>
                  <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20">
                    Review Pending
                  </span>
                </div>

                {/* AI Summary Card */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <span className="text-xs font-bold">AI</span>
                    </div>
                    <span className="text-sm font-medium text-indigo-300">Review Summary</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-zinc-400">Critical: Potential memory leak in <code className="text-xs bg-zinc-800 px-1 py-0.5 rounded">useDataFetcher</code> hook.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-zinc-400">High: Missing error boundary for async components.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-zinc-400">Style: Follows project conventions.</p>
                    </div>
                  </div>
                </div>

                {/* Code Snippet */}
                <div className="bg-zinc-900 rounded-lg p-4 font-mono text-xs overflow-hidden relative">
                  <div className="absolute left-0 top-12 w-full h-6 bg-red-500/10 border-l-2 border-red-500 pointer-events-none" />
                  <div className="space-y-1 text-zinc-400">
                    <div className="flex"><span className="w-6 text-zinc-600 select-none">12</span><span>export const DataList = () =&gt; &#123;</span></div>
                    <div className="flex"><span className="w-6 text-zinc-600 select-none">13</span><span>  const [items, setItems] = useState([]);</span></div>
                    <div className="flex text-zinc-100"><span className="w-6 text-zinc-600 select-none">14</span><span>  useEffect(() =&gt; &#123;</span></div>
                    <div className="flex text-zinc-100"><span className="w-6 text-zinc-600 select-none">15</span><span>    window.addEventListener('scroll', loadMore);</span></div>
                    <div className="flex text-zinc-100"><span className="w-6 text-zinc-600 select-none">16</span><span>  &#125;, []); // Missing cleanup!</span></div>
                    <div className="flex"><span className="w-6 text-zinc-600 select-none">17</span><span>  return &lt;div&gt;...&lt;/div&gt;;</span></div>
                    <div className="flex"><span className="w-6 text-zinc-600 select-none">18</span><span>&#125;;</span></div>
                  </div>
                  
                  {/* AI Comment Bubble */}
                  <div className="absolute top-10 right-4 bg-zinc-800 border border-zinc-700 shadow-xl rounded-lg p-3 w-48 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-1000 fill-mode-forwards opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-[10px] font-medium text-zinc-400">Memory Leak</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 leading-tight">
                      You need to remove the event listener in the cleanup function.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
