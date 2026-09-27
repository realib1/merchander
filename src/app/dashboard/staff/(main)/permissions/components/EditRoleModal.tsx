'use client';

import React from 'react';
import { RoleFormDrawer, TenantRole } from './RoleFormDrawer';

export interface EditRoleModalProps {
  children: React.ReactNode;
  role: TenantRole;
}

export function EditRoleModal({ children, role }: EditRoleModalProps) {
  return <RoleFormDrawer role={role}>{children}</RoleFormDrawer>;
}
