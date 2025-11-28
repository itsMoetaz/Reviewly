import { FileCode } from 'lucide-react';

const CodeReviewPreviewSection = () => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-2xl">
          <div className="grid lg:grid-cols-3 min-h-[600px]">
            {/* Sidebar */}
            <div className="bg-background/50 border-r border-border p-6 hidden lg:block">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Files Changed</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-2 rounded-lg">
                  <FileCode size={16} />
                  <span className="text-sm font-medium">src/utils/api.ts</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground px-3 py-2">
                  <FileCode size={16} />
                  <span className="text-sm">src/components/Button.tsx</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground px-3 py-2">
                  <FileCode size={16} />
                  <span className="text-sm">package.json</span>
                </div>
              </div>
            </div>

            {/* Main Code Area */}
            <div className="lg:col-span-2 p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-sm">src/utils/api.ts</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">2 Critical Issues</span>
                </div>
              </div>

              <div className="flex-1 bg-zinc-900 rounded-xl border border-zinc-800 p-4 font-mono text-sm overflow-x-auto relative">
                <div className="space-y-1">
                  <div className="flex text-zinc-500"><span className="w-8 select-none">24</span><span>  try &#123;</span></div>
                  <div className="flex text-zinc-500"><span className="w-8 select-none">25</span><span>    const response = await fetch(url);</span></div>
                  <div className="flex text-zinc-500"><span className="w-8 select-none">26</span><span>    const data = await response.json();</span></div>
                  <div className="flex text-zinc-100 bg-red-500/10 -mx-4 px-4 border-l-2 border-red-500"><span className="w-8 select-none text-zinc-500">27</span><span>    return data;</span></div>
                  <div className="flex text-zinc-500"><span className="w-8 select-none">28</span><span>  &#125; catch (error) &#123;</span></div>
                  <div className="flex text-zinc-100 bg-red-500/10 -mx-4 px-4 border-l-2 border-red-500"><span className="w-8 select-none text-zinc-500">29</span><span>    console.log(error);</span></div>
                  <div className="flex text-zinc-500"><span className="w-8 select-none">30</span><span>  &#125;</span></div>
                </div>

                {/* Inline Comment */}
                <div className="mt-4 ml-8 bg-zinc-800 rounded-lg border border-zinc-700 p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                      <span className="font-bold text-white text-xs">AI</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-zinc-200 text-sm">Reviewly AI</span>
                        <span className="text-xs text-zinc-500">Just now</span>
                      </div>
                      <p className="text-zinc-300 text-sm mb-3">
                        Two issues found here:
                        <br/>1. Missing error handling: If the fetch fails, this function returns undefined, which might crash the caller.
                        <br/>2. Console log in production: Better to use a proper logger or re-throw the error.
                      </p>
                      <div className="bg-black/30 rounded p-2 border border-white/5">
                        <p className="text-xs text-zinc-500 mb-1">Suggested fix:</p>
                        <code className="text-xs text-green-400 block">
                          throw new ApiError('Failed to fetch data', &#123; cause: error &#125;);
                        </code>
                      </div>
                    </div>
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

export default CodeReviewPreviewSection;
