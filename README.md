# Shopify store scraper: examples in Python, Node.js and cURL

Working examples for pulling the public product catalog of any Shopify store (products, variants, SKUs, prices, compare-at prices, stock status) with the [Shopify Store Scraper Actor](https://apify.com/cedarfetch/shopify-store-scraper) on Apify. With change tracking on, every row also says whether the product is new, repriced, back in stock, out of stock, unchanged or removed since the last run.

The scripts call the Actor from code with the official Apify API client. If you would rather not use a paid tool, the last section names the public Shopify endpoints it reads, so you can fetch the same data yourself.

## Quick start

You need an Apify API token (Integrations page in Apify Console, https://console.apify.com/account/integrations). Apify's free plan includes monthly platform credit, which is enough to try this.

**Python** (3.11 or newer, required by `apify-client` 3.x):

```bash
cd examples/python
pip install -r requirements.txt
export APIFY_TOKEN=your_token_here      # Windows cmd: set APIFY_TOKEN=your_token_here
python 01_run_and_print.py allbirds.com
```

On Windows, run `set PYTHONUTF8=1` first if the console fails on non-ASCII product titles.

**Node.js** (18 or newer):

```bash
cd examples/node
npm install
export APIFY_TOKEN=your_token_here
node 01-run-and-print.mjs allbirds.com
```

**cURL** (no install, one HTTP call):

```bash
export APIFY_TOKEN=your_token_here
bash examples/curl/run.sh
```

A run of 20 products takes a few seconds. Output looks like this (real rows are in [`sample-output/`](sample-output/)):

```text
Valhalla Java Dark Chocolate Bark | USD 15 to 15 | in_stock | 1 variants
```

## What is in this repository

| Path | What it does |
|---|---|
| `examples/python/01_run_and_print.py` | Run the Actor, wait, print one line per product. |
| `examples/python/02_variants_to_csv.py` | One row per variant to a CSV file (spreadsheet mode). |
| `examples/python/03_price_change_feed.py` | Print only price changes, stock changes, new and removed variants. |
| `examples/node/01-run-and-print.mjs`, `02-variants-to-csv.mjs`, `03-price-change-feed.mjs` | The same three scripts as ES modules. |
| `examples/curl/run.sh`, `input.json` | One-call version using the `run-sync-get-dataset-items` endpoint. |
| `sample-output/products.json`, `variants.json` | Real output, shortened (see below). |

The token is always read from the `APIFY_TOKEN` environment variable. Nothing is hard-coded.

## Input options

Only `storeUrls` is required. The options used most often:

| Field | Default | What it does |
|---|---|---|
| `storeUrls` | (required) | Stores to read. Accepts `allbirds.com`, `https://www.allbirds.com/`, `store-name.myshopify.com`, a collection URL (`https://kith.com/collections/footwear`, only that collection) or a product URL (only that product). |
| `maxProductsPerStore` | 0 (all) | Stop after this many products per store. Handy for sampling. |
| `outputMode` | `products` | `products`: one row per product, variants nested. `variants`: one flat row per variant. |
| `collectionHandles` | none | Read only these collections (the part after `/collections/` in the URL) in every store. |
| `updatedAfter` | none | Keep products whose `updated_at` is on or after an ISO date or a relative value such as `7 days`. |
| `trackChanges` | false | Compare with the previous run and label every row (`changeType`). |
| `changesOnly` | false | With tracking on, skip unchanged rows. |
| `snapshotStoreName` | `shopify-store-scraper-snapshots` | Named key-value store that holds the snapshots. Use different names for independent tracking jobs. |
| `includeCollections` | false | Attach the collections each product belongs to (extra requests). |
| `enrichVariants` | false | One extra request per product to add barcodes and, where the store publishes it, `inventoryQuantity`. |

The Actor has more options (`concurrency`, `requestDelayMs`, `maxRetries` and others). See its [listing](https://apify.com/cedarfetch/shopify-store-scraper) for the full input reference.

## Output

Rows go to the run's default dataset. `recordType` tells you what a row is: `product`, `variant` (variants mode) or `store_status` (a store that could not be read; these rows are free). One product row from [`sample-output/products.json`](sample-output/products.json), shortened:

```json
{
    "recordType": "product",
    "storeDomain": "www.deathwishcoffee.com",
    "productId": 6635123015735,
    "handle": "valhalla-java-dark-chocolate-bark",
    "url": "https://www.deathwishcoffee.com/products/valhalla-java-dark-chocolate-bark",
    "title": "Valhalla Java Dark Chocolate Bark",
    "vendor": "Ethereal Confections",
    "productType": "Chocolate",
    "tags": [
        "Gifting",
        "Merch",
        "Valhalla Java",
        "Valhalla Java Odinforce Blend"
    ],
    "currency": "USD",
    "priceMin": 15,
    "priceMax": 15,
    "compareAtPriceMin": null,
    "onSale": false,
    "discountPercent": 0,
    "available": true,
    "availabilityStatus": "in_stock",
    "variantCount": 1,
    "availableVariantCount": 1,
    "variants": [
        {
            "variantId": 39660132106295,
            "title": "1 Pack",
            "sku": "LFVJBK04",
            "price": 15,
            "compareAtPrice": null,
            "available": true,
            "grams": 9
        }
    ],
    "source": "products_json",
    "scrapedAt": "2026-11-12T00:45:37.078Z"
}
```

One row in `variants` mode ([`sample-output/variants.json`](sample-output/variants.json)):

```json
{
    "recordType": "variant",
    "storeDomain": "www.deathwishcoffee.com",
    "productTitle": "Valhalla Java Dark Chocolate Bark",
    "variantTitle": "1 Pack",
    "sku": "LFVJBK04",
    "option1Name": "Size",
    "option1Value": "1 Pack",
    "currency": "USD",
    "price": 15,
    "compareAtPrice": null,
    "onSale": false,
    "available": true,
    "url": "https://www.deathwishcoffee.com/products/valhalla-java-dark-chocolate-bark?variant=39660132106295"
}
```

The sample files come from running the Actor itself against a public store on 2026-11-11 and keep every field of each row. Only length was cut: long text is truncated with `...` and lists show their first few entries.

With change tracking on, rows also carry `changeType` (`new`, `price_changed`, `back_in_stock`, `out_of_stock`, `unchanged`, `removed`), `changes`, and the previous price and availability (`previousPriceMin`, `previousPriceMax`, `previousAvailable` in products mode; `previousPrice` in variants mode).

## Recipes

**Daily price-change feed.** [`03_price_change_feed.py`](examples/python/03_price_change_feed.py) runs with `trackChanges` and `changesOnly`, so each run returns only the variants whose price or stock changed, plus new and removed ones. The first run labels everything `new` because it creates the baseline. Schedule the same input daily in Apify Console to get a feed, and you pay only for the rows that changed.

**Catalog to spreadsheet.** [`02_variants_to_csv.py`](examples/python/02_variants_to_csv.py) uses `outputMode: "variants"`, which gives flat rows (options in `option1Name` / `option1Value` columns, tags as text) that open cleanly in a spreadsheet.

**Sale items only.** Pass a collection URL or `collectionHandles: ["sale"]` to read one collection. Rows have `onSale` and `discountPercent`, computed from the compare-at price.

**Stock alerts.** With tracking on, `back_in_stock` and `out_of_stock` rows are the alerts. Product-level stock means "any variant purchasable": if one size sells out but others remain, the product stays `unchanged` and its `changes` list contains `variant_sold_out`. In variants mode each variant gets its own label.

**Recently touched products.** `updatedAfter: "7 days"` keeps products Shopify changed recently. Shopify bumps `updated_at` on most edits, including stock, so this is a "recently touched" filter, not a "price changed" filter. Use change tracking for exact changes.

## Guide

Step-by-step write-up of the underlying endpoint, its limits and a do-it-yourself version: [How to export every product from a Shopify store with /products.json](https://dev.to/cedarfetch/how-to-export-every-product-from-a-shopify-store-with-productsjson-5dne).

## n8n workflow

[`n8n/shopify-price-and-stock-changes-to-slack.json`](n8n/shopify-price-and-stock-changes-to-slack.json) is an importable n8n workflow (core nodes only) that runs the Actor once a day with change tracking and posts one Slack message with the price and stock changes, or nothing when nothing changed. A disabled Send Email node is included for people who do not use Slack. Setup, cost per run and the 300-second limit are in [`n8n/README.md`](n8n/README.md).

## Pricing

The Actor uses pay-per-event pricing. Prices shown on the [Apify listing](https://apify.com/cedarfetch/shopify-store-scraper) when this repository was written (2026-11-11):

- Product row: $0.0008 each (from $0.80 per 1,000 products). Products mode is charged per product row.
- Variant row: $0.0001 each, in variants mode.
- Actor start: $0.00005 per GB of run memory, minimum one event.
- `removed` rows from change tracking count as results. With `changesOnly`, unchanged rows are not delivered and not charged.
- Rows describing stores that could not be read are free.

Apify's free plan includes monthly platform credit that you can use to try the Actor. Prices can change, so check the Pricing tab of the listing before you schedule anything. Set Maximum cost per run in the run options, or `maxTotalChargeUsd` in the API client, to cap spending.

## Limits and honest caveats

- Public data only. It reads what any shopper's browser can read without logging in. Unpublished products, wholesale and B2B catalogs, customer-specific prices and admin data are out of reach by design.
- Password-protected stores are not supported and are reported as `password_protected`.
- Bot protection is not bypassed. A few stores put Cloudflare, Vercel or similar challenges in front of their catalog. Those are reported as `blocked`.
- Headless Shopify stores (custom frontend on another platform, for example Hydrogen on Vercel) usually do not expose the catalog endpoints on their main domain and are reported as `not_shopify`. If you know the store's `*.myshopify.com` domain, try that.
- Currency is the store's base currency from `/meta.json`. Stores selling in several currencies through Shopify Markets show base-currency prices; `currency` is `null` if a store hides `/meta.json`.
- Stock counts (`inventoryQuantity`) appear only with `enrichVariants` and only when the store publishes them. Otherwise you get `available` true or false per variant.
- Stores above 25,000 products are read beyond that limit through the sitemap, one request per extra product, so they take longer.
- Removed products are reported only after a complete read of the same scope. A run capped by `maxProductsPerStore` never labels anything removed.
- You are responsible for how you use the data and for respecting each site's terms.
- The sync endpoint used by `run.sh` answers 408 after 300 seconds. For large stores use the Python or Node examples, which wait for the run to finish.

## Do it yourself (no paid tool)

Every Shopify storefront serves its public catalog as JSON. The Actor reads these endpoints:

| Endpoint | What you get |
|---|---|
| `https://<store>/products.json?limit=250&page=1` | Up to 250 products per page, with variants, prices, SKUs and availability. Keep increasing `page` until it returns an empty list. |
| `https://<store>/collections/<handle>/products.json` | The same, for one collection. |
| `https://<store>/products/<handle>.js` | One product, including barcodes and (when published) inventory quantity. |
| `https://<store>/meta.json` | Store name, currency and other basics. |
| `https://<store>/sitemap.xml` | Product URLs, used when a store hides `products.json` or has more than the listing limit. |

`/products.json` serves at most 25,000 products (100 pages of 250). Some stores disable it. Prices there are strings, so convert them to numbers. A minimal Python version using only the standard library:

```python
import json
import time
import urllib.request

store = "www.deathwishcoffee.com"
page = 1
while True:
    url = f"https://{store}/products.json?limit=250&page={page}"
    request = urllib.request.Request(url, headers={"User-Agent": "catalog-reader/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        products = json.load(response)["products"]
    if not products:
        break
    for product in products:
        for variant in product["variants"]:
            print(product["title"], variant["sku"], variant["price"], variant["available"])
    page += 1
    time.sleep(0.5)  # be polite
```

What the paid Actor adds on top: automatic fallback through the sitemap for big or locked-down stores, retries and backoff on rate limits, typed numbers, sale and discount maths, per-store error reporting, and the snapshot comparison behind `changeType`. If you only need one store once, the script above is enough.

## Related

Other example repositories from Cedarfetch Labs:

- [ats-jobs-scraper-examples](https://github.com/cedarfetch/ats-jobs-scraper-examples): Greenhouse, Lever, Ashby and other applicant-tracking-system job boards
- [remote-jobs-scraper-examples](https://github.com/cedarfetch/remote-jobs-scraper-examples): remote jobs from seven public boards
- [substack-scraper-examples](https://github.com/cedarfetch/substack-scraper-examples): Substack newsletter posts as Markdown
- [google-trending-searches-examples](https://github.com/cedarfetch/google-trending-searches-examples): what is trending on Google right now, per country

Listing: https://apify.com/cedarfetch/shopify-store-scraper

Not affiliated with Shopify.

Maintained by Cedarfetch Labs, the developer of this Actor.
