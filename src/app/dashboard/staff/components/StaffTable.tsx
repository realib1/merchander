'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, UserCog, ShieldCheck, Mail, MoreVertical, Edit2, KeyRound, CheckCircle2, Clock, Search, Filter } from 'lucide-react';
import { removeStaffMember, sendPasswordReset } from '@/app/actions/staff';
import { toast } from 'sonner';
import { EditStaffModal } from './EditStaffModal';

interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface StaffTableProps {
  staff: StaffMember[];
}

export function StaffTable({ staff }: StaffTableProps) {
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Filtering & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemove = async (id: string, name: string) => {
    setOpenDropdownId(null);
    if (!window.confirm(`Are you sure you want to remove ${name} from the team?`)) return;

    try {
      const res = await removeStaffMember(id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${name} has been removed successfully.`);
    } catch {
      toast.error('An unexpected error occurred while removing the team member.');
    }
  };

  const handlePasswordReset = async (id: string, name: string) => {
    setOpenDropdownId(null);
    try {
      const res = await sendPasswordReset(id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Password reset email sent to ${name}.`);
    } catch {
      toast.error('Failed to send password reset email.');
    }
  };



  // Extract unique roles for the filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set(staff.map(s => s.role));
    return Array.from(roles);
  }, [staff]);

  // Compute filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch = member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            member.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && member.last_sign_in_at !== null) ||
                           (statusFilter === 'pending' && member.last_sign_in_at === null);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchQuery, roleFilter, statusFilter]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-separator bg-surface">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-separator rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-shadow"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-36 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-background border border-separator rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative w-full sm:w-36 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-background border border-separator rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 pb-20">
        <table className="w-full text-left whitespace-nowrap min-w-175">
          <thead>
            <tr className="text-xs font-semibold bg-surface-elevated/30 border-b border-separator">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-surface-elevated/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 font-bold uppercase">
                        {member.full_name.charAt(0)}
                      </div>
                      <div className="font-semibold text-sm text-foreground">{member.full_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Mail size={14} />
                      {member.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      member.role === 'owner' ? 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20' :
                      member.role === 'admin' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' :
                      'bg-surface-elevated text-foreground border-separator'
                    }`}>
                      {member.role === 'owner' && <ShieldCheck size={14} />}
                      {member.role === 'admin' && <UserCog size={14} />}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {member.last_sign_in_at ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <CheckCircle2 size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                        <Clock size={14} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    {member.role !== 'owner' && (
                      <div className="inline-block" ref={openDropdownId === member.id ? dropdownRef : null}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
                          className="p-2 hover:bg-surface-elevated rounded-lg transition-colors text-muted hover:text-foreground"
                          aria-label="Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openDropdownId === member.id && (
                          <div className="absolute right-6 top-10 mt-1 w-48 bg-surface-elevated border border-separator rounded-xl shadow-lg z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                setEditingStaff(member);
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-white/5 transition-colors text-foreground"
                            >
                              <Edit2 size={14} className="text-muted" /> Edit Profile & Role
                            </button>
                            <button
                              onClick={() => handlePasswordReset(member.id, member.full_name)}
                              className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-white/5 transition-colors text-foreground"
                            >
                              <KeyRound size={14} className="text-muted" /> Send Password Reset
                            </button>
                            <div className="h-px bg-separator my-1" />
                            <button
                              onClick={() => handleRemove(member.id, member.full_name)}
                              className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-destructive/10 transition-colors text-destructive"
                            >
                              <Trash2 size={14} /> Remove Member
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-muted text-sm">No staff members found.</p>
                    {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setRoleFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-brand-primary text-sm font-medium hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditStaffModal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        staffMember={editingStaff}
      />
    </>
  );
}
