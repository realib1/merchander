import React from 'react';
import { getPlatformStaffListAction } from '@/app/actions/platform-staff';
import { requirePlatformRoute } from '@/lib/auth/require-platform-route';
import { StaffManagementClient } from './components/StaffManagementClient';

export const dynamic = 'force-dynamic';

export default async function SecurityCompliancePage() {
  const { role: userRole } = await requirePlatformRoute('/platform/security');
  const { staff, error } = await getPlatformStaffListAction();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
          Notice: {error}
        </div>
      )}

      {/* Staff & RBAC Management */}
      <StaffManagementClient initialStaff={staff} currentStaffRole={userRole} />
    </div>
  );
}
