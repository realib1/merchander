import { SettingsSidebar } from './components/SettingsSidebar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl h-full">
      {/* Inner Sidebar */}
      <div className="w-full md:w-64 shrink-0 h-full overflow-hidden">
        <SettingsSidebar />
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar pb-10">{children}</div>
    </div>
  );
}
