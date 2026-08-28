'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Menu, PanelLeftClose, PanelLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useMobileNav } from './MobileNavContext';
import { GlobalSearchModal } from './GlobalSearchModal';
import { getPageHeader } from './topbar/topbarUtils';
import { NotificationsDropdown, Notification } from './topbar/NotificationsDropdown';
import { BranchSwitcher } from './topbar/BranchSwitcher';
import { UserProfileDropdown, UserProfileInfo } from './topbar/UserProfileDropdown';

export interface TopbarProps {
  user?: UserProfileInfo;
  stores?: { id: string; name: string }[];
  canSwitchBranch?: boolean;
  initialActiveStoreId?: string | null;
  initialNotifications?: Notification[];
}

export function Topbar({
  user,
  stores = [],
  canSwitchBranch = false,
  initialActiveStoreId = null,
  initialNotifications = [],
}: TopbarProps) {
  const pathname = usePathname();
  const { setIsOpen, isDesktopCollapsed, setIsDesktopCollapsed } = useMobileNav();

  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] || 'dashboard';
  const header = getPageHeader(currentSegment);

  const [activeDropdown, setActiveDropdown] = useState<'branch' | 'profile' | 'notifications' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-18 border-b border-separator/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu button */}
          <button
            className="xl:hidden p-2 -ml-2 hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop panel toggle */}
          <button
            className="hidden xl:flex p-2 -ml-2 hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            aria-label="Toggle sidebar panel"
          >
            {isDesktopCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>

          {/* Page Title & Subtitle */}
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold tracking-tight leading-none">{header.title}</h1>
            <p className="hidden sm:block text-xs mt-1.5 leading-none text-muted">{header.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3" ref={dropdownRef}>
          {/* Quick Search */}
          <div className="hidden md:flex items-center relative">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search dashboard"
              className="flex items-center justify-between bg-surface/50 border border-separator/80 rounded-md pl-3 pr-2 py-1.5 text-sm text-muted hover:border-brand-primary/50 hover:bg-surface-elevated transition-all focus:outline-none cursor-pointer"
            >
              <Search size={16} />
              <div className="flex items-center gap-1 ml-2">
                <kbd className="inline-flex items-center justify-center rounded border border-separator bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  <span className="text-xs mr-0.5">⌘</span>K
                </kbd>
              </div>
            </button>
          </div>

          {/* Notifications */}
          <NotificationsDropdown
            initialNotifications={initialNotifications}
            isOpen={activeDropdown === 'notifications'}
            onToggle={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
            onClose={() => setActiveDropdown(null)}
          />

          <div className="h-4 w-px bg-separator/50 mx-1 hidden sm:block" />

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Branch Switcher */}
          {canSwitchBranch && stores.length > 0 && (
            <BranchSwitcher
              stores={stores}
              initialActiveStoreId={initialActiveStoreId}
              isOpen={activeDropdown === 'branch'}
              onToggle={() => setActiveDropdown(activeDropdown === 'branch' ? null : 'branch')}
              onClose={() => setActiveDropdown(null)}
            />
          )}

          {/* User Profile */}
          {user && (
            <UserProfileDropdown
              user={user}
              isOpen={activeDropdown === 'profile'}
              onToggle={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
              onClose={() => setActiveDropdown(null)}
            />
          )}
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
