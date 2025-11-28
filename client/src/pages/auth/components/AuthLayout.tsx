import InteractiveGridBackground from "@/components/ui/interactive-grid-background";
import { useThemeStore } from "@/store/themeStore";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => {
  const theme = useThemeStore((state) => state.theme);
  const isLightMode = theme === "light";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden">
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

      {/* Left side - World-Class Visual Experience */}
      <div className="hidden lg:flex flex-col justify-center p-16 relative z-10 h-full overflow-hidden">
        {/* Deep Atmospheric Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.08),transparent_70%)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          
          {/* Header Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/10 backdrop-blur-md shadow-xl">
                <img src="/rev-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-lg opacity-50" />
              </div>
              <span className="text-2xl font-bold text-foreground tracking-tight">Reviewly</span>
            </div>

            <div className="max-w-xl">
              <h1 className="text-5xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
                The new standard for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient">
                  automated code review
                </span>
              </h1>
            </div>
          </div>

          {/* 3D Isometric Code Scanner Visualization */}
          <div className="relative w-full max-w-2xl mx-auto perspective-1000 group mt-0 mb-20">
            {/* The 3D Card */}
            <div className="relative transform rotate-y-[-12deg] rotate-x-[10deg] scale-110 transition-transform duration-700 ease-out group-hover:rotate-y-[-8deg] group-hover:rotate-x-[5deg] group-hover:scale-115">
              
              {/* Card Glow/Shadow */}
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl -z-10 transform translate-y-10 scale-90" />
              
              {/* Main Interface Window */}
              <div className="relative rounded-xl border border-white/10 shadow-2xl">
                {/* Background & Clipping Layer */}
                <div className="absolute inset-0 bg-[#0f1117]/90 backdrop-blur-xl rounded-xl overflow-hidden" />

                {/* Content Layer */}
                <div className="relative z-10">
                  {/* Window Header */}
                  <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/5">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="mx-auto text-xs font-mono text-muted-foreground opacity-50">auth_service.ts</div>
                  </div>

                  {/* Code Content Area */}
                  <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed text-gray-300 relative">
                    
                    {/* Scanning Beam Effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-b-xl">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-scan" />
                      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-indigo-500/10 to-transparent animate-scan" />
                    </div>

                    {/* Code Lines */}
                    <div className="space-y-1">
                      <div className="flex">
                        <span className="w-6 text-gray-700 select-none">1</span>
                        <span className="text-purple-400">class</span> <span className="text-yellow-200">AuthService</span> <span className="text-gray-400">implements</span> <span className="text-yellow-200">IAuth</span> {"{"}
                      </div>
                      <div className="flex">
                        <span className="w-6 text-gray-700 select-none">2</span>
                        <span className="pl-4 text-purple-400">async</span> <span className="text-blue-400">validate</span>(token: <span className="text-yellow-200">string</span>) {"{"}
                      </div>
                      
                      {/* Buggy Line with Error Highlight */}
                      <div className="flex relative group/line">
                        <div className="absolute inset-0 bg-red-500/10 border-l-2 border-red-500 opacity-0 animate-pulse-slow" style={{ animationDelay: '2s', opacity: 1 }} />
                        <span className="w-6 text-gray-700 select-none">3</span>
                        <span className="pl-8 text-purple-400">const</span> user = <span className="text-purple-400">await</span> db.<span className="text-blue-400">find</span>(token);
                      </div>

                      <div className="flex">
                        <span className="w-6 text-gray-700 select-none">4</span>
                        <span className="pl-8 text-purple-400">if</span> (!user) <span className="text-purple-400">throw</span> <span className="text-purple-400">new</span> <span className="text-yellow-200">Error</span>();
                      </div>
                      <div className="flex">
                        <span className="w-6 text-gray-700 select-none">5</span>
                        <span className="pl-8 text-purple-400">return</span> user;
                      </div>
                      <div className="flex">
                        <span className="w-6 text-gray-700 select-none">6</span>
                        <span className="pl-4">{"}"}</span>
                      </div>
                      <div className="flex">
                        <span className="w-6 text-gray-700 select-none">7</span>
                        <span>{"}"}</span>
                      </div>
                    </div>

                    {/* Floating AI Analysis Card */}
                    <div className="absolute top-20 right-4 w-64 bg-[#1a1d24] rounded-lg border border-indigo-500/30 shadow-2xl p-3 transform translate-x-4 translate-y-2 animate-float z-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">AI Analysis</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        <span className="text-red-400 font-bold">Critical Security Risk:</span> Direct database query with unvalidated token. Use <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">sanitize(token)</code> before query execution.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-[85%] animate-pulse" />
                        </div>
                        <span className="text-[10px] text-indigo-400">85% Confidence</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
            {[
              { label: "Code Coverage", value: "99.9%" },
              { label: "Review Time", value: "< 2min" },
              { label: "False Positives", value: "~0%" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img
              src="/rev-logo.png"
              alt="Reviewly Logo"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground">Reviewly</h1>
          </div>

          <h2 className="text-3xl font-bold mb-2 text-foreground">{title}</h2>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
};
