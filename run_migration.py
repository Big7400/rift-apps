"""Run the Supabase SQL migration through a direct database connection."""
import os

import psycopg2

DATABASE_URL = os.environ["DATABASE_URL"]


with open("supabase_migration.sql", "r", encoding="utf-8") as migration_file:
    sql = migration_file.read()

print("Connecting to Supabase...")
connection = psycopg2.connect(DATABASE_URL)
connection.autocommit = True
cursor = connection.cursor()

statements = [statement.strip() for statement in sql.split(";") if statement.strip() and not statement.strip().startswith("--")]

success = 0
errors = 0
for statement in statements:
    try:
        cursor.execute(statement)
        success += 1
    except psycopg2.errors.DuplicateTable:
        print(f"  SKIP (already exists): {statement[:60]}...")
        success += 1
    except psycopg2.errors.DuplicateObject:
        print(f"  SKIP (duplicate): {statement[:60]}...")
        success += 1
    except Exception as exc:
        print(f"  ERROR: {exc}\n  SQL: {statement[:80]}...")
        errors += 1

cursor.close()
connection.close()
print(f"\nMigration complete: {success} statements OK, {errors} errors")
