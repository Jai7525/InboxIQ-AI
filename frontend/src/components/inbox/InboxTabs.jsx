import { Tabs } from "../ui/Tabs";

export function InboxTabs({ tabs, activeTab, onChange }) {
  return <Tabs tabs={tabs} activeTab={activeTab} onChange={onChange} />;
}
