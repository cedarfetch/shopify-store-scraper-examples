// Print only what changed since the previous run: price changes, stock changes, new and removed variants.
//
// The first run of a given snapshot name labels every variant "new" (it creates the baseline).
// Run it again later, or put it on a schedule, and you only get the differences.
//
// Usage:  node 03-price-change-feed.mjs [store ...]
// Needs:  APIFY_TOKEN in the environment.
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/shopify-store-scraper';
const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const stores = process.argv.length > 2 ? process.argv.slice(2) : ['www.deathwishcoffee.com'];
const runInput = {
    storeUrls: stores,
    outputMode: 'variants',
    trackChanges: true,
    changesOnly: true,
    snapshotStoreName: 'price-feed-example',
};

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

const counts = {};
for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType !== 'variant') {
        console.log(`${item.storeDomain}: ${item.status} - ${item.message}`);
        continue;
    }
    const kind = item.changeType;
    counts[kind] = (counts[kind] ?? 0) + 1;
    const label = `${item.productTitle} / ${item.variantTitle} (SKU ${item.sku})`;
    if (kind === 'price_changed') {
        console.log(`PRICE  ${label}: ${item.previousPrice} -> ${item.price} ${item.currency}`);
    } else if (kind === 'back_in_stock' || kind === 'out_of_stock') {
        console.log(`STOCK  ${label}: ${kind}`);
    } else if (kind === 'removed') {
        console.log(`GONE   ${label}: last price ${item.previousPrice}`);
    } else if (kind === 'new' && counts.new <= 10) {
        console.log(`NEW    ${label}: ${item.price} ${item.currency}  ${item.url}`);
    }
}
console.log('Summary:', Object.keys(counts).length ? counts : 'no changes since the last run');
