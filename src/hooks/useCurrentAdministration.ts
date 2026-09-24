import { useEffect, useState } from 'react';
import { getCurrentAdministration } from '../services/administrationService';
import type { Administration } from '../types/models';

export function useCurrentAdministration() {
  const [administration, setAdministration] = useState<Administration | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getCurrentAdministration().then(setAdministration).finally(() => setLoading(false));
  }, []);
  return { administration, loading };
}