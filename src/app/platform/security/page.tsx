import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { verifyPlatformStaff } from '@/app/actions/platform';
import { getPlatformStaffListAction } from '@/app/actions/platform-staff';
import { StaffManagementClient } from './components/StaffManagementClient';

export const dynamic = 'force-dynamic';

export default async function SecurityCompliancePage() {
  const { role: userRole } = await verifyPlatformStaff();
  const { staff, error } = await getPlatformStaffListAction();

  const securityPolicies = [
    { policy: 'Multi-Factor Authentication (MFA)', status: 'Enforced for all platform staff' },
    { policy: 'Row-Level Security (RLS) PostgreSQL Policies', status: 'Enforced on 100% of tenant tables' },
    { policy: 'Zero Plaintext Payment Secrets', status: 'Active (Tokens & AES-256 GCM encrypted)' },
    { policy: 'Immutable Audit Log Streaming', status: 'Active (Tamper-resistant append-only)' },
  ];

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
          Notice: {error}
        </div>
      )}

      {/* Security Policies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {securityPolicies.map((p, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-surface border border-separator shadow-xs flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">{p.policy}</div>
              <div className="text-[11px] text-muted font-mono mt-0.5">{p.status}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Real Interactive Staff & RBAC Management */}
      <StaffManagementClient initialStaff={staff} currentStaffRole={userRole} />
    </div>
  );
}
