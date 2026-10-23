#!/usr/bin/env python3
"""Check the official FNS GAR/FIAS feed and validate changed ZIP releases."""
from __future__ import annotations
import argparse, hashlib, json, os, re, subprocess, sys, tempfile, urllib.parse, urllib.request, zipfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
SOURCE_PAGE="https://www.nalog.gov.ru/opendata/7707329152-fias/"
ALLOWED_HOSTS={"fias.nalog.ru","data.nalog.ru"}
MAX_ARCHIVE_BYTES=int(os.environ.get("GAR_MAX_ARCHIVE_BYTES",10*1024*1024*1024))
USER_AGENT="text2me-open-data-monitor/1.0 (official FNS GAR/FIAS open data)"
def utc_now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.links=[]; self.text=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower()=="a":
            href=dict(attrs).get("href")
            if href:self.links.append(href)
    def handle_data(self,data):
        cleaned=" ".join(data.split())
        if cleaned:self.text.append(cleaned)
def fetch_page(url):
    request=urllib.request.Request(url,headers={"User-Agent":USER_AGENT})
    with urllib.request.urlopen(request,timeout=45) as response:
        final_url=response.geturl(); host=(urllib.parse.urlparse(final_url).hostname or "").lower()
        if host not in {"www.nalog.gov.ru","nalog.gov.ru"}: raise ValueError("Official source redirected to unexpected host: "+host)
        raw=response.read(30*1024*1024+1)
        if len(raw)>30*1024*1024: raise ValueError("Source metadata page exceeded 30 MiB safety limit")
        return raw.decode(response.headers.get_content_charset() or "utf-8",errors="replace"),final_url
def extract_release_url(html,page_url=SOURCE_PAGE):
    parser=PageParser(); parser.feed(html); candidates=[]
    for href in parser.links:
        absolute=urllib.parse.urljoin(page_url,href); parsed=urllib.parse.urlparse(absolute)
        host,path=(parsed.hostname or "").lower(),parsed.path.lower()
        if parsed.scheme=="https" and host in ALLOWED_HOSTS and path.startswith("/opendata/7707329152-fias/") and path.endswith(".zip"): candidates.append(absolute)
    if not candidates: raise ValueError("No official GAR/FIAS ZIP link found on FNS open-data page")
    return candidates[0]
def extract_date_after_label(text,label):
    match=re.search(re.escape(label)+r"\s*[:：]?\s*(\d{2}\.\d{2}\.\d{4})",text,re.IGNORECASE)
    return match.group(1) if match else None
def inspect_release_size(url):
    """HEAD-only preflight; never downloads the archive body."""
    headers={"User-Agent":USER_AGENT,"Range":"bytes=0-0"}
    request=urllib.request.Request(url,headers=headers,method="HEAD")
    try:
        response=urllib.request.urlopen(request,timeout=45)
    except Exception:
        request=urllib.request.Request(url,headers=headers)
        response=urllib.request.urlopen(request,timeout=45)
    with response:
        final_host=(urllib.parse.urlparse(response.geturl()).hostname or "").lower()
        if final_host not in ALLOWED_HOSTS: raise ValueError("Archive preflight redirected to unexpected host: "+final_host)
        declared=response.headers.get("Content-Length")
        size=int(declared) if declared and declared.isdigit() else None
        return {"http_status":getattr(response,"status",None),"declared_size_bytes":size,
                "accept_ranges":response.headers.get("Accept-Ranges"),
                "content_range":response.headers.get("Content-Range"),
                "fits_configured_archive_limit":(size is not None and size<=MAX_ARCHIVE_BYTES)}

def validate_archive_file(path,size,sha256):
    if size<4: raise ValueError("Downloaded archive is empty or too small to be a ZIP")
    with open(path,"rb") as stream:
        if stream.read(2)!=b"PK": raise ValueError("Downloaded content has no ZIP signature")
    with zipfile.ZipFile(path) as archive:
        members=[item for item in archive.infolist() if not item.is_dir()]
        xml_members=[item for item in members if item.filename.lower().endswith(".xml")]
        if not xml_members: raise ValueError("ZIP archive contains no XML data files")
        corrupt=archive.testzip()
        if corrupt: raise ValueError("ZIP CRC validation failed for member: "+corrupt)
        return {"sha256":sha256,"archive_size_bytes":size,"archive_members":len(members),"xml_members":len(xml_members),"uncompressed_size_bytes":sum(item.file_size for item in members),"archive_crc_validation":"passed"}
def download_and_validate(url, index_output=None):
    parsed=urllib.parse.urlparse(url)
    if parsed.scheme!="https" or (parsed.hostname or "").lower() not in ALLOWED_HOSTS: raise ValueError("Release URL failed HTTPS/official-host validation")
    request=urllib.request.Request(url,headers={"User-Agent":USER_AGENT}); digest=hashlib.sha256(); size=0; temp_path=None
    try:
        with tempfile.NamedTemporaryFile(prefix="text2me-fias-",suffix=".zip",delete=False) as tmp:
            temp_path=tmp.name
            with urllib.request.urlopen(request,timeout=90) as response:
                final_host=(urllib.parse.urlparse(response.geturl()).hostname or "").lower()
                if final_host not in ALLOWED_HOSTS: raise ValueError("Archive redirected to unexpected host: "+final_host)
                declared=response.headers.get("Content-Length")
                if declared and int(declared)>MAX_ARCHIVE_BYTES:
                    raise ValueError("Official archive declares "+str(declared)+" bytes, exceeding the configured "+str(MAX_ARCHIVE_BYTES)+" byte runner limit; refusing an oversized download.")
                while True:
                    chunk=response.read(1024*1024)
                    if not chunk: break
                    size+=len(chunk)
                    if size>MAX_ARCHIVE_BYTES: raise ValueError("Archive exceeded 10 GiB runner safety limit")
                    digest.update(chunk); tmp.write(chunk)
        validation=validate_archive_file(temp_path,size,digest.hexdigest())
        if index_output:
            builder=Path(__file__).resolve().parents[1]/"scripts"/"build-gar-index.py"
            process=subprocess.run([sys.executable,str(builder),temp_path,index_output,"--skip-zip-test"],
                capture_output=True,text=True,encoding="utf-8")
            if process.returncode!=0:
                details=(process.stderr or process.stdout or "unknown index build error")[-2500:]
                raise ValueError("GAR SQLite index build failed: "+details)
            report=json.loads(process.stdout)
            validation["index_build"]={
                "result":report.get("result"),
                "database_bytes":report.get("database_bytes"),
                "database_sha256":report.get("database_sha256"),
                "counts":report.get("counts"),
                "table_counts":report.get("table_counts"),
                "checks":report.get("checks"),
                "warnings":report.get("warnings",[])
            }
        return validation
    finally:
        if temp_path and os.path.exists(temp_path): os.unlink(temp_path)
def initial_status():
    return {"schema_version":"1.0.0","connector_id":"gar_fias","connector_name":"ГАР/ФИАС — официальный набор открытых данных ФНС России","status":"not_run","source_page":SOURCE_PAGE,"latest_attempt":None,"last_successful_source_check":None,"last_archive_validation":None,"address_index":{"status":"builder_implemented_not_deployed","note":"SQLite-сборщик и CLI-поиск реализованы; производственная база и веб-поиск ещё не опубликованы."}}
def read_status(path):
    if not path.exists(): return initial_status()
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(value,dict) or value.get("connector_id")!="gar_fias": raise ValueError("Unexpected status document shape")
        return value
    except (OSError,json.JSONDecodeError,ValueError) as exc: raise ValueError("Existing status file is unreadable or malformed: "+str(exc)) from exc
def write_status(path,status):
    path.parent.mkdir(parents=True,exist_ok=True); temp=path.with_suffix(path.suffix+".tmp")
    temp.write_text(json.dumps(status,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"); temp.replace(path)
def run_check(path):
    try: status=read_status(path)
    except ValueError as exc: print(str(exc),file=sys.stderr); return 2
    attempt={"started_at":utc_now(),"finished_at":None,"status":"failed","source_page":SOURCE_PAGE,"release_url":None,"source_last_changed":None,"source_data_current_date":None,"archive_action":"not_started","archive_validation":None,"error":None}
    try:
        html,final_page=fetch_page(SOURCE_PAGE); parser=PageParser(); parser.feed(html); page_text=" ".join(parser.text)
        release_url=extract_release_url(html,final_page); attempt["release_url"]=release_url
        attempt["source_last_changed"]=extract_date_after_label(page_text,"Дата последнего внесения изменений")
        attempt["source_data_current_date"]=extract_date_after_label(page_text,"Дата актуальности")
        previous=status.get("last_archive_validation") or {}
        index_output=os.environ.get("GAR_INDEX_OUTPUT") or None
        preflight=os.environ.get("GAR_PREFLIGHT_ONLY","").lower() in ("1","true","yes")
        if preflight:
            attempt["archive_action"]="size_preflight_only"
            attempt["archive_validation"]=inspect_release_size(release_url)
            attempt["archive_validation"]["note"]="Only HTTP headers were checked; archive body was not downloaded and no index was built."
        else:
            same_release=(previous.get("release_url")==release_url and previous.get("archive_crc_validation")=="passed")
            prior_index=(previous.get("index_build") or {}).get("result")=="success"
            if same_release and (not index_output or prior_index):
                attempt["archive_action"]="skipped_unchanged_release"
                attempt["archive_validation"]={key:previous.get(key) for key in ("sha256","archive_size_bytes","archive_members","xml_members","uncompressed_size_bytes","index_build")}
                attempt["archive_validation"]["archive_crc_validation"]="passed_previous_run"
            else:
                attempt["archive_action"]="download_validate_and_build_index" if index_output else "download_and_validate"
                validated=download_and_validate(release_url,index_output)
                attempt["archive_validation"]=validated
                status["last_archive_validation"]={"validated_at":utc_now(),"release_url":release_url,**validated}
        attempt["status"]="success"; status["status"]="healthy"
        status["last_successful_source_check"]={"checked_at":utc_now(),"source_page":SOURCE_PAGE,"release_url":release_url,"source_last_changed":attempt["source_last_changed"],"source_data_current_date":attempt["source_data_current_date"]}
    except Exception as exc:
        attempt["error"]=type(exc).__name__+": "+str(exc); status["status"]="degraded" if status.get("last_successful_source_check") else "not_run"
    attempt["finished_at"]=utc_now(); status["latest_attempt"]=attempt
    status["address_index"]=status.get("address_index") or {"status":"builder_implemented_not_deployed","note":"SQLite-сборщик и CLI-поиск реализованы; производственная база и веб-поиск ещё не опубликованы."}
    build=(attempt.get("archive_validation") or {}).get("index_build") or {}
    if build.get("result")=="success":
        status["address_index"]={
            "status":"built_not_deployed",
            "last_successful_build":attempt["finished_at"],
            "database_bytes":build.get("database_bytes"),
            "database_sha256":build.get("database_sha256"),
            "table_counts":build.get("table_counts"),
            "note":"SQLite-индекс собран и проверен; он загружается как временный артефакт GitHub Actions, но ещё не опубликован как поисковый API и не подключён к формам."
        }
    elif status["address_index"].get("status") not in ("built_not_deployed","deployed"):
        status["address_index"]["status"]="builder_implemented_not_deployed"
        status["address_index"]["note"]="SQLite-сборщик и CLI-поиск реализованы; производственная база и веб-поиск ещё не опубликованы."
    write_status(path,status); print(json.dumps({"status":status["status"],"attempt":attempt},ensure_ascii=False,indent=2)); return 0
def assert_success(path):
    status=read_status(path); latest=status.get("latest_attempt") or {}
    if latest.get("status")!="success":
        print("GAR/FIAS connector check failed: "+str(latest.get("error") or "no successful attempt"),file=sys.stderr); return 1
    print("GAR/FIAS source check succeeded; archive action: "+str(latest.get("archive_action"))); return 0
def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--status",default="data-engine/status.json"); parser.add_argument("--assert-success",action="store_true"); args=parser.parse_args()
    return assert_success(Path(args.status)) if args.assert_success else run_check(Path(args.status))
if __name__=="__main__": raise SystemExit(main())
