'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { MapPin, Bike, Globe, Plus, Trash2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { ShipmentSettings, DeliveryZone } from '@/types/settings';
import { updateShipmentSettings } from '@/app/actions/settings-operations';
import { toast } from 'sonner';

interface ShipmentsSettingsFormProps {
  initialSettings: ShipmentSettings;
}

export function ShipmentsSettingsForm({ initialSettings }: ShipmentsSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneEta, setNewZoneEta] = useState('Standard Delivery (1-2 Days)');
  const [newZoneFee, setNewZoneFee] = useState('35');

  const handleAddZone = () => {
    if (!newZoneName.trim()) {
      toast.error('Please enter a zone name');
      return;
    }
    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: newZoneName.trim(),
      eta: newZoneEta,
      fee: parseFloat(newZoneFee) || 0,
      isActive: true,
    };
    setSettings((prev) => ({ ...prev, zones: [...prev.zones, newZone] }));
    setNewZoneName('');
    toast.success('Zone added to list');
  };

  const handleRemoveZone = (id: string) => {
    setSettings((prev) => ({ ...prev, zones: prev.zones.filter((z) => z.id !== id) }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateShipmentSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Shipment & delivery zones saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Delivery Zones */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Local Delivery Zones & Flat Rates</CardTitle>
              <CardDescription>Configure shipping fees by city or region across Ghana.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="rounded-xl border border-separator overflow-hidden divide-y divide-separator/60">
            {settings.zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-3.5 bg-surface hover:bg-surface-elevated/40 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-foreground">{zone.name}</p>
                  <p className="text-[11px] text-muted">{zone.eta}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-primary tabular-nums">{formatCurrency(zone.fee)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveZone(zone.id)}
                    className="p-1 text-muted hover:text-destructive transition-colors cursor-pointer"
                    title="Remove Zone"
                    aria-label={`Remove ${zone.name} zone`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Add Form */}
          <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator/80 space-y-3">
            <p className="text-xs font-bold text-foreground">Add Delivery Zone</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Zone / Region (e.g. Tema & Kpone)"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full text-xs rounded-lg bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <input
                type="text"
                placeholder="ETA (e.g. Same Day / 24hrs)"
                value={newZoneEta}
                onChange={(e) => setNewZoneEta(e.target.value)}
                className="w-full text-xs rounded-lg bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Fee (GHS)"
                  value={newZoneFee}
                  onChange={(e) => setNewZoneFee(e.target.value)}
                  className="w-full text-xs rounded-lg bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <Button variant="outline" size="sm" type="button" onClick={handleAddZone} className="shrink-0">
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Dispatch Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Bike className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Dispatch & Rider Notifications</CardTitle>
              <CardDescription>Customer tracking links and dispatch status alerts.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Allow Live Customer Tracking</p>
              <p className="text-xs text-muted max-w-lg">
                Send SMS notifications to customers with rider contact details and tracking links when out for delivery.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.allowCustomerTracking)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, allowCustomerTracking: c }))}
              aria-label="Allow customer delivery tracking"
            />
          </div>
        </CardBody>
      </Card>

      {/* Origin Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Default Fulfillment Origin</CardTitle>
              <CardDescription>Primary dispatch location for landed cost and shipping calculation.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Origin Warehouse / Hub"
            value={settings.originWarehouse}
            onChange={(e) => setSettings((s) => ({ ...s, originWarehouse: e.target.value }))}
            hint="Default origin shown on dispatch manifests and waybills."
          />
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Shipment Settings'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
