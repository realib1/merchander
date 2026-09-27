'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Clock, Loader2, Save, RotateCcw } from 'lucide-react';
import { BusinessHoursSettings } from '@/types/settings';
import { updateBusinessHours } from '@/app/actions/settings-business';
import { toast } from 'sonner';

const TIME_OPTIONS = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
];

interface HoursFormProps {
  initialSettings: BusinessHoursSettings;
}

export function HoursForm({ initialSettings }: HoursFormProps) {
  const [isPending, startTransition] = useTransition();
  const [days, setDays] = useState(initialSettings.days);
  const [timezone, setTimezone] = useState(initialSettings.timezone || 'GMT (Greenwich Mean Time)');
  const [savedDays, setSavedDays] = useState(initialSettings.days);
  const [savedTimezone, setSavedTimezone] = useState(initialSettings.timezone || 'GMT (Greenwich Mean Time)');

  const isDirty = useMemo(() => {
    return JSON.stringify({ days, timezone }) !== JSON.stringify({ days: savedDays, timezone: savedTimezone });
  }, [days, timezone, savedDays, savedTimezone]);

  const handleToggleDay = (id: string, isOpen: boolean) => {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, isOpen } : d)));
  };

  const handleTimeChange = (id: string, field: 'openTime' | 'closeTime', value: string) => {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const handleReset = () => {
    setDays(savedDays);
    setTimezone(savedTimezone);
    toast.info('Changes reverted');
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateBusinessHours({ days, timezone });
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedDays(days);
        setSavedTimezone(timezone);
        toast.success('Business hours saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-display">Operating Hours</CardTitle>
                <CardDescription className="text-xs text-muted">
                  Customers will see these hours on your storefront and bot greetings.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-0 p-0">
          <div className="divide-y divide-separator">
            {days.map((day) => (
              <div
                key={day.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3"
              >
                <div className="flex items-center gap-3.5 w-40">
                  <Switch
                    checked={Boolean(day.isOpen)}
                    onCheckedChange={(checked: boolean) => handleToggleDay(day.id, checked)}
                    aria-label={`Open on ${day.name}`}
                  />
                  <span className={`text-xs ${day.isOpen ? 'text-foreground font-semibold' : 'text-muted'}`}>
                    {day.name}
                  </span>
                </div>

                {day.isOpen ? (
                  <div className="flex items-center gap-2 flex-1 justify-end sm:justify-start">
                    <select
                      aria-label={`${day.name} opening time`}
                      value={day.openTime}
                      onChange={(e) => handleTimeChange(day.id, 'openTime', e.target.value)}
                      className="w-28 rounded-xl border border-separator bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted text-xs font-medium">to</span>
                    <select
                      aria-label={`${day.name} closing time`}
                      value={day.closeTime}
                      onChange={(e) => handleTimeChange(day.id, 'closeTime', e.target.value)}
                      className="w-28 rounded-xl border border-separator bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex-1 text-left sm:text-left">
                    <span className="text-xs text-muted italic px-2">Closed</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 sm:p-5 border-t border-separator space-y-1.5 bg-surface-elevated/20">
            <label htmlFor="hours-timezone" className="text-xs font-semibold text-foreground">
              Store Timezone
            </label>
            <select
              id="hours-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full max-w-sm rounded-xl border border-separator bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            >
              <option value="GMT (Greenwich Mean Time)">GMT (Greenwich Mean Time) - Accra, London</option>
              <option value="WAT (West Africa Time)">WAT (West Africa Time) - Lagos</option>
              <option value="EST (Eastern Standard Time)">EST (Eastern Standard Time) - New York</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved schedule changes</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="cursor-pointer"
            >
              <RotateCcw size={13} className="mr-1" />
              <span>Revert</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : <Save size={13} className="mr-1" />}
              <span>{isPending ? 'Saving...' : 'Save Hours'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
