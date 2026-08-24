import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

export default function GeneralSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General</h1>
        <p className="text-sm  mt-1">Manage your store&apos;s basic information and identity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Details</CardTitle>
          <CardDescription>Your store&apos;s name and contact information.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Store Name"
            defaultValue="Northstar Commerce"
            hint="This is the name that appears on your store and in emails."
          />
          <FormField
            label="Store Contact Email"
            type="email"
            defaultValue="hello@northstar.com"
            hint="This is the email address customers will contact you at."
          />
          <FormField
            label="Store Currency"
            defaultValue="Ghana Cedi (GHS)"
            disabled
            hint="Currency cannot be changed after your first order is processed."
          />
        </CardBody>
        <CardFooter className="justify-end bg-surface-elevated/30">
          <Button variant="primary">Save changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
