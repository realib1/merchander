export default function SettingsLoading() {
  return (
    <div className="max-w-3xl space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-surface-elevated rounded-md" />
        <div className="h-4 w-72 bg-surface-elevated rounded-md" />
      </div>

      <div className="rounded-lg border border-separator bg-surface p-6 space-y-6">
        <div className="space-y-2 pb-4 border-b border-separator/50">
          <div className="h-6 w-40 bg-surface-elevated rounded-md" />
          <div className="h-3 w-64 bg-surface-elevated rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-surface-elevated rounded-md" />
            <div className="h-10 w-full bg-surface-elevated rounded-md" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-surface-elevated rounded-md" />
            <div className="h-10 w-full bg-surface-elevated rounded-md" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-elevated rounded-md" />
          <div className="h-10 w-full bg-surface-elevated rounded-md" />
        </div>
      </div>
    </div>
  );
}
