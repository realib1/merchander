"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
} from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";

interface ModuleRow extends Record<string, unknown> {
  id: string;
  name: string;
  category: string;
  status: string;
  version: string;
}

const SAMPLE_MODULE_DATA: ModuleRow[] = [
  { id: "1", name: "Layer 1: Foundation", category: "Core", status: "Active", version: "1.0.0" },
  { id: "2", name: "Layer 2: Auth Module", category: "Module", status: "Ready", version: "1.0.0" },
  { id: "3", name: "Layer 2: Payments", category: "Module", status: "Ready", version: "1.0.0" },
  {
    id: "4",
    name: "Layer 2: Notifications",
    category: "Module",
    status: "Ready",
    version: "1.0.0",
  },
  { id: "5", name: "Layer 2: Database", category: "Module", status: "Ready", version: "1.0.0" },
];

const MODULE_COLUMNS: Column<ModuleRow>[] = [
  { key: "name", header: "Component / Module", sortable: true },
  { key: "category", header: "Layer", sortable: true },
  {
    key: "status",
    header: "Status",
    render: (item: ModuleRow) => <Badge variant="success">{item.status}</Badge>,
  },
  { key: "version", header: "Version" },
];

/**
 * Interactive showcase for core UI primitives (inputs, selectors, buttons, badges, datatable).
 */
export const PrimitivesSection: React.FC = () => {
  const { addToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("admin");

  return (
    <section id="components" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Core UI Primitives
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          WCAG 2.1 AA compliant, zero-flash dark mode, and OKLCH color harmony.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Interactive Forms & Controls */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Form & Selector Primitives</CardTitle>
            <CardDescription>
              Accessible inputs with validation hints and search support.
            </CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <FormField
              label="Full Name"
              placeholder="e.g. Ama Mensah"
              hint="Enter your legal full name"
            />
            <Select
              label="Role Selection"
              value={selectedRole}
              onChange={(val) => setSelectedRole(val as string)}
              options={[
                { value: "admin", label: "System Administrator" },
                { value: "staff", label: "Support Staff" },
                { value: "viewer", label: "Auditor / Viewer" },
              ]}
              searchable
            />
          </CardBody>
          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">Selected: {selectedRole}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                addToast({
                  title: "Form Saved",
                  message: `Role updated to ${selectedRole}`,
                  type: "info",
                })
              }
            >
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Badges & Buttons Playground */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Actions & Badges</CardTitle>
            <CardDescription>
              Configurable states, loading feedback, and semantic variants.
            </CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-6">
            <div>
              <h4 className="mb-3 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                Button Variants
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm">
                  Primary
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary
                </Button>
                <Button variant="outline" size="sm">
                  Outline
                </Button>
                <Button variant="ghost" size="sm">
                  Ghost
                </Button>
                <Button variant="destructive" size="sm">
                  Destructive
                </Button>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                Badge Variants
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Interactive DataTable */}
      <div className="mb-12">
        <h3 className="mb-4 text-xl font-bold text-[var(--color-text-primary)]">Data Display</h3>
        <DataTable
          data={SAMPLE_MODULE_DATA}
          columns={MODULE_COLUMNS}
          keyExtractor={(item) => item.id}
          pageSize={5}
        />
      </div>
    </section>
  );
};
