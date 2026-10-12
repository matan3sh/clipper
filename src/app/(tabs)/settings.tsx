import { ScrollView } from 'react-native';

import { Placeholder } from '@/components/Placeholder';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-paper" contentContainerClassName="px-gutter pb-36 pt-safe-top">
      <Placeholder
        eyebrow="Settings"
        title="Settings"
        body="Default reminders, notification time and currency. Arrives in Phase 5."
      />
    </ScrollView>
  );
}
