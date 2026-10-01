'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, PanelLeftClose, PanelLeft, Plus } from 'lucide-react';
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
      <header className="h-16 border-b border-separator/60 bg-surface/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile menu button */}
          <button
            className="xl:hidden p-2 -ml-2 hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer text-muted hover:text-foreground shrink-0"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>

          {/* Desktop panel toggle */}
          <button
            className="hidden xl:flex p-1.5 -ml-1 hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer text-muted hover:text-foreground shrink-0"
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            aria-label="Toggle sidebar panel"
          >
            {isDesktopCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Header Title & Breadcrumb Hierarchy */}
          <div className="flex flex-col justify-center min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
              <Link
                href="/dashboard"
                className="hover:text-foreground transition-colors font-medium shrink-0"
              >
                Dashboard
              </Link>
              {currentSegment !== 'dashboard' && (
                <>
                  <span className="text-muted/40 font-normal">/</span>
                  <span className="font-semibold text-foreground truncate max-w-28 sm:max-w-xs">
                    {header.title}
                  </span>
                </>
              )}
            </nav>
            {/* Prominent Page Title for Mobile/Tablet */}
            <h1 className="sm:hidden text-xs font-bold text-foreground truncate leading-tight">
              {header.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5" ref={dropdownRef}>
          {/* Mobile Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search dashboard"
            className="md:hidden p-2 hover:bg-surface-elevated rounded-lg text-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <Search size={18} />
          </button>

          {/* Quick Search Trigger */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search dashboard"
              className="flex items-center gap-2 bg-surface-elevated/60 border border-separator/80 rounded-lg pl-3 pr-2 py-1.5 text-xs text-muted hover:border-separator hover:text-foreground hover:bg-surface-elevated transition-all focus:outline-none cursor-pointer w-48 lg:w-60 justify-between shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search size={14} className="text-muted shrink-0" />
                <span className="truncate">Search dashboard...</span>
              </div>
              <kbd className="inline-flex items-center justify-center rounded border border-separator/80 bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted shrink-0">
                <span className="text-[10px] mr-0.5">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Quick Primary Action */}
          <Link
            href="/dashboard/orders/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover shadow-2xs transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>New Order</span>
          </Link>

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
          {canSwitchBranch && stores.length > 1 && (
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
