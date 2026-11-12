"""Print only what changed since the previous run: price changes, stock changes, new and removed variants.

The first run of a given snapshot name labels every variant "new" (it creates the baseline).
Run it again later, or put it on a schedule, and you only get the differences.

Usage:  python 03_price_change_feed.py [store ...]
Needs:  APIFY_TOKEN in the environment.
"""
from collections import Counter
import os
import sys

from apify_client import ApifyClient

ACTOR_ID = "cedarfetch/shopify-store-scraper"


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.")

    stores = sys.argv[1:] or ["www.deathwishcoffee.com"]
    run_input = {
        "storeUrls": stores,
        "outputMode": "variants",
        "trackChanges": True,
        "changesOnly": True,
        "snapshotStoreName": "price-feed-example",
    }

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    counts = Counter()
    for item in client.dataset(run.default_dataset_id).iterate_items():
        if item["recordType"] != "variant":
            print(f"{item['storeDomain']}: {item['status']} - {item['message']}")
            continue
        kind = item.get("changeType")
        counts[kind] += 1
        label = f"{item['productTitle']} / {item['variantTitle']} (SKU {item.get('sku')})"
        if kind == "price_changed":
            print(f"PRICE  {label}: {item['previousPrice']} -> {item['price']} {item['currency']}")
        elif kind in ("back_in_stock", "out_of_stock"):
            print(f"STOCK  {label}: {kind}")
        elif kind == "removed":
            print(f"GONE   {label}: last price {item.get('previousPrice')}")
        elif kind == "new" and counts["new"] <= 10:
            print(f"NEW    {label}: {item['price']} {item['currency']}  {item['url']}")

    print("Summary:", dict(counts) or "no changes since the last run")


if __name__ == "__main__":
    main()
