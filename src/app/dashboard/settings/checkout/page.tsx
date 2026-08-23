import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

export default function CheckoutSettingsPage() {
    return (
        <div className="max-w-3xl space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
                <p className="text-sm text-secondary mt-1">Manage what information is required during checkout.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer information</CardTitle>
                    <CardDescription>Select what information you require from customers at checkout.</CardDescription>
                </CardHeader>
                <CardBody className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Require phone number</p>
                            <p className="text-xs text-secondary mt-1">Customers must enter a valid phone number to complete purchase.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="w-full h-px bg-separator opacity-50" />

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Require email address</p>
                            <p className="text-xs text-secondary mt-1">Customers must enter an email to receive order confirmation.</p>
                        </div>
                        <Switch />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Order processing</CardTitle>
                    <CardDescription>Configure how orders are handled and fulfilled.</CardDescription>
                </CardHeader>
                <CardBody className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Automatically fulfill digital orders</p>
                            <p className="text-xs text-secondary mt-1">Digital products are sent immediately after successful payment.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardBody>
                <CardFooter className="justify-end bg-surface-elevated/30">
                    <Button variant="primary">Save changes</Button>
                </CardFooter>
            </Card>

            <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive">Demo Data</CardTitle>
                    <CardDescription className="text-destructive/80">Generate fake orders and customers for testing purposes.</CardDescription>
                </CardHeader>
                <CardBody>
                    <p className="text-sm text-secondary">This will populate your store with mock data. Useful for visualizing your dashboard before going live.</p>
                </CardBody>
                <CardFooter className="border-destructive/30">
                    <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">Generate Demo Data</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
