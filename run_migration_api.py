"""Run the SQL migration through the Supabase Management API."""
import os
import time

import requests

PROJECT_REF = os.environ["SUPABASE_PROJECT_REF"]
ACCESS_TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]
SUPABASE_URL = os.environ["SUPABASE_URL"]

HEADERS = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json",
    "apikey": ACCESS_TOKEN,
}


def run_query(sql: str, label: str = "") -> bool:
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    response = requests.post(url, headers=HEADERS, json={"query": sql}, timeout=30)
    if response.status_code in (200, 201):
        print(f"  OK  {label or sql[:60]}")
        return True

    error_text = response.text[:200]
    if "already exists" in error_text.lower() or "duplicate" in error_text.lower():
        print(f"  SKIP {label or sql[:60]} (already exists)")
        return True

    print(f"  ERR {label}: {response.status_code} - {error_text}")
    return False


with open("supabase_migration.sql", "r", encoding="utf-8") as migration_file:
    raw = migration_file.read()

statements = []
current = []
for line in raw.splitlines():
    stripped = line.strip()
    if stripped.startswith("--"):
        continue
    current.append(line)
    if stripped.endswith(";"):
        statement = "\n".join(current).strip()
        if statement and statement != ";":
            statements.append(statement)
        current = []

print(f"Running {len(statements)} SQL statements against {SUPABASE_URL} via Supabase API...\n")

ok = 0
failed = 0
for statement in statements:
    label = statement.split("(")[0].strip()[:70]
    if run_query(statement, label):
        ok += 1
    else:
        failed += 1
    time.sleep(0.1)

print("\n" + "=" * 50)
print(f"Migration result: {ok} OK, {failed} failed")
