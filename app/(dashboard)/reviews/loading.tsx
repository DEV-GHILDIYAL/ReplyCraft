export default function ReviewsLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-rc-card rounded-lg"></div>
          <div className="h-4 w-64 bg-rc-card rounded-md mt-2"></div>
        </div>
        <div className="h-10 w-40 bg-rc-card rounded-xl shrink-0"></div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-rc-border bg-rc-card/20 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="h-10 w-full md:w-80 bg-rc-card rounded-lg"></div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="h-10 w-full sm:w-32 bg-rc-card rounded-lg"></div>
          <div className="h-10 w-full sm:w-32 bg-rc-card rounded-lg"></div>
          <div className="h-10 w-full sm:w-32 bg-rc-card rounded-lg"></div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-rc-border bg-rc-card/40 flex flex-col justify-between space-y-4 h-64">
            <div className="flex justify-between items-start">
               <div className="flex gap-3 items-center">
                 <div className="h-8 w-8 rounded-lg bg-rc-bg"></div>
                 <div className="space-y-2">
                   <div className="h-4 w-24 bg-rc-border/50 rounded"></div>
                   <div className="h-3 w-16 bg-rc-border/30 rounded"></div>
                 </div>
               </div>
               <div className="h-4 w-16 bg-rc-border/50 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-rc-border/30 rounded"></div>
              <div className="h-4 w-5/6 bg-rc-border/30 rounded"></div>
              <div className="h-4 w-4/6 bg-rc-border/30 rounded"></div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-rc-border/50">
               <div className="h-8 w-20 bg-rc-border/40 rounded-lg"></div>
               <div className="h-8 w-24 bg-rc-border/40 rounded-lg"></div>
               <div className="h-8 w-24 bg-rc-accent/20 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
