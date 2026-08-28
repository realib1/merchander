'use client';

import { Search, Filter } from 'lucide-react';

interface CustomRole {
  id: string;
  name: string;
}

interface StaffFilterToolbarProps {
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  customRoles: CustomRole[];
  onSearchChange: (q: string) => void;
  onRoleFilterChange: (r: string) => void;
  onStatusFilterChange: (s: string) => void;
}

export function StaffFilterToolbar({
  searchQuery,
  roleFilter,
  statusFilter,
  customRoles,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
}: StaffFilterToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface border border-separator rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-muted"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-35">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-surface border border-separator rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            {customRoles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-35">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary appearance-none cursor-pointer"
          >
            <option value="all">All Activity</option>
            <option value="active">Active</option>
            <option value="pending">Pending Invite</option>
          </select>
        </div>
      </div>
    </div>
  );
}
