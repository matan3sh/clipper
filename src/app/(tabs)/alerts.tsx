import { ScrollView } from 'react-native';

import { Placeholder } from '@/components/Placeholder';

export default function AlertsScreen() {
  return (
    <ScrollView className="flex-1 bg-paper" contentContainerClassName="px-gutter pb-36 pt-safe-top">
      <Placeholder
        eyebrow="Alerts"
        title="Alerts"
        body="Every scheduled reminder, in date order. Arrives in Phase 4."
      />
    </ScrollView>
  );
}
