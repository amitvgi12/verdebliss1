#!/usr/bin/env bash

set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN for schema drift checks.}"
: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF for schema drift checks.}"
: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD for schema drift checks.}"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is required for schema drift checks." >&2
  exit 1
fi

migration_dir="supabase/migrations"
created_migration_dir=false
baseline_migration=""
drift_slug="ci_schema_drift"

cleanup() {
  if [[ -n "${baseline_migration}" ]]; then
    rm -f "${baseline_migration}"
  fi
  find "${migration_dir}" -type f -name "*_${drift_slug}.sql" -delete 2>/dev/null || true
  if [[ "${created_migration_dir}" == "true" ]]; then
    rmdir "${migration_dir}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ ! -d "${migration_dir}" ]]; then
  mkdir -p "${migration_dir}"
  created_migration_dir=true
fi

if ! compgen -G "${migration_dir}/*.sql" >/dev/null; then
  baseline_migration="${migration_dir}/00000000000000_schema.sql"
  cp supabase/schema.sql "${baseline_migration}"
fi

supabase link --project-ref "${SUPABASE_PROJECT_REF}" --password "${SUPABASE_DB_PASSWORD}"
supabase db diff --linked --schema public --use-migra --file "${drift_slug}"

drift_file="$(find "${migration_dir}" -type f -name "*_${drift_slug}.sql" | sort | tail -n 1)"

if [[ -n "${drift_file}" && -s "${drift_file}" ]]; then
  echo "Schema drift detected between supabase/schema.sql and the linked Supabase project:" >&2
  cat "${drift_file}" >&2
  exit 1
fi

echo "No schema drift detected."
