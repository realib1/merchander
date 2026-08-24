import React from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';

export type BotStatus = 'online' | 'offline' | 'connecting';

interface LiveStatusPillProps {
  status: BotStatus;
}

export function LiveStatusPill({ status }: LiveStatusPillProps) {
  const statusConfig = {
    online: {
      color: 'bg-green-500/10 text-green-700 border-green-500/20',
      dot: 'bg-green-500',
      label: 'Bot Online',
      icon: <Wifi size={14} className="mr-1.5" />,
    },
    offline: {
      color: 'bg-red-500/10 text-red-700 border-red-500/20',
      dot: 'bg-red-500',
      label: 'Bot Offline',
      icon: <WifiOff size={14} className="mr-1.5" />,
    },
    connecting: {
      color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      dot: 'bg-yellow-500 animate-pulse',
      label: 'Connecting...',
      icon: <Activity size={14} className="mr-1.5 animate-pulse" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      {config.icon}
      <span className="relative flex h-2 w-2 mr-2">
        {status === 'online' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}></span>
      </span>
      {config.label}
    </div>
  );
}
