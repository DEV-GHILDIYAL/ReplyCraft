export default function ResponsesLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-rc-card rounded-lg"></div>
          <div className="h-4 w-64 bg-rc-card rounded-md mt-2"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-rc-border flex gap-6 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-24 bg-rc-card rounded-lg"></div>
        ))}
      </div>

      {/* Responses List */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-rc-border bg-rc-card/35 flex flex-col lg:flex-row gap-6 justify-between">
            {/* Review Context (Left) */}
            <div className="lg:w-1/2 space-y-3">
              <div className="flex justify-between items-start">
                 <div className="space-y-2">
                   <div className="h-4 w-24 bg-rc-border/50 rounded"></div>
                   <div className="h-3 w-16 bg-rc-border/30 rounded"></div>
                 </div>
                 <div className="h-4 w-16 bg-rc-border/50 rounded"></div>
              </div>
              <div className="h-24 w-full bg-rc-bg border border-rc-border/50 rounded-xl"></div>
            </div>

            {/* Draft Reply (Right) */}
            <div className="lg:w-1/2 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-rc-border/50 rounded"></div>
                  <div className="h-4 w-20 bg-rc-border/30 rounded"></div>
                </div>
                <div className="h-24 w-full bg-rc-bg/30 border border-rc-border rounded-xl"></div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="h-8 w-24 bg-rc-border/40 rounded-lg"></div>
                <div className="h-8 w-24 bg-rc-accent/20 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
