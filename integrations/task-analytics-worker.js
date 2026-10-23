/**
 * text2me task-click analytics for Cloudflare Workers + D1.
 * Stores only an allowlisted task ID, same-site page path, and server timestamp.
 * Does not persist IP addresses, cookies, referrers, user IDs, or submitted form data.
 *
 * Required Worker configuration:
 *   Variable ALLOWED_ORIGIN = https://rytikov0285.github.io
 *   Secret ADMIN_TOKEN = long random token (used only for GET /stats)
 *   D1 binding DB -> text2me-analytics
 */
const TASK_IDS = new Set([
  "quick_create_document","quick_solve_situation","quick_prepare_text","quick_business_task",
  "return_purchase_money","complain_housing_utility","claim_unpaid_salary","write_official_complaint",
  "prepare_rental_agreement","write_claim_to_seller","prepare_court_claim","record_money_transfer",
  "cancel_service_or_subscription","prepare_car_power_of_attorney","draft_business_letter","create_business_document",
  "document_rental_agreement","document_seller_claim","document_court_claim","document_other",
  "situation_bank_debt","situation_service_dispute","situation_contract_dispute","situation_public_authority",
  "prepare_letter","find_instructions","find_official_source","find_reference_material",
  "business_contracts_processes","business_professional_services","business_send_specialist_request"
]);
const json = (body, status, headers) => new Response(JSON.stringify(body), {
  status, headers: { ...headers, "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" }
});
export default {
  async fetch(request, env) {
    const origin=request.headers.get("Origin")||"";
    const allowedOrigin=env.ALLOWED_ORIGIN||"";
    const cors={
      "Access-Control-Allow-Origin": origin===allowedOrigin ? allowedOrigin : "null",
      "Access-Control-Allow-Methods":"POST, GET, OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type, Authorization",
      "Access-Control-Max-Age":"86400",
      "Vary":"Origin"
    };
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
    if(!allowedOrigin || origin!==allowedOrigin) return json({error:"origin_not_allowed"},403,cors);
    const url=new URL(request.url);
    if(url.pathname==="/event"){
      if(request.method!=="POST") return json({error:"method_not_allowed"},405,cors);
      const length=Number(request.headers.get("Content-Length")||0);
      if(length>2048) return json({error:"payload_too_large"},413,cors);
      let body;
      try { body=await request.json(); } catch { return json({error:"invalid_json"},400,cors); }
      const taskId=String(body.task_id||"");
      const pagePath=String(body.path||"");
      if(!TASK_IDS.has(taskId)) return json({error:"invalid_task_id"},400,cors);
      if(!pagePath.startsWith("/text2me/") || pagePath.length>180 || /[?#\s]/.test(pagePath)) {
        return json({error:"invalid_path"},400,cors);
      }
      try {
        await env.DB.prepare("INSERT INTO task_events (task_id, page_path, created_at) VALUES (?, ?, datetime('now'))")
          .bind(taskId,pagePath).run();
        return json({ok:true},202,cors);
      } catch {
        return json({error:"storage_unavailable"},503,cors);
      }
    }
    if(url.pathname==="/stats"){
      if(request.method!=="GET") return json({error:"method_not_allowed"},405,cors);
      if(!env.ADMIN_TOKEN) return json({error:"stats_not_configured"},503,cors);
      const token=(request.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
      if(token.length!==env.ADMIN_TOKEN.length || token!==env.ADMIN_TOKEN) return json({error:"unauthorized"},401,cors);
      const days=Math.max(1,Math.min(90,Number(url.searchParams.get("days")||30)||30));
      try {
        const [totals,tasks,daily,pages]=await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS clicks, COUNT(DISTINCT task_id) AS distinct_tasks FROM task_events WHERE created_at >= datetime('now', ?)")
            .bind("-"+days+" days").first(),
          env.DB.prepare("SELECT task_id, COUNT(*) AS clicks FROM task_events WHERE created_at >= datetime('now', ?) GROUP BY task_id ORDER BY clicks DESC, task_id ASC")
            .bind("-"+days+" days").all(),
          env.DB.prepare("SELECT date(created_at) AS day, COUNT(*) AS clicks FROM task_events WHERE created_at >= datetime('now', ?) GROUP BY date(created_at) ORDER BY day ASC")
            .bind("-"+days+" days").all(),
          env.DB.prepare("SELECT page_path, COUNT(*) AS clicks FROM task_events WHERE created_at >= datetime('now', ?) GROUP BY page_path ORDER BY clicks DESC LIMIT 20")
            .bind("-"+days+" days").all()
        ]);
        return json({period_days:days,totals,tasks:tasks.results||[],daily:daily.results||[],pages:pages.results||[]},200,cors);
      } catch {
        return json({error:"storage_unavailable"},503,cors);
      }
    }
    return json({error:"not_found"},404,cors);
  }
};
