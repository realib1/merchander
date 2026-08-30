import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getStaffMembers } from '@/app/actions/staff';
import { getTenantRoles } from '@/app/actions/roles';
import { StaffTable } from './components/StaffTable';
import { InviteStaffModal } from './components/InviteStaffModal';
import { Users, Shield, Plus, UserCheck } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

export const metadata = {
  title: 'Staff Management | Merchander',
};

export default async function StaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: staffMembers, error }, { data: customRolesData }] = await Promise.all([
    getStaffMembers(),
    getTenantRoles(),
  ]);

  if (error) {
    console.error('Error loading staff:', error);
  }

  const staff = staffMembers || [];
  const customRoles = (customRolesData as { id: string; name: string }[]) || [];
  const adminsCount = staff.filter((s) => s.role === 'admin' || s.role === 'owner').length;
  const activeMembersCount = staff.filter((s) => Boolean(s.last_sign_in_at)).length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-fadeIn">
      <h1 className="sr-only">Staff & Team</h1>

      {/* 1. Top 2 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Team Members"
          value={staff.length}
          icon={<Users size={14} />}
          iconBg="bg-brand-primary/10 text-brand-primary"
          subtitle={activeMembersCount > 0 ? `${activeMembersCount} active recently` : 'All team members'}
        />
        <MetricCard
          title="Owners & Admins"
          value={adminsCount}
          icon={<Shield size={14} />}
          iconBg="bg-brand-secondary/10 text-brand-secondary"
          subtitle="Full operational access"
        />
        <MetricCard
          title="Custom Roles"
          value={customRoles.length}
          icon={<UserCheck size={14} />}
          iconBg="bg-info/10 text-info"
          subtitle="Configured permission profiles"
        />
      </div>

      {/* 2. Action Toolbar */}
      <div className="flex justify-end items-center">
        <InviteStaffModal customRoles={customRoles}>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors shadow-xs cursor-pointer">
            <Plus size={15} />
            <span>Invite Team Member</span>
          </button>
        </InviteStaffModal>
      </div>

      {/* 3. Staff Data Table */}
      <div className="flex-1 flex flex-col overflow-hidden shadow-xs min-h-100">
        <StaffTable staff={staff} customRoles={customRoles} />
      </div>
    </div>
  );
}
