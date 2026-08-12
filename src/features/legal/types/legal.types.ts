// Matches misc_api.legal_pages / legal_page_detail.
// Note: keyed by `slug` (no numeric id).
export interface LegalPage {
  slug: string;
  title: string;
  body: string;
  last_updated: string | null; // ISO datetime
}
