"""Run the Shopify Store Scraper on one store and print one line per product.

Usage:  python 01_run_and_print.py [store]
Needs:  APIFY_TOKEN in the environment.
"""
import os
import sys

from apify_client import ApifyClient

ACTOR_ID = "cedarfetch/shopify-store-scraper"


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.")

    store = sys.argv[1] if len(sys.argv) > 1 else "www.deathwishcoffee.com"
    run_input = {"storeUrls": [store], "maxProductsPerStore": 20}

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    for item in client.dataset(run.default_dataset_id).iterate_items():
        if item["recordType"] == "store_status":
            # Stores that could not be read come back as free status rows.
            print(f"{item['storeDomain']}: {item['status']} - {item['message']}")
            continue
        print(
            f"{item['title']} | {item['currency']} {item['priceMin']} to {item['priceMax']}"
            f" | {item['availabilityStatus']} | {item['variantCount']} variants"
        )


if __name__ == "__main__":
    main()
