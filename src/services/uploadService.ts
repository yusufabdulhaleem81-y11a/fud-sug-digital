import { supabase } from '../lib/supabase';

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? '';
}

function checkImage(file: File, maxMB: number) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) throw new Error('Only JPG, PNG or WebP images allowed.');
  if (file.size > maxMB * 1024 * 1024) throw new Error(`Image must be under ${maxMB}MB.`);
}

/** Upload officer pictures / avatars → returns public URL */
export async function uploadProfilePhoto(file: File, folder: string): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new Error('You must be signed in to upload.');
  checkImage(file, 2);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${uid}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('profile-photos').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
  return data.publicUrl;
}

/** Upload administration cover images → returns public URL */
export async function uploadPublicAsset(file: File, folder: string): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new Error('You must be signed in to upload.');
  checkImage(file, 3);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${uid}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('public-assets').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
  return data.publicUrl;
}