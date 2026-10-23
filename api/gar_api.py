#!/usr/bin/env python3
"""Read-only HTTP API for a prebuilt Text2me GAR SQLite index."""
import json
import os
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

DB_PATH = Path(os.environ.get("GAR_DATABASE_PATH", "/data/gar-address-index.sqlite"))
PORT = int(os.environ.get("GAR_API_PORT", "8080"))
ALLOWED_ORIGINS = {x.strip() for x in os.environ.get(
    "TEXT2ME_ALLOWED_ORIGINS", "https://rytikov0285.github.io").split(",") if x.strip()}


def connect_db():
    con = sqlite3.connect(DB_PATH.resolve().as_uri() + "?mode=ro", uri=True, timeout=5)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA query_only=ON")
    return con


def address_path(con, object_id):
    labels, seen, current = [], set(), object_id
    for _ in range(20):
        if current is None or current == 0 or current in seen:
            break
        seen.add(current)
        row = con.execute(
            "SELECT object_id,name,type_name FROM current_address_objects WHERE object_id=? ORDER BY row_id DESC LIMIT 1",
            (current,)).fetchone()
        if not row:
            break
        labels.append(" ".join(x for x in (row["type_name"], row["name"]) if x))
        parent = con.execute(
            "SELECT parent_object_id FROM hierarchy WHERE object_id=? AND is_active=1 ORDER BY CASE division WHEN 'adm_hierarchy' THEN 0 ELSE 1 END,row_id DESC LIMIT 1",
            (current,)).fetchone()
        current = parent["parent_object_id"] if parent else None
    return ", ".join(reversed(labels))


def search(query, limit=20, include_houses=False):
    query = " ".join(query.split()).casefold()
    if len(query) < 2:
        raise ValueError("Введите не менее двух символов.")
    if len(query) > 160:
        raise ValueError("Слишком длинный поисковый запрос.")
    limit = max(1, min(int(limit), 50))
    con = connect_db()
    try:
        rows = con.execute(
            "SELECT row_id,object_id,object_guid,name,type_name,level FROM current_address_objects WHERE name_folded>=? AND name_folded<? ORDER BY name_folded,name LIMIT ?",
            (query, query + chr(0x10ffff), limit)).fetchall()
        results = [{"kind":"address_object","object_id":r["object_id"],"object_guid":r["object_guid"],
                    "name":r["name"],"type":r["type_name"],"level":r["level"],
                    "full_address":address_path(con,r["object_id"]),"source":"ГАР/ФИАС"} for r in rows]
        if include_houses and len(results) < limit:
            houses = con.execute(
                "SELECT house_object_id,object_guid,house_num,build_num,postal_code FROM current_houses WHERE house_num_folded>=? AND house_num_folded<? ORDER BY house_num_folded LIMIT ?",
                (query, query + chr(0x10ffff), limit-len(results))).fetchall()
            for house in houses:
                parent = con.execute(
                    "SELECT parent_object_id FROM hierarchy WHERE object_id=? AND is_active=1 ORDER BY CASE division WHEN 'adm_hierarchy' THEN 0 ELSE 1 END,row_id DESC LIMIT 1",
                    (house["house_object_id"],)).fetchone()
                parent_path = address_path(con,parent["parent_object_id"]) if parent else ""
                label = "д. " + str(house["house_num"] or "")
                if house["build_num"]:
                    label += ", корп. " + str(house["build_num"])
                results.append({"kind":"house","object_id":house["house_object_id"],
                    "object_guid":house["object_guid"],"house_number":house["house_num"],
                    "building_number":house["build_num"],"postal_code":house["postal_code"],
                    "full_address":", ".join(x for x in (parent_path,label) if x),"source":"ГАР/ФИАС"})
        return {"query":query,"count":len(results),"results":results}
    finally:
        con.close()


class Handler(BaseHTTPRequestHandler):
    def send_json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(body)))
        self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff")
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin",origin)
            self.send_header("Access-Control-Allow-Methods","GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers","Content-Type")
        self.send_header("Vary","Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length","0")
        self.send_header("Vary","Origin")
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin",origin)
            self.send_header("Access-Control-Allow-Methods","GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers","Content-Type")
        self.end_headers()

    def do_GET(self):
        route = urlparse(self.path)
        if route.path == "/health":
            if not DB_PATH.is_file():
                self.send_json(503,{"status":"not_ready","reason":"database_file_missing"})
                return
            con = None
            try:
                con = connect_db()
                names = {r["name"] for r in con.execute("SELECT name FROM sqlite_master WHERE type IN ('table','view')")}
                if not {"current_address_objects","current_houses","hierarchy","metadata"}.issubset(names):
                    self.send_json(503,{"status":"not_ready","reason":"database_schema_incomplete"})
                    return
                meta = dict(con.execute("SELECT key,value FROM metadata").fetchall())
                self.send_json(200,{"status":"ready","schema_version":meta.get("schema_version"),
                    "built_at_utc":meta.get("built_at_utc"),"database_bytes":DB_PATH.stat().st_size})
            except (OSError,sqlite3.Error):
                self.send_json(503,{"status":"not_ready","reason":"database_unreadable"})
            finally:
                if con is not None:
                    con.close()
            return
        if route.path != "/api/addresses":
            self.send_json(404,{"error":"not_found"})
            return
        params = parse_qs(route.query)
        try:
            query = (params.get("q") or [""])[0]
            limit = int((params.get("limit") or ["20"])[0])
            houses = (params.get("include_houses") or ["false"])[0].lower() in ("1","true","yes")
            self.send_json(200,search(query,limit,houses))
        except ValueError as exc:
            self.send_json(400,{"error":"invalid_query","message":str(exc)})
        except (OSError,sqlite3.Error):
            self.send_json(503,{"error":"address_index_unavailable"})

    def log_message(self, fmt, *args):
        if os.environ.get("GAR_API_ACCESS_LOG","0") == "1":
            super().log_message(fmt,*args)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0",PORT),Handler).serve_forever()
