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
    const pathname = new URL(request.url).pathname;
    if (pathname !== "/party" && pathname !== "/ocr") return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
    if (pathname === "/ocr") {
      if (!env.GOOGLE_CLOUD_VISION_API_KEY) return new Response(JSON.stringify({ error: "ocr_not_configured", message: "Распознавание пока не настроено." }), { status: 503, headers });
      const declaredLength = Number(request.headers.get("Content-Length") || 0);
      if (declaredLength > 7 * 1024 * 1024) return new Response(JSON.stringify({ error: "file_too_large", message: "Изображение слишком большое. Максимальный размер — 5 МБ." }), { status: 413, headers });
      let imageBody;
      try { imageBody = await request.json(); } catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers }); }
      const mimeType = String(imageBody.mimeType || "").toLowerCase();
      const content = String(imageBody.imageBase64 || "").replace(/^data:[^,]+,/, "").replace(/\s/g, "");
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) return new Response(JSON.stringify({ error: "unsupported_image", message: "Поддерживаются изображения JPG, PNG, WEBP и GIF. PDF пока не поддерживается." }), { status: 415, headers });
      if (!content || !/^[A-Za-z0-9+/]+={0,2}$/.test(content) || content.length > 7 * 1024 * 1024) return new Response(JSON.stringify({ error: "invalid_image", message: "Не удалось прочитать изображение или превышен лимит размера." }), { status: 400, headers });
      try {
        const upstream = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(env.GOOGLE_CLOUD_VISION_API_KEY), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requests: [{ image: { content }, features: [{ type: "DOCUMENT_TEXT_DETECTION" }], imageContext: { languageHints: ["ru", "en"] } }] })
        });
        if (!upstream.ok) return new Response(JSON.stringify({ error: "ocr_provider_error", message: "Сервис распознавания временно недоступен." }), { status: 502, headers });
        const payload = await upstream.json();
        const response = payload && payload.responses && payload.responses[0];
        if (!response) return new Response(JSON.stringify({ error: "ocr_empty_response", message: "Сервис не вернул результат. Попробуйте другое изображение." }), { status: 502, headers });
        if (response.error) return new Response(JSON.stringify({ error: "ocr_failed", message: "Не удалось распознать текст на этом изображении." }), { status: 422, headers });
        const text = response.fullTextAnnotation && response.fullTextAnnotation.text ? response.fullTextAnnotation.text : "";
        return new Response(JSON.stringify({ text, detected: Boolean(text.trim()), message: text.trim() ? null : "Текст не обнаружен. Попробуйте более чёткое фото." }), { status: 200, headers });
      } catch {
        return new Response(JSON.stringify({ error: "ocr_unavailable", message: "Не удалось связаться с сервисом распознавания." }), { status: 502, headers });
      }
    }
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
