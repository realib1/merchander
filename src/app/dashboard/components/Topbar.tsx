'use client';

import { Search, Bell, Menu, PanelLeftClose, PanelLeft, Store, ChevronDown, LogOut, Check, Settings, Moon, Sun, ShoppingBag, Package } from 'lucide-react';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { useMobileNav } from './MobileNavContext';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { setActiveBranch } from '@/app/actions/branch';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

export interface TopbarProps {
  user?: {
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    role: string;
  };
  stores?: { id: string; name: string }[];
  canSwitchBranch?: boolean;
  initialActiveStoreId?: string | null;
  initialNotifications?: Notification[];
}

export function Topbar({ user, stores = [], canSwitchBranch = false, initialActiveStoreId = null, initialNotifications = [] }: TopbarProps) {
  const pathname = usePathname();
  const { setIsOpen, isDesktopCollapsed, setIsDesktopCollapsed } = useMobileNav();

  // Format pathname for breadcrumb (e.g. /dashboard/orders -> Orders)
  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] || 'dashboard';

  const getPageHeader = (segment: string) => {
    switch (segment) {
      case 'products':
        return { title: 'Products', subtitle: 'Manage your catalog, pricing and product availability.' };
      case 'orders':
        return { title: 'Orders', subtitle: 'Manage and fulfill customer orders.' };
      case 'customers':
        return { title: 'Customers', subtitle: 'Manage your customer base and relationships.' };
      case 'inventory':
        return { title: 'Inventory', subtitle: 'Track and manage stock levels across all variants.' };
      case 'procurement':
        return { title: 'Procurement', subtitle: 'Manage purchase orders and supplier deliveries.' };
      case 'suppliers':
        return { title: 'Suppliers', subtitle: 'Manage your supplier network and performance.' };
      case 'shipments':
        return { title: 'Shipments', subtitle: 'Track outbound shipping and delivery status.' };
      case 'payments':
        return { title: 'Payments', subtitle: 'Monitor transactions and revenue flows.' };
      case 'settings':
        return { title: 'Settings', subtitle: 'Manage your account and application preferences.' };
      default:
        return { title: 'Overview', subtitle: 'Your business performance at a glance.' };
    }
  };

  const header = getPageHeader(currentSegment);
  
  const [activeDropdown, setActiveDropdown] = useState<'branch' | 'profile' | 'notifications' | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(initialActiveStoreId || (stores?.[0]?.id || null));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  
  const handleBranchSwitch = async (storeId: string) => {
    setActiveStoreId(storeId);
    setActiveDropdown(null);
    await setActiveBranch(storeId);
  };

  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    const oldNotifications = [...notifications];
    setNotifications([]);
    
    const { success } = await markAllNotificationsAsRead();
    if (!success) {
      // Revert if failed
      setNotifications(oldNotifications);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    setActiveDropdown(null);
    await markNotificationAsRead(notif.id);
    
    // In a real app you might redirect here based on notif.type and reference_id
    // router.push(`/dashboard/orders/${notif.reference_id}`);
  };

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

  const activeStore = stores.find(s => s.id === activeStoreId);

  return (
    <>
      <header className="h-18 border-b border-separator/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 -ml-2  hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop panel toggle */}
        <button
          className="hidden md:flex p-2 -ml-2  hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          aria-label="Toggle sidebar panel"
        >
          {isDesktopCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-bold  tracking-tight leading-none">{header.title}</h1>
          <p className="hidden sm:block text-xs  mt-1.5 leading-none">{header.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between bg-surface/50 border border-separator/80 rounded-md pl-3 pr-2 py-1.5 text-sm text-muted hover:border-brand-primary/50 hover:bg-surface-elevated transition-all focus:outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search size={16} />
            </div>
            <div className="flex items-center gap-1 ml-2">
              <kbd className="inline-flex items-center justify-center rounded border border-separator bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted">
                <span className="text-xs mr-0.5">⌘</span>K
              </kbd>
            </div>
          </button>
        </div>

        {/* Notifications & Status */}
        <div className="flex items-center gap-2">
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
              className="relative p-2 hover:bg-surface-elevated hover:text-brand-primary rounded-full transition-colors cursor-pointer"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full border border-background"></span>
              )}
            </button>

            <AnimatePresence>
              {activeDropdown === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-surface border border-separator rounded-xl shadow-lg z-50 overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-3 border-b border-separator/50 flex items-center justify-between bg-surface/50">
                    <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                    {notifications.length > 0 && (
                      <button onClick={handleMarkAllAsRead} className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium transition-colors cursor-pointer">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">You have no new notifications.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        let Icon = Bell;
                        let colorClass = 'bg-brand-primary/10 text-brand-primary';
                        
                        if (notif.type === 'order') {
                          Icon = ShoppingBag;
                          colorClass = 'bg-blue-500/10 text-blue-500';
                        } else if (notif.type === 'inventory') {
                          Icon = Package;
                          colorClass = 'bg-amber-500/10 text-amber-500';
                        } else if (notif.type === 'payment') {
                          Icon = Check;
                          colorClass = 'bg-emerald-500/10 text-emerald-500';
                        }

                        return (
                          <div 
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className="p-3 border-b border-separator/30 hover:bg-surface-elevated transition-colors cursor-pointer group flex gap-3 relative bg-surface-elevated/30"
                          >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-r-full"></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                              <Icon size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground group-hover:text-brand-primary transition-colors leading-tight mb-1">{notif.title}</p>
                              <p className="text-xs text-muted leading-snug">{notif.message}</p>
                              <p className="text-[10px] text-muted/70 mt-1 font-medium capitalize">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-separator/50 bg-surface/50">
                    <button className="w-full py-1.5 text-xs text-center font-medium text-muted hover:text-foreground transition-colors cursor-pointer">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-4 w-px bg-separator/50 mx-1 hidden sm:block"></div>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          
          {/* Branch Switcher & User Profile Container */}
          <div className="relative flex items-center gap-2" ref={dropdownRef}>
            
            {/* Branch Switcher */}
            {canSwitchBranch && stores.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'branch' ? null : 'branch')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border border-separator hover:border-separator/50 cursor-pointer"
                >
                  <Store size={16} className="text-muted" />
                  <span className="text-sm font-medium hidden lg:block max-w-30 truncate">
                    {activeStore?.name || 'Select Branch'}
                  </span>
                  <ChevronDown size={14} className="text-muted" />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'branch' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-surface border border-separator rounded-xl shadow-lg z-50 py-1"
                    >
                      <div className="px-3 py-2 border-b border-separator/50 mb-1">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wider">Switch Branch</p>
                      </div>
                      <div className="max-h-75 overflow-y-auto">
                        {stores.map((store) => (
                          <button
                            key={store.id}
                            onClick={() => handleBranchSwitch(store.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-elevated flex items-center justify-between cursor-pointer"
                          >
                            <span className="truncate pr-4">{store.name}</span>
                            {activeStoreId === store.id && <Check size={14} className="text-brand-primary shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User Profile */}
            {user && (
              <div className="relative ml-1">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors border border-brand-primary/20 cursor-pointer"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{user.fullName.charAt(0).toUpperCase()}</span>
                  )}
                </button>

                <AnimatePresence>
                  {activeDropdown === 'profile' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-surface border border-separator rounded-xl shadow-lg z-50 p-1"
                    >
                      <div className="p-1 border-b border-separator/50">
                        <a href="/dashboard/settings/profile" className="w-full flex items-center gap-3 p-2 hover:bg-surface-elevated rounded-lg transition-colors text-left group">
                          <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 overflow-hidden shrink-0 flex items-center justify-center">
                            {user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold">{user.fullName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-foreground group-hover:text-brand-primary transition-colors leading-none mb-1">
                              {user.fullName.split(' ')[0]}
                            </p>
                            <p className="text-xs text-muted truncate leading-none">{user.email}</p>
                          </div>
                          <div className="shrink-0 ml-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-elevated border border-separator capitalize text-foreground shadow-sm">
                              {user.role}
                            </span>
                          </div>
                        </a>
                      </div>

                      <div className="p-1 mt-1 sm:hidden border-b border-separator/50">
                        <div className="w-full px-3 py-2 text-sm text-foreground flex items-center justify-between transition-colors">
                          <span className="flex items-center gap-2">
                             <Moon size={16} className="text-muted hidden dark:block" />
                             <Sun size={16} className="text-muted block dark:hidden" />
                             Theme
                          </span>
                          <ThemeToggle />
                        </div>
                      </div>

                      <div className="p-1 mt-1">
                        <a href="/dashboard/settings" className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-surface-elevated rounded-md flex items-center gap-2 transition-colors">
                          <Settings size={16} className="text-muted" />
                          Settings
                        </a>
                      </div>
                      
                      <div className="border-t border-separator/50 p-1 mt-1">
                        <form action="/auth/signout" method="post">
                          <button type="submit" className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md flex items-center gap-2 transition-colors cursor-pointer">
                            <LogOut size={16} />
                            Sign out
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>

      <GlobalSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
