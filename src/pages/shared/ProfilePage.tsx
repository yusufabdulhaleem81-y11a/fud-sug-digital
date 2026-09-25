
import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentAdministration } from '../../hooks/useCurrentAdministration';
import ImageUpload from '../../components/ImageUpload';
import { Avatar, Badge, Button, Field, FormError, Input, MetaCell, MetaGrid, PageHeader, Panel, PanelBody, PanelHead, useToast } from '../../components/ui';

export default function ProfilePage() {
  const { profile, refresh } = useAuth();
  const { administration } = useCurrentAdministration();
  const toast = useToast();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPhoto(url: string) {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    if (error) { toast(error.message, true); return; }
    await refresh();
    toast('Profile photo updated');
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw1.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (pw1 !== pw2) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      setPw1(''); setPw2('');
      toast('Password changed successfully');
    } catch (err: any) {
      setError(err.message ?? 'Could not change password. Try signing out and back in, then again.');
    } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your photo, account details and password." />

      <Panel className="mb24">
        <PanelBody>
          <div className="fx" style={{ gap: 16 }}>
            <Avatar name={profile?.full_name ?? 'User'} src={profile?.avatar_url} size={72} />
            <div>
              <h3 style={{ fontSize: 20 }}>{profile?.full_name}</h3>
              <p className="mut small">{profile?.email}</p>
              <div style={{ marginTop: 6 }}><Badge tone="green">{profile?.role}</Badge></div>
            </div>
          </div>
          <MetaGrid className="mt24">
            <MetaCell label="Role">{profile?.role}</MetaCell>
            <MetaCell label="Verification">{profile?.verification}</MetaCell>
            <MetaCell label="Administration">{administration ? administration.academic_session : '—'}</MetaCell>
            <MetaCell label="Status">{profile?.is_active ? 'Active' : 'Deactivated'}</MetaCell>
          </MetaGrid>
          <div className="mt24">
            <ImageUpload label="Change your profile photo" folder="avatar"
              previewUrl={profile?.avatar_url} onUploaded={onPhoto} />
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead title="Change password" />
        <PanelBody>
          <form onSubmit={onChangePassword}>
            {error && <FormError>{error}</FormError>}
            <Field label="New password" hint="At least 6 characters — mix letters, numbers and a symbol.">
              <Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} required minLength={6} />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} />
            </Field>
            <Button type="submit" disabled={busy}>{busy ? 'Changing…' : 'Change password'}</Button>
          </form>
        </PanelBody>
      </Panel>
    </div>
  );
}