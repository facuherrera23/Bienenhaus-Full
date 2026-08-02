import { supabase } from './supabase';

export type NewsletterSource = 'landing_footer' | 'manual' | 'otro';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: NewsletterSource;
  status: string;
  created_at: string;
}

export const NEWSLETTER_SOURCE_LABEL: Record<NewsletterSource, string> = {
  landing_footer: 'Landing',
  manual: 'Manual',
  otro: 'Otro',
};

export async function fetchSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, source, status, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as NewsletterSubscriber[];
}

export async function deleteSubscriber(id: string): Promise<void> {
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Soft Delete (Papelera)
// ---------------------------------------------------------------------------

export async function softDeleteSubscriber(id: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function restoreSubscriber(id: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ deleted_at: null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function permanentDeleteSubscriber(id: string): Promise<void> {
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchDeletedSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, source, status, created_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as NewsletterSubscriber[];
}
