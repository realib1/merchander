import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getStaffMembers } from '@/app/actions/staff';
import { StaffTable } from './components/StaffTable';
import { InviteStaffModal } from './components/InviteStaffModal';
import { Users, Shield, Plus } from 'lucide-react';

export const metadata = {
  title: 'Staff Management | Merchander',
};

export default async function StaffPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: staffMembers, error } = await getStaffMembers();

  if (error) {
    console.error('Error loading staff:', error);
  }

  const staff = staffMembers || [];
  const adminsCount = staff.filter((s) => s.role === 'admin' || s.role === 'owner').length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff & Team</h1>
          <p className="text-muted mt-1 text-sm">Manage your team members and their roles across your organization.</p>
        </div>
        <InviteStaffModal>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 font-medium transition-colors">
            <Plus size={18} />
            <span>Invite Team Member</span>
          </button>
        </InviteStaffModal>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface border border-separator rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-muted text-sm font-medium">Total Team Members</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{staff.length}</p>
          </div>
        </div>

        <div className="bg-surface border border-separator rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-muted text-sm font-medium">Owners & Admins</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{adminsCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-separator rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-100">
        <StaffTable staff={staff} />
      </div>
    </div>
  );
}
