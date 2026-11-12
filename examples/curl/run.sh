#!/usr/bin/env bash
# Run the Actor synchronously and print the dataset items as JSON.
# Usage: APIFY_TOKEN=... ./run.sh > items.json
# The sync endpoint answers 408 if the run takes longer than 300 seconds.
# For long runs use the Python or Node examples, which wait as long as needed.
set -euo pipefail

: "${APIFY_TOKEN:?APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console.}"

HERE="$(cd "$(dirname "$0")" && pwd)"

curl --fail-with-body -sS -X POST \
  "https://api.apify.com/v2/actors/cedarfetch~shopify-store-scraper/run-sync-get-dataset-items" \
  -H "Authorization: Bearer ${APIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  --data @"${HERE}/input.json"
