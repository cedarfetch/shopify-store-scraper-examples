# n8n workflow: Shopify price and stock changes to Slack (daily)

[`shopify-price-and-stock-changes-to-slack.json`](shopify-price-and-stock-changes-to-slack.json) is an importable n8n workflow. Once a day it runs the [Shopify Store Scraper Actor](https://apify.com/cedarfetch/shopify-store-scraper) with change tracking on, one row per variant, and posts **one Slack message** listing the price changes, back-in-stock, out-of-stock, new and removed variants. When nothing changed, nothing is sent.

```text
Schedule (daily 07:00) -> HTTP Request (Apify, changes only) -> IF (change row?) -> Code (one message) -> Slack
                                                                                                    \-> Send Email (disabled alternative)
```

It uses n8n core nodes only, so it imports on n8n Cloud and self-hosted n8n without installing anything. It was import-tested on n8n 2.47.5.

The message lists up to 40 changes, price changes first, with a link to each variant, and ends with a warning line for any store that could not be read (password-protected, blocked, not a Shopify store...).

## Setup (3 steps)

In n8n: **Workflows > Import from File** and pick the JSON file. Then:

1. **Apify token.** Open the *Run Shopify Store Scraper* node and create a **Header Auth** credential called `Apify API token`: Name `Authorization`, Value `Bearer <your token>`. The token is on the API & Integrations page of Apify Console.
2. **Slack.** Open *Send Slack message*, connect Slack, and replace `#replace-with-your-channel` with your channel (invite the Slack app to it). **No Slack?** Disable that node, enable *Send Email (alternative to Slack)*, add an SMTP credential and replace `sender@example.com` and `recipient@example.com`.
3. **Stores.** Edit `storeUrls` in the JSON body of the HTTP node. It accepts `allbirds.com`, `store-name.myshopify.com` or a collection URL such as `https://kith.com/collections/footwear`. The default is one public store so the first run works as is.

Activate the workflow. Sticky notes inside the workflow repeat these steps.

## What a run costs

Pay per event, at the prices listed in the [main README](../README.md#pricing) (2026-11-11): $0.0001 per variant row (this workflow uses `outputMode: "variants"`) and $0.00005 per GB of memory per Actor start. With `changesOnly`, unchanged variants are not delivered and not charged.

- **First run:** every variant counts as `new` (this creates the baseline). The default store has about 170 products and 330 variants, so about **$0.03**. A 1,000-product store with ~9 variants per product is about $0.90.
- **Daily after that:** only the variants that changed, usually a handful, so well under a cent, plus the start event.
- `maxTotalChargeUsd=0.25` is set as a query parameter on the HTTP node, so one run can never cost more than $0.25. Raise it before you add large stores. Changes that did not fit are delivered by the next run.

Prices can change; check the Pricing tab of the listing.

## The 300-second limit

The workflow calls Apify's `run-sync-get-dataset-items` endpoint, which waits for the run and returns the rows in one response. Apify answers **408 after 300 seconds**; the node timeout is 310 seconds so you see Apify's answer rather than an n8n timeout. One mid-size store takes a few seconds, and `maxProductsPerStore: 1000` keeps the default bounded. A store that hits that cap is not read completely, so its `removed` variants are held back until a complete run. For stores with tens of thousands of products, start the run asynchronously instead (the Python and Node examples in this repository do that).

## Changing the schedule

Open *Every day at 07:00* and change the interval or the hour. The time is in the workflow's time zone (workflow **Settings > Timezone**, which defaults to the instance time zone). Every few hours works too; each run reports the changes since the previous run.

## Good to know

- Every run that reaches Apify, including a manual **Execute workflow** while you test, updates the change-tracking snapshot. A change reported by a test run is not reported again. To start over, change `snapshotStoreName`.
- The first message after a new baseline is long ("N new"), and the following ones are short.
- Variants mode labels each variant on its own. Products mode (`"outputMode": "products"`) gives one row per product and costs $0.0008 per row; the message node handles both.
- Nothing in the file is personal: credentials are referenced by name only, and the channel and email addresses are placeholders.
