-- Script to add new fields to links table
-- Run this if you have existing data and don't want to lose it

USE affiliate_tracking;

-- Add name field
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL 
COMMENT 'Назва посилання для ідентифікації';

-- Add source_type field
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS source_type ENUM(
  'social_media',
  'email_marketing',
  'bloggers_influencers',
  'search_ads',
  'seo_traffic',
  'messengers',
  'own_website',
  'other'
) NULL 
COMMENT 'Тип джерела трафіку';

