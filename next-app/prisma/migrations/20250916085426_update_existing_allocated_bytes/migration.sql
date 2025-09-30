-- Update existing NULL or 0 allocated_bytes based on user's storage tier

-- FREE_500MB: 500MB = 524288000 bytes
UPDATE "public"."user_storage_quotas"
SET "allocated_bytes" = 524288000
WHERE ("allocated_bytes" IS NULL OR "allocated_bytes" = 0)
  AND "tier" = 'FREE_500MB';

-- BASIC_5GB: 5GB = 5368709120 bytes
UPDATE "public"."user_storage_quotas"
SET "allocated_bytes" = 5368709120
WHERE ("allocated_bytes" IS NULL OR "allocated_bytes" = 0)
  AND "tier" = 'BASIC_5GB';

-- PRO_50GB: 10GB = 10737418240 bytes (temporarily set to 10GB for testing)
UPDATE "public"."user_storage_quotas"
SET "allocated_bytes" = 10737418240
WHERE ("allocated_bytes" IS NULL OR "allocated_bytes" = 0)
  AND "tier" = 'PRO_50GB';

-- ENTERPRISE_500GB: 500GB = 536870912000 bytes
UPDATE "public"."user_storage_quotas"
SET "allocated_bytes" = 536870912000
WHERE ("allocated_bytes" IS NULL OR "allocated_bytes" = 0)
  AND "tier" = 'ENTERPRISE_500GB';

-- UNLIMITED: Set to max safe integer value
UPDATE "public"."user_storage_quotas"
SET "allocated_bytes" = 9007199254740991
WHERE ("allocated_bytes" IS NULL OR "allocated_bytes" = 0)
  AND "tier" = 'UNLIMITED';