-- Migration: Add column is_auto_assigned to user_permissions
-- Digunakan oleh: Server/utils/surveyPermissions.js

ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS is_auto_assigned BOOLEAN DEFAULT FALSE;
