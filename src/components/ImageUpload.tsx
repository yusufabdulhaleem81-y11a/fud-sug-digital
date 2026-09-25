import { useRef, useState, type ChangeEvent } from 'react';
import { uploadProfilePhoto, uploadPublicAsset } from '../services/uploadService';
import { Button, Icon, useToast } from './ui';

export default function ImageUpload({
  label, onUploaded, bucket = 'profile-photos', folder, previewUrl,
}: {
  label: string;
  onUploaded: (url: string) => void;
  bucket?: 'profile-photos' | 'public-assets';
  folder: string;
  previewUrl?: string | null;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = bucket === 'public-assets'
        ? await uploadPublicAsset(file, folder)
        : await uploadProfilePhoto(file, folder);
      setPreview(url);
      onUploaded(url);
      toast('Image uploaded');
    } catch (err: any) {
      toast(err.message ?? 'Upload failed', true);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="fx" style={{ gap: 14 }}>
        {preview ? (
          <img src={preview} alt="preview"
            style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--line2)' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--green-soft)', display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
            <Icon name="user" className="ic-lg" />
          </div>
        )}
        <div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} hidden />
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Uploading…' : preview ? 'Change image' : 'Upload image'}
          </Button>
          <p className="fine" style={{ marginTop: 6 }}>JPG, PNG or WebP</p>
        </div>
      </div>
    </div>
  );
}