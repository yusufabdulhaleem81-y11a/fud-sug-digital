import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { INSTITUTION_FALLBACK, type InstitutionSettings } from '../lib/institution';

export function useInstitution() {
  const [settings, setSettings] = useState<InstitutionSettings>({
    ...INSTITUTION_FALLBACK,
    official_website: null, contact_email: null,
    whatsapp_display: null, whatsapp_intl: null,
  });

  useEffect(() => {
    supabase.from('institution_settings').select('*').limit(1).then(({ data }: any) => {
      if (data && data[0]) setSettings((s) => ({ ...s, ...data[0] }));
    });
  }, []);

  return { settings };
}