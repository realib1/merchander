import { SettingsSidebar } from './components/SettingsSidebar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
      {/* Inner Sidebar */}
      <div className="w-full md:w-64 shrink-0 md:sticky md:top-0 md:self-start z-10">
        <SettingsSidebar />
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 min-w-0 pb-10">{children}</div>
    </div>
  );
}
