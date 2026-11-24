/**
 * Identity shown in the legal pages. Set these environment variables before
 * launch; until then the pages show the bracketed placeholders.
 */
export const legalConfig = {
  owner: process.env.NEXT_PUBLIC_LEGAL_OWNER || "[Owner name or company]",
  taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID || "[Tax ID / NIF]",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "[Postal address]",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[contact email]",
  jurisdiction: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION || "[country]",
  updated: "2026-11-29",
};
