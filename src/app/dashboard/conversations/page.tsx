import { Construction } from 'lucide-react';

export const metadata = {
  title: 'Conversations | Merchander',
};

export default function ConversationsPage() {
  return (
    <div className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
          <p className="text-muted mt-1">Manage communications with customers and staff.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-separator rounded-2xl flex flex-col shadow-sm items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
          <Construction size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
        <p className="text-muted max-w-md">
          The Conversations module is currently under construction. Check back soon for updates!
        </p>
      </div>
    </div>
  );
}
