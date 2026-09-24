import { Card } from '../../components/ui';

export default function PhasePlaceholder({ title, phase }: { title: string; phase: string }) {
  return (
    <Card className="p-10 text-center">
      <h1 className="serif text-xl font-bold text-stone-800">{title}</h1>
      <p className="mt-2 text-sm text-stone-500">
        This module is scheduled for <span className="font-semibold text-fud">{phase}</span>.
        The database, permissions, and navigation for it already exist.
      </p>
    </Card>
  );
}