import { Metadata } from 'next';
import { getTenantModuleSettingsAction } from '@/app/actions/tenant-modules';
import { ModuleCustomizerClient } from './components/ModuleCustomizerClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Business Modules | Merchander',
  description: 'Tailor your workspace modules, archetype presets, and navigation visibility.',
};

export default async function BusinessModulesPage() {
  const settingsResult = await getTenantModuleSettingsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          Business Modules & Workspace Customizer
        </h1>
        <p className="text-sm text-muted mt-1">
          Enable only the operational tools your business needs to keep menus, navigation, and staff forms fast and intuitive.
        </p>
      </div>

      <ModuleCustomizerClient
        initialArchetype={settingsResult.archetype || 'import_resale'}
        initialModules={settingsResult.enabledModules || []}
        tier={settingsResult.tier || 'starter'}
      />
    </div>
  );
}
