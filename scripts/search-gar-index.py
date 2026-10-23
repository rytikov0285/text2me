#!/usr/bin/env python3
"""Search the built GAR SQLite database; outputs JSON for future API adapters."""
import argparse
import json
import sqlite3
import sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("database")
    parser.add_argument("query")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--include-houses", action="store_true")
    args = parser.parse_args()
    query = " ".join(args.query.split()).casefold()
    if len(query) < 2:
        raise SystemExit("Query must contain at least 2 characters.")
    limit = max(1, min(args.limit, 100))
    con = sqlite3.connect("file:" + args.database + "?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    try:
        def path_for(object_id):
            labels = []
            seen = set()
            current_id = object_id
            for _ in range(20):
                if current_id is None or current_id in seen or current_id == 0:
                    break
                seen.add(current_id)
                obj = con.execute("""
                  SELECT object_id, name, type_name FROM current_address_objects
                  WHERE object_id=? ORDER BY row_id DESC LIMIT 1
                """, (current_id,)).fetchone()
                if not obj:
                    break
                labels.append(" ".join(x for x in (obj["type_name"], obj["name"]) if x))
                parent = con.execute("""
                  SELECT parent_object_id FROM hierarchy
                  WHERE object_id=? AND is_active=1
                  ORDER BY CASE division WHEN 'adm_hierarchy' THEN 0 ELSE 1 END, row_id DESC LIMIT 1
                """, (current_id,)).fetchone()
                current_id = parent["parent_object_id"] if parent else None
            labels.reverse()
            return ", ".join(labels)

        objects = con.execute("""
          SELECT row_id, object_id, object_guid, name, type_name, level
          FROM current_address_objects
          WHERE name_folded >= ? AND name_folded < ?
          ORDER BY name_folded, name LIMIT ?
        """, (query, query + chr(0x10ffff), limit)).fetchall()
        # Prefix search is index-friendly; substring fallback is capped and only runs if prefix yielded no matches.
        if not objects:
            objects = con.execute("""
              SELECT row_id, object_id, object_guid, name, type_name, level
              FROM current_address_objects
              WHERE instr(name_folded, ?) > 0
              ORDER BY name_folded, name LIMIT ?
            """, (query, limit)).fetchall()
        results = []
        for row in objects:
            results.append({
                "kind": "address_object",
                "object_id": row["object_id"],
                "object_guid": row["object_guid"],
                "name": row["name"],
                "type": row["type_name"],
                "level": row["level"],
                "full_address": path_for(row["object_id"]),
                "source": "ГАР/ФИАС",
            })
        if args.include_houses and len(results) < limit:
            remaining = limit - len(results)
            houses = con.execute("""
              SELECT house_object_id, object_guid, house_num, build_num, postal_code
              FROM current_houses
              WHERE house_num_folded >= ? AND house_num_folded < ?
              ORDER BY house_num_folded LIMIT ?
            """, (query, query + chr(0x10ffff), remaining)).fetchall()
            for house in houses:
                parent = con.execute("""
                  SELECT parent_object_id FROM hierarchy
                  WHERE object_id=? AND is_active=1
                  ORDER BY CASE division WHEN 'adm_hierarchy' THEN 0 ELSE 1 END, row_id DESC LIMIT 1
                """, (house["house_object_id"],)).fetchone()
                parent_path = path_for(parent["parent_object_id"]) if parent else ""
                house_label = "д. " + str(house["house_num"] or "")
                if house["build_num"]:
                    house_label += ", корп. " + str(house["build_num"])
                results.append({
                    "kind": "house",
                    "object_id": house["house_object_id"],
                    "object_guid": house["object_guid"],
                    "house_number": house["house_num"],
                    "building_number": house["build_num"],
                    "postal_code": house["postal_code"],
                    "full_address": ", ".join(x for x in (parent_path, house_label) if x),
                    "source": "ГАР/ФИАС",
                })
        print(json.dumps({"query": args.query, "normalized_query": query, "count": len(results),
                          "results": results}, ensure_ascii=False, indent=2))
    finally:
        con.close()

if __name__ == "__main__":
    try:
        main()
    except sqlite3.Error as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
