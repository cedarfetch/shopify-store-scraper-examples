"""Export every variant of a store to a CSV file, one row per variant.

Usage:  python 02_variants_to_csv.py [store] [out.csv] [max_products]
        max_products 0 means the whole catalog (you pay per variant row).
Needs:  APIFY_TOKEN in the environment.
"""
import csv
import os
import sys

from apify_client import ApifyClient

ACTOR_ID = "cedarfetch/shopify-store-scraper"

FIELDS = [
    "storeDomain",
    "productTitle",
    "variantTitle",
    "sku",
    "price",
    "compareAtPrice",
    "onSale",
    "discountPercent",
    "available",
    "url",
]


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.")

    store = sys.argv[1] if len(sys.argv) > 1 else "www.deathwishcoffee.com"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "variants.csv"
    max_products = int(sys.argv[3]) if len(sys.argv) > 3 else 100

    run_input = {"storeUrls": [store], "outputMode": "variants", "maxProductsPerStore": max_products}

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    rows = 0
    with open(out_path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        for item in client.dataset(run.default_dataset_id).iterate_items():
            if item["recordType"] != "variant":
                print(f"{item['storeDomain']}: {item['status']} - {item['message']}")
                continue
            writer.writerow(item)
            rows += 1
    print(f"Wrote {rows} variant rows to {out_path}")


if __name__ == "__main__":
    main()
