'use client';

import React from 'react';
import { RoleFormDrawer } from './RoleFormDrawer';

export interface CreateRoleModalProps {
  children: React.ReactNode;
}

export function CreateRoleModal({ children }: CreateRoleModalProps) {
  return <RoleFormDrawer>{children}</RoleFormDrawer>;
}
