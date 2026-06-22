-- Widen abbreviation from CHAR(1) to VARCHAR(3) to support 55+ location types
-- Existing values (A, C, H, S) remain valid VARCHAR(3) values
ALTER TABLE location_types ALTER COLUMN abbreviation TYPE VARCHAR(3);
