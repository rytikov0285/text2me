# DaData party lookup proxy

This Worker keeps the DaData API token on the server side. **Never put the DaData token in public HTML or JavaScript files or a public repository.**

## Deploy

1. Create a Cloudflare Worker from \`integrations/dadata-worker.js\`.
2. Add a secret named \`DADATA_API_KEY\`.
3. Set \`ALLOWED_ORIGIN=https://rytikov0285.github.io\` (origin only; no path).
4. Deploy the Worker and confirm that its route is \`/party\`.
5. Edit \`assets/dadata-config.js\` and set \`window.TEXT2ME_DADATA_ENDPOINT = "https://YOUR-WORKER.workers.dev/party";\`. This file contains only the public endpoint, never the provider token.
6. Test valid company and IP INNs, invalid and non-existent INNs, and provider errors.

The endpoint only accepts POST requests from the configured origin and returns a limited set of fields. It does not cache the response. Configure rate limiting and review the provider's current terms and pricing before production.

## Request

POST /party with JSON body \`{"inn":"7707083893"}\`.

## Response

\`\`\`json
{
  "result": {
    "queryInn": "7707083893",
    "type": "LEGAL",
    "inn": "7707083893",
    "kpp": "770701001",
    "ogrn": "...",
    "name": "...",
    "shortName": "...",
    "address": "...",
    "addressSource": "...",
    "manager": "...",
    "managerTitle": "...",
    "status": "ACTIVE",
    "actualAt": 0,
    "invalid": false
  }
}
\`\`\`

Fields can be null. The UI must present this as a lookup result, not legal verification or proof of authority. The user explicitly applies the result to document fields.

## Security and privacy

- Only send the INN required for lookup.
- Do not log request bodies or personal data.
- Keep the provider token as a Worker secret.
- Do not store lookup results in local autosave unless the user deliberately saves the document.
- Show provider errors clearly; never silently replace manually entered data.


## Current integration state

The repository contains the client-side lookup panel and the Worker proxy template. The lookup is not live until the Worker is deployed, its secret and allowed origin are configured, and `assets/dadata-config.js` points to the deployed `/party` endpoint. Do not represent the integration as active before a real request succeeds.
