# Task-click analytics for text2me

This adds a small first-party collection endpoint for the static GitHub Pages site. It is **not live until a Cloudflare Worker and D1 database are created and configured**.

## What it records

- An allowlisted task ID.
- The internal page path where the clicked task link points.
- A server-generated UTC timestamp.

It does not intentionally store IP addresses, cookies, referrers, account IDs, names, document contents, or form inputs. The hosting provider may still process network data under its own terms. CORS origin checks reduce accidental cross-origin use but are not authentication and do not prevent all automated abuse.

## 1. Create the D1 database

In Cloudflare Dashboard, open **Workers & Pages → D1 SQL Database**, create a database named `text2me-analytics`, then execute `integrations/task-analytics-schema.sql`.

## 2. Deploy the Worker

Create a Worker named `text2me-task-analytics` and paste the code from `integrations/task-analytics-worker.js`.

Configure:
- Worker variable `ALLOWED_ORIGIN`: `https://rytikov0285.github.io`
- D1 binding variable name: `DB`, selecting `text2me-analytics`
- Worker secret `ADMIN_TOKEN`: generate a long random secret; never put it in the website code or GitHub repository.

The endpoint URLs will be:
- `POST https://YOUR-WORKER.workers.dev/event`
- `GET https://YOUR-WORKER.workers.dev/stats?days=30`

## 3. Connect the site

Edit `assets/analytics-config.js` and set `window.TEXT2ME_ANALYTICS_ENDPOINT` to the full Worker event URL ending in `/event`. Leave it empty to keep remote collection disabled. Commit and deploy the GitHub Pages site.

## 4. Read aggregate stats

Use an authenticated request from your own terminal or API client; do not put the token into browser JavaScript:

```sh
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" "https://YOUR-WORKER.workers.dev/stats?days=30"
```

The response contains total clicks, clicks per task, daily totals, and the most-clicked page paths. It counts click events, not unique people or conversion rates.

## 5. Before enabling collection

- Review the privacy notice and applicable privacy law for the intended audience and operator.
- Decide a data-retention period and add scheduled deletion before production use.
- Add rate limiting/abuse protection if public traffic warrants it.
- Test the endpoint, stats authorization, invalid task IDs, and mobile clicks.
- Do not treat click volume as proof of task completion; use completion events only when the product actually implements that outcome.

GitHub Pages cannot run this Worker itself. Cloudflare account access is required for the deployment steps above.
