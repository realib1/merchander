import { SettingsSidebar } from './components/SettingsSidebar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto">
      {/* Inner Sidebar */}
      <aside className="w-full md:w-60 shrink-0 md:sticky md:top-4 md:self-start z-10">
        <SettingsSidebar />
      </aside>

      {/* Main Settings Content */}
      <main className="flex-1 min-w-0 pb-12">{children}</main>
    </div>
  );
}
