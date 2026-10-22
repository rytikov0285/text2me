/**
 * Cloudflare Worker proxy for DaData party lookup.
 * Configure secret DADATA_API_KEY and variable ALLOWED_ORIGIN before deployment.
 */
const corsHeaders = (origin, allowedOrigin) => ({
  "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
});
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    const headers = corsHeaders(origin, allowedOrigin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (origin !== allowedOrigin) return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers });
    if (new URL(request.url).pathname !== "/party") return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
    if (!env.DADATA_API_KEY) return new Response(JSON.stringify({ error: "service_not_configured" }), { status: 503, headers });
    let body;
    try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers }); }
    const inn = String(body.inn || "").replace(/\D/g, "");
    if (!/^\d{10}(\d{2})?$/.test(inn)) return new Response(JSON.stringify({ error: "invalid_inn", message: "Введите ИНН организации из 10 цифр или ИП из 12 цифр." }), { status: 400, headers });
    try {
      const upstream = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party", {
        method: "POST",
        headers: { "Authorization": "Token " + env.DADATA_API_KEY, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ query: inn })
      });
      if (!upstream.ok) return new Response(JSON.stringify({ error: "provider_error", message: "Сервис проверки реквизитов временно недоступен.", providerStatus: upstream.status }), { status: 502, headers });
      const data = await upstream.json();
      const item = data && Array.isArray(data.suggestions) ? data.suggestions[0] : null;
      if (!item || !item.data) return new Response(JSON.stringify({ error: "not_found", message: "Организация или ИП по этому ИНН не найдены." }), { status: 404, headers });
      const d = item.data;
      const result = {
        queryInn: inn, type: d.type || null, inn: d.inn || null, kpp: d.kpp || null, ogrn: d.ogrn || null,
        name: d.name ? (d.name.full_with_opf || d.name.short_with_opf || item.value || null) : (item.value || null),
        shortName: d.name ? (d.name.short_with_opf || null) : null,
        address: d.address ? (d.address.value || null) : null,
        addressSource: d.address && d.address.data ? (d.address.data.source || null) : null,
        manager: d.management ? (d.management.name || null) : (d.fio ? [d.fio.surname,d.fio.name,d.fio.patronymic].filter(Boolean).join(" ") : null),
        managerTitle: d.management ? (d.management.post || null) : null,
        status: d.state ? (d.state.status || null) : null,
        actualAt: d.state ? (d.state.actuality_date || null) : null, invalid: d.invalid === true
      };
      return new Response(JSON.stringify({ result }), { status: 200, headers });
    } catch {
      return new Response(JSON.stringify({ error: "upstream_unavailable", message: "Не удалось связаться с сервисом проверки. Повторите попытку позже." }), { status: 502, headers });
    }
  }
};
