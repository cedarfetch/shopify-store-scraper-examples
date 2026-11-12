// Run the Shopify Store Scraper on one store and print one line per product.
//
// Usage:  node 01-run-and-print.mjs [store]
// Needs:  APIFY_TOKEN in the environment.
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/shopify-store-scraper';
const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const store = process.argv[2] ?? 'www.deathwishcoffee.com';
const runInput = { storeUrls: [store], maxProductsPerStore: 20 };

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType === 'store_status') {
        // Stores that could not be read come back as free status rows.
        console.log(`${item.storeDomain}: ${item.status} - ${item.message}`);
        continue;
    }
    console.log(
        `${item.title} | ${item.currency} ${item.priceMin} to ${item.priceMax}`
        + ` | ${item.availabilityStatus} | ${item.variantCount} variants`,
    );
}
