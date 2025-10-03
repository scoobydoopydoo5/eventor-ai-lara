-- Fix location_lat and location_lng to support proper latitude/longitude ranges
-- Latitude ranges from -90 to 90, Longitude from -180 to 180
-- Using numeric(9,6) for lat and numeric(10,6) for lng gives us good precision

ALTER TABLE public.events 
  ALTER COLUMN location_lat TYPE numeric(9,6),
  ALTER COLUMN location_lng TYPE numeric(10,6);