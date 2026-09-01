import { Skeleton } from '@/components/ui/Skeleton';

export default function StorefrontLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <header className="sticky top-0 z-40 w-full border-b bg-surface-base/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Skeleton className="h-8 w-30" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-62.5 w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
