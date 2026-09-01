import { Skeleton } from '@/components/ui/Skeleton';

export default function CustomersLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-37.5" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-25" />
          <Skeleton className="h-8 w-30" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-100 w-full rounded-md" />
      </div>
    </div>
  );
}
