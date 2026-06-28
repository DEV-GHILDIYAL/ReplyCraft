export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full bg-rc-bg animate-pulse">
      {/* Sidebar Skeleton (hidden on small screens) */}
      <div className="hidden lg:flex w-64 flex-col border-r border-rc-border bg-rc-card/50 shrink-0 p-4">
        <div className="h-16 flex items-center border-b border-rc-border/50 mb-6 px-2">
          <div className="h-8 w-8 bg-rc-border rounded-lg mr-2"></div>
          <div className="h-6 w-32 bg-rc-border rounded-lg"></div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 w-full bg-rc-border/30 rounded-xl"></div>
          ))}
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b border-rc-border bg-rc-card/30 px-6 flex items-center justify-between">
          <div className="h-6 w-32 bg-rc-border/50 rounded-lg"></div>
          <div className="flex gap-4 items-center">
            <div className="h-8 w-8 bg-rc-border/30 rounded-lg"></div>
            <div className="h-9 w-9 bg-rc-accent/20 rounded-xl"></div>
          </div>
        </div>
        <div className="p-6 lg:p-8 space-y-8 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center">
             <div className="space-y-2">
               <div className="h-8 w-48 bg-rc-card rounded-lg"></div>
               <div className="h-4 w-64 bg-rc-card rounded-md"></div>
             </div>
             <div className="h-10 w-32 bg-rc-card rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-rc-card border border-rc-border rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
