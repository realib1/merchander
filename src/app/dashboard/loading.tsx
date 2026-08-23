export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-secondary animate-pulse">Loading dashboard...</p>
      </div>
    </div>
  );
}
