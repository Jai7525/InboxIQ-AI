import { Tabs } from "../ui/Tabs";

export function SettingsTabs({ tabs, activeTab, onChange }) {
  return <Tabs tabs={tabs} activeTab={activeTab} onChange={onChange} />;
}
