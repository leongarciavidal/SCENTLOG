-- =============================================================================
-- SCENTLOG — Store brand countries as ISO 3166-1 alpha-2 codes
-- -----------------------------------------------------------------------------
-- Codes ("FR") can be shown in any language by the app ("Francia", "France"),
-- whereas free-text English names could not. Existing values are converted.
-- =============================================================================

update public.brands
set country = case country
  when 'France' then 'FR'
  when 'United States' then 'US'
  when 'Sweden' then 'SE'
  when 'Italy' then 'IT'
  when 'United Kingdom' then 'GB'
  when 'Spain' then 'ES'
  when 'Germany' then 'DE'
  else country
end
where country is not null;

alter table public.brands
  add constraint brands_country_iso check (country is null or country ~ '^[A-Z]{2}$');
