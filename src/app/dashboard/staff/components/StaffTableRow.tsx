'use client';

import { ShieldCheck, Mail, MoreVertical, Pencil, KeyRound, Trash2, CheckCircle2, Clock } from 'lucide-react';

export interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  role_id?: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface StaffTableRowProps {
  member: StaffMember;
  isDropdownOpen: boolean;
  onToggleDropdown: (id: string) => void;
  onEdit: (member: StaffMember) => void;
  onPasswordReset: (userId: string, name: string) => void;
  onRemove: (id: string, name: string) => void;
}

export function StaffTableRow({
  member,
  isDropdownOpen,
  onToggleDropdown,
  onEdit,
  onPasswordReset,
  onRemove,
}: StaffTableRowProps) {
  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'admin':
        return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
      default:
        return 'bg-surface-elevated text-muted border-separator';
    }
  };

  return (
    <tr className="hover:bg-surface-elevated/40 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-2xs">
            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center font-bold text-xs">
              {member.full_name.charAt(0)}
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">{member.full_name}</div>
            <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3" />
              {member.email}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getRoleBadge(
            member.role
          )}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {member.role}
        </span>
      </td>

      <td className="px-6 py-4 text-xs text-muted hidden md:table-cell">
        {member.last_sign_in_at ? (
          <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-amber-500 font-medium">
            <Clock className="w-3.5 h-3.5" />
            Pending Invite
          </span>
        )}
      </td>

      <td className="px-6 py-4 text-xs text-muted hidden lg:table-cell">
        {new Date(member.created_at).toLocaleDateString()}
      </td>

      <td className="px-6 py-4 text-right">
        {member.role?.toLowerCase() !== 'owner' && (
          <div className="relative inline-block text-left">
            <button
              onClick={() => onToggleDropdown(member.id)}
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
              aria-label="Staff actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-separator rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                <button
                  onClick={() => onEdit(member)}
                  className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-surface-elevated flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted" />
                  Edit Role & Details
                </button>

                <button
                  onClick={() => onPasswordReset(member.user_id, member.full_name)}
                  className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-surface-elevated flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-muted" />
                  Reset Password
                </button>

                <div className="border-t border-separator/40 my-1" />

                <button
                  onClick={() => onRemove(member.id, member.full_name)}
                  className="w-full px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove from Team
                </button>
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
