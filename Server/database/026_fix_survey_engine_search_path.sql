-- Migration 026: Fix search_path on survey_engine trigger functions
-- When triggers fire in survey_engine (such as validate_survey_links and assert_draft_template),
-- they query unqualified tables like `template_products`. If the session search_path does not include
-- `survey_engine`, PostgreSQL throws error: relation "template_products" does not exist.

ALTER FUNCTION survey_engine.validate_survey_links() SET search_path = survey_engine, public;
ALTER FUNCTION survey_engine.assert_draft_template() SET search_path = survey_engine, public;
