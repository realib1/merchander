import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Clock } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 'mon', name: 'Monday', defaultOpen: true },
  { id: 'tue', name: 'Tuesday', defaultOpen: true },
  { id: 'wed', name: 'Wednesday', defaultOpen: true },
  { id: 'thu', name: 'Thursday', defaultOpen: true },
  { id: 'fri', name: 'Friday', defaultOpen: true },
  { id: 'sat', name: 'Saturday', defaultOpen: false },
  { id: 'sun', name: 'Sunday', defaultOpen: false },
];

export default function BusinessHoursSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Business Hours</h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure when your store is open for business and accepting orders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Customers will see these hours on your storefront.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-0 p-0">
          <div className="divide-y divide-separator/50">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.id} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4 w-40">
                  <Switch defaultChecked={day.defaultOpen} />
                  <span className={`text-sm font-medium ${day.defaultOpen ? 'text-text-primary' : 'text-text-muted'}`}>
                    {day.name}
                  </span>
                </div>

                {day.defaultOpen ? (
                  <div className="flex items-center gap-3 flex-1 justify-end sm:justify-start">
                    <select className="w-28 rounded-md border border-separator bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                      <option>09:00 AM</option>
                      <option>08:00 AM</option>
                      <option>10:00 AM</option>
                    </select>
                    <span className="text-text-muted text-sm">to</span>
                    <select className="w-28 rounded-md border border-separator bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                      <option>05:00 PM</option>
                      <option>06:00 PM</option>
                      <option>04:00 PM</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex-1 text-right sm:text-left">
                    <span className="text-sm text-text-muted italic px-3">Closed</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
        <CardFooter className="justify-end border-t border-separator/50 mt-4">
          <Button variant="primary">Save Hours</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
