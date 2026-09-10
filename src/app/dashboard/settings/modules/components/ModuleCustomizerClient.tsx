'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Lock,
  RotateCcw,
  Save,
  CircleAlert,
  Sparkles,
  ShieldAlert,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import {
  BusinessArchetype,
  BusinessModuleKey,
} from '@/types/business-modules';
import { PlatformTier } from '@/types/platform';
import {
  MODULE_DEFINITIONS,
  ARCHETYPE_DEFINITIONS,
  isModuleEntitled,
} from '@/utils/business-modules';
import { BusinessIcon } from '@/components/ui/BusinessIcon';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { updateTenantModulesAction } from '@/app/actions/tenant-modules';

interface ModuleCustomizerClientProps {
  initialArchetype: BusinessArchetype;
  initialModules: BusinessModuleKey[];
  tier: PlatformTier;
}

interface ModuleCategoryGroup {
  id: string;
  title: string;
  description: string;
  modules: BusinessModuleKey[];
}

const MODULE_CATEGORIES: ModuleCategoryGroup[] = [
  {
    id: 'supply-chain',
    title: 'Supply Chain & Inbound Logistics',
    description: 'Track overseas cargo, container shipments, supplier liabilities, and customer batch cycles.',
    modules: ['shipments', 'batches', 'suppliers'],
  },
  {
    id: 'commerce-ai',
    title: 'Digital Storefront & Customer AI',
    description: 'Direct mobile shopping catalog, order tracking, and automated WhatsApp order communications.',
    modules: ['storefront', 'intelligence'],
  },
  {
    id: 'finance-margins',
    title: 'Unit Profitability & Cost Allocation',
    description: 'Direct landed cost calculations, packaging fees, delivery charges, and true net margins.',
    modules: ['profitability'],
  },
];

export function ModuleCustomizerClient({
  initialArchetype,
  initialModules,
  tier,
}: ModuleCustomizerClientProps) {
  const [archetype, setArchetype] = useState<BusinessArchetype>(initialArchetype);
  const [enabledModules, setEnabledModules] = useState<BusinessModuleKey[]>(initialModules);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Apply an archetype preset
  const handleApplyPreset = (newArchetype: BusinessArchetype) => {
    setArchetype(newArchetype);
    if (newArchetype !== 'custom') {
      const presetModules = ARCHETYPE_DEFINITIONS[newArchetype].defaultModules;
      const entitled = presetModules.filter((m) => isModuleEntitled(tier, m));
      setEnabledModules(entitled);

      const unentitled = presetModules.filter((m) => !isModuleEntitled(tier, m));
      if (unentitled.length > 0) {
        toast.info(
          `Switched to ${ARCHETYPE_DEFINITIONS[newArchetype].name}. Note: Some modules require a plan upgrade.`
        );
      } else {
        toast.success(`Applied ${ARCHETYPE_DEFINITIONS[newArchetype].name} preset.`);
      }
    }
  };

  // Toggle individual module
  const handleToggle = (modKey: BusinessModuleKey) => {
    const isEntitled = isModuleEntitled(tier, modKey);
    if (!isEntitled) {
      const def = MODULE_DEFINITIONS[modKey];
      toast.error(
        `"${def.name}" requires a ${def.requiredTier.toUpperCase()} plan. Please upgrade your subscription.`
      );
      return;
    }

    if (enabledModules.includes(modKey)) {
      setEnabledModules(enabledModules.filter((k) => k !== modKey));
      setArchetype('custom');
    } else {
      setEnabledModules([...enabledModules, modKey]);
      setArchetype('custom');
    }
  };

  // Reset to initial
  const handleReset = () => {
    setArchetype(initialArchetype);
    setEnabledModules(initialModules);
    toast.info('Reset to previously saved configuration.');
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await updateTenantModulesAction({
        archetype,
        enabledModules,
      });

      if (!result.success) {
        setSaveError(result.error || 'Failed to save module configuration.');
        toast.error(result.error || 'Could not save modules.');
      } else {
        toast.success('Workspace modules saved successfully.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error saving modules';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const activeDef = ARCHETYPE_DEFINITIONS[archetype] || ARCHETYPE_DEFINITIONS.custom;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Column: Archetype Preset & Categorized Module Cards */}
      <div className="lg:col-span-2 space-y-6">
        {saveError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive flex items-center gap-2">
            <CircleAlert size={16} className="shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Current Archetype Preset Banner Card */}
        <Card className="border-separator/80">
          <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-separator flex items-center justify-center shrink-0">
                <BusinessIcon name={activeDef.icon} size={24} className="text-brand-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">{activeDef.name}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                    Active
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">{activeDef.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="archetype-preset-select" className="text-xs font-semibold text-muted whitespace-nowrap">
                Preset:
              </label>
              <select
                id="archetype-preset-select"
                value={archetype}
                onChange={(e) => handleApplyPreset(e.target.value as BusinessArchetype)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="import_resale">Import & Social Resale</option>
                <option value="boutique_fashion">Boutique & Retail Fashion</option>
                <option value="wholesale_distributor">Wholesale & Distribution</option>
                <option value="general_pos">General Merchant / Fast POS</option>
                <option value="custom">Custom Configuration</option>
              </select>
            </div>
          </CardBody>
        </Card>

        {/* Categorized Module Cards */}
        <div className="space-y-5">
          {MODULE_CATEGORIES.map((cat) => (
            <Card key={cat.id} className="border-separator/80">
              <CardHeader className="bg-surface-elevated/40 pb-3">
                <CardTitle className="text-sm font-bold text-foreground">{cat.title}</CardTitle>
                <CardDescription className="text-xs text-muted">{cat.description}</CardDescription>
              </CardHeader>
              <CardBody className="p-4 space-y-3">
                {cat.modules.map((modKey) => {
                  const def = MODULE_DEFINITIONS[modKey];
                  if (!def) return null;
                  const isEnabled = enabledModules.includes(modKey);
                  const isEntitled = isModuleEntitled(tier, modKey);

                  return (
                    <div
                      key={modKey}
                      className={`p-4 rounded-xl border transition-all ${
                        isEnabled
                          ? 'bg-surface border-separator shadow-xs border-l-4 border-l-brand-primary'
                          : 'bg-surface-elevated/40 border-separator/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-separator flex items-center justify-center shrink-0 text-brand-primary">
                              <BusinessIcon name={def.icon} size={15} />
                            </div>
                            <h4 className="text-sm font-bold text-foreground">{def.name}</h4>
                            {isEnabled ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-muted border border-separator">
                                Dormant
                              </span>
                            )}
                            {!isEntitled && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-amber/10 text-brand-amber border border-brand-amber/20 flex items-center gap-1">
                                <Lock size={10} />
                                <span>Requires {def.requiredTier.toUpperCase()}</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted leading-relaxed">{def.description}</p>

                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {def.impactTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-surface-elevated border border-separator/80 text-secondary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="pt-1">
                          {isEntitled ? (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isEnabled}
                              aria-label={`Toggle ${def.name}`}
                              onClick={() => handleToggle(modKey)}
                              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                isEnabled ? 'bg-brand-primary' : 'bg-separator'
                              }`}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          ) : (
                            <Link
                              href="/dashboard/settings/subscription"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-brand-amber/10 text-brand-amber border border-brand-amber/20 hover:bg-brand-amber/20 transition-all"
                            >
                              <Sparkles size={12} />
                              <span>Upgrade</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <Card className="border-separator/80">
          <CardFooter className="p-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              leftIcon={<RotateCcw size={14} />}
            >
              Reset to Saved
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={!isSaving ? <Save size={14} /> : undefined}
            >
              Save Module Changes
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Right Column: Live Sidebar Preview & Information */}
      <div className="space-y-4 lg:sticky lg:top-4">
        <Card className="border-separator/80 shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">Live Sidebar Impact</CardTitle>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
                Live Preview
              </span>
            </div>
            <CardDescription className="text-xs text-muted leading-relaxed">
              Here is how your navigation dynamically adjusts based on active modules:
            </CardDescription>
          </CardHeader>

          <CardBody className="p-5 pt-0 space-y-4">
            <div className="p-3 rounded-xl bg-surface-elevated/60 border border-separator/80 space-y-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface text-xs font-semibold text-brand-primary shadow-xs">
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={14} />
                  <span>Dashboard</span>
                </span>
                <span className="text-[9px] text-muted uppercase">Core</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-foreground">
                <span className="flex items-center gap-2">
                  <ShoppingBag size={14} />
                  <span>Orders</span>
                </span>
                <span className="text-[9px] text-muted uppercase">Core</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-foreground">
                <span className="flex items-center gap-2">
                  <Package size={14} />
                  <span>Inventory</span>
                </span>
                <span className="text-[9px] text-muted uppercase">Core</span>
              </div>

              {/* Dynamic Module Navs */}
              {[
                { mod: 'shipments' as const, label: 'Shipments', icon: 'ship' },
                { mod: 'batches' as const, label: 'Pre-Order Batches', icon: 'clock' },
                { mod: 'suppliers' as const, label: 'Suppliers', icon: 'factory' },
                { mod: 'storefront' as const, label: 'Online Store', icon: 'globe' },
                { mod: 'profitability' as const, label: 'Profitability', icon: 'trending-up' },
              ].map((item) => {
                const isShown = enabledModules.includes(item.mod);
                return (
                  <div
                    key={item.mod}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                      isShown
                        ? 'text-foreground font-medium'
                        : 'text-muted line-through opacity-40 bg-background/30'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <BusinessIcon
                        name={item.icon}
                        size={14}
                        className={isShown ? 'text-brand-primary' : 'text-muted'}
                      />
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isShown
                          ? 'bg-brand-primary/10 text-brand-primary'
                          : 'bg-separator text-muted'
                      }`}
                    >
                      {isShown ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                );
              })}

              <div className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-foreground">
                <span className="flex items-center gap-2">
                  <Settings size={14} />
                  <span>Settings</span>
                </span>
                <span className="text-[9px] text-muted uppercase">Core</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-elevated border border-separator/70 text-[11px] text-muted space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-brand-emerald shrink-0" />
                <span>Data Protection Guarantee</span>
              </div>
              <p>
                Turning off a module hides it from your menus and forms, but safely preserves all historical records in your database.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
