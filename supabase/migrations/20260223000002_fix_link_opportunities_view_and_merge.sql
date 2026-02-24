-- Fix web_intel_link_opportunities view column aliases
-- The underlying table uses source_domain/domain_rating but workflows expect domain/domain_authority
-- PostgreSQL doesn't allow column renames via CREATE OR REPLACE, so DROP+CREATE is needed

DROP VIEW IF EXISTS public.web_intel_link_opportunities;
CREATE VIEW public.web_intel_link_opportunities AS
SELECT id, source_domain AS domain, source_url AS source, opportunity_type,
       domain_rating AS domain_authority, status, notes, created_at, updated_at
FROM web_intel.link_opportunities;
GRANT SELECT ON public.web_intel_link_opportunities TO authenticated, anon;
