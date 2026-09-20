import React from 'react';
import { Globe, MessageCircle, Palette, Star } from 'lucide-react';
import { StorefrontTab } from '../hooks/useStorefrontSettingsForm';

interface StorefrontTabsNavProps {
  activeTab: StorefrontTab;
  onSelectTab: (tab: StorefrontTab) => void;
  primaryColor: string;
}

const TABS = [
  { id: 'branding' as const, label: 'Branding & Visuals', icon: Palette },
  { id: 'merchandising' as const, label: 'Featured Products', icon: Star },
  { id: 'domain' as const, label: 'Custom Domain', icon: Globe },
  { id: 'policies' as const, label: 'Contact & Policies', icon: MessageCircle },
];

export function StorefrontTabsNav({ activeTab, onSelectTab, primaryColor }: StorefrontTabsNavProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-surface border border-separator rounded-2xl overflow-x-auto">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActiveTab = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              isActiveTab
                ? 'bg-surface-elevated text-foreground shadow-xs border border-separator/80'
                : 'text-muted hover:text-foreground hover:bg-surface-elevated/50'
            }`}
          >
            <Icon size={15} style={isActiveTab ? { color: primaryColor } : undefined} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
