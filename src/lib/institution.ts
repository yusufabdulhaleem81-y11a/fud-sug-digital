export const INSTITUTION_FALLBACK = {
  institution_name: 'Federal University Dutse',
  short_name: 'FUD',
  logo_path: '/branding/fud-logo.png',
  hero_image_path: '/branding/fud-main-gate.png',
  primary_color: '#175339',
  accent_color: '#B48A2E',
} as const;

export type InstitutionSettings = typeof INSTITUTION_FALLBACK & {
  official_website: string | null;
  contact_email: string | null;
  whatsapp_display: string | null;
  whatsapp_intl: string | null;
};