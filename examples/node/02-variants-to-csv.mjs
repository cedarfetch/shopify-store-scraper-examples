// Export every variant of a store to a CSV file, one row per variant.
//
// Usage:  node 02-variants-to-csv.mjs [store] [out.csv] [maxProducts]
//         maxProducts 0 means the whole catalog (you pay per variant row).
// Needs:  APIFY_TOKEN in the environment.
import { writeFileSync } from 'node:fs';
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/shopify-store-scraper';

const FIELDS = [
    'storeDomain',
    'productTitle',
    'variantTitle',
    'sku',
    'price',
    'compareAtPrice',
    'onSale',
    'discountPercent',
    'available',
    'url',
];

function csvCell(value) {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const store = process.argv[2] ?? 'www.deathwishcoffee.com';
const outPath = process.argv[3] ?? 'variants.csv';
const maxProducts = Number(process.argv[4] ?? 100);
const runInput = { storeUrls: [store], outputMode: 'variants', maxProductsPerStore: maxProducts };

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

const lines = [FIELDS.join(',')];
for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType !== 'variant') {
        console.log(`${item.storeDomain}: ${item.status} - ${item.message}`);
        continue;
    }
    lines.push(FIELDS.map((field) => csvCell(item[field])).join(','));
}
writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${lines.length - 1} variant rows to ${outPath}`);
