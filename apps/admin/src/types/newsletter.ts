export type NewsletterSource = 'landing_footer' | 'manual' | 'otro';

export type NewsletterStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: NewsletterSource;
  status: NewsletterStatus;
  created_at: string;
}

export const NEWSLETTER_SOURCE_LABEL: Record<NewsletterSource, string> = {
  landing_footer: 'Landing',
  manual: 'Manual',
  otro: 'Otro',
};

export const NEWSLETTER_STATUS_LABEL: Record<NewsletterStatus, string> = {
  active: 'Activo',
  unsubscribed: 'Desuscrito',
  bounced: 'Rebotado',
  complained: 'Marcado como spam',
};