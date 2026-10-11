import { AppText, Card, Screen } from '@/components/ui';

/** Production Console lite (PRD §7.10). Web-only, staff login. Placeholder until the backend exists. */
export default function ProductionConsole() {
  return (
    <Screen>
      <AppText variant="title">Production Console</AppText>
      <Card>
        <AppText muted>
          Orders, print-shop handoff, 3D files and shipping will appear here once the backend is connected.
        </AppText>
      </Card>
    </Screen>
  );
}
