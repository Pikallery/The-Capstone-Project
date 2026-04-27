"""
Capstone Project — Village Data Import Script
Imports all-India MDDS village data from XLS files into PostgreSQL.

Usage:
    pip install -r requirements.txt
    python import_all.py

Required env vars (or create .env in this directory):
    DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
    DATASET_PATH=path/to/dataset/folder   (default: auto-detected)
"""

import os
import sys
import time
import traceback
from pathlib import Path

import xlrd
import pandas as pd
import psycopg2
sys.stdout.reconfigure(encoding='utf-8')
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

# ─── Configuration ────────────────────────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL environment variable not set. Create a .env file.")

# Auto-detect dataset folder
_script_dir = Path(__file__).parent
_default_dataset = _script_dir.parent.parent / "all-india-villages-master-list-dataset" / "dataset"
DATASET_PATH = Path(os.environ.get("DATASET_PATH", str(_default_dataset)))

BATCH_SIZE = 5000

# ─── Database helpers ─────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.DictCursor)

def ensure_country(cur):
    cur.execute('SELECT id FROM "Country" WHERE code = %s', ('IN',))
    row = cur.fetchone()
    if row:
        return row['id']
    cur.execute('INSERT INTO "Country" (name, code, "createdAt", "updatedAt") VALUES (%s, %s, NOW(), NOW()) RETURNING id', ('India', 'IN'))
    return cur.fetchone()['id']

def upsert_state(cur, code, name, country_id):
    cur.execute('SELECT id FROM "State" WHERE code = %s', (code,))
    row = cur.fetchone()
    if row:
        return row['id']
    cur.execute('INSERT INTO "State" (code, name, "countryId", "createdAt", "updatedAt") VALUES (%s, %s, %s, NOW(), NOW()) RETURNING id',
                (code, name, country_id))
    return cur.fetchone()['id']

def upsert_district(cur, code, name, state_id):
    cur.execute('SELECT id FROM "District" WHERE code = %s AND "stateId" = %s', (code, state_id))
    row = cur.fetchone()
    if row:
        return row['id']
    cur.execute('INSERT INTO "District" (code, name, "stateId", "createdAt", "updatedAt") VALUES (%s, %s, %s, NOW(), NOW()) RETURNING id',
                (code, name, state_id))
    return cur.fetchone()['id']

def upsert_subdistrict(cur, code, name, district_id):
    cur.execute('SELECT id FROM "SubDistrict" WHERE code = %s AND "districtId" = %s', (code, district_id))
    row = cur.fetchone()
    if row:
        return row['id']
    cur.execute('INSERT INTO "SubDistrict" (code, name, "districtId", "createdAt", "updatedAt") VALUES (%s, %s, %s, NOW(), NOW()) RETURNING id',
                (code, name, district_id))
    return cur.fetchone()['id']

def insert_villages_batch(cur, rows):
    """Batch insert villages, skipping duplicates."""
    if not rows:
        return 0
    args = [(r['code'], r['name'], r['sub_district_id']) for r in rows]
    psycopg2.extras.execute_values(
        cur,
        '''INSERT INTO "Village" (code, name, "subDistrictId", "createdAt", "updatedAt")
           VALUES %s
           ON CONFLICT (code, "subDistrictId") DO NOTHING''',
        args,
        template='(%s, %s, %s, NOW(), NOW())',
        page_size=BATCH_SIZE,
    )
    return len(args)

# ─── XLS parsing ──────────────────────────────────────────────────────────────

def parse_cell(cell):
    """Convert xlrd cell to string, stripping whitespace."""
    val = cell.value
    if cell.ctype == xlrd.XL_CELL_NUMBER:
        # Numeric codes like 27.0 → "27"
        return str(int(val)) if val == int(val) else str(val)
    return str(val).strip()

def is_summary_row(state_code, district_code, subdistrict_code, village_code):
    """
    The MDDS files have summary rows at each hierarchy level with '000' codes.
    Skip them — we only want leaf-level village rows.
    """
    return (
        district_code in ('0', '000', '') or
        subdistrict_code in ('0', '00000', '') or
        village_code in ('0', '000000', '')
    )

# ─── Main import ──────────────────────────────────────────────────────────────

def read_rows(xls_path):
    """Return list of string-lists (one per data row, header skipped)."""
    if xls_path.suffix.lower() == '.ods':
        df = pd.read_excel(str(xls_path), header=0, engine='odf', dtype=str)
        return [list(r) for r in df.itertuples(index=False, name=None)]
    else:
        wb = xlrd.open_workbook(str(xls_path))
        # Some files have data on a sheet named "Village Directory" rather than sheet 0
        sheet_names = [s.lower() for s in wb.sheet_names()]
        idx = next((i for i, n in enumerate(sheet_names) if 'village' in n), 0)
        ws = wb.sheet_by_index(idx)
        return [[parse_cell(cell) for cell in ws.row(i)] for i in range(1, ws.nrows)]


def import_file(cur, xls_path, country_id, stats):
    """Import a single state XLS/ODS file."""
    rows = read_rows(xls_path)
    if not rows:
        print(f"  Skipping {xls_path.name}: no data rows")
        return

    state_code = rows[0][0]
    state_name = str(rows[0][1]).strip().title()
    state_id = upsert_state(cur, state_code, state_name, country_id)

    village_batch = []
    district_cache = {}
    subdistrict_cache = {}

    for row in rows:
        if len(row) < 8:
            stats['skipped'] += 1
            continue
        state_c   = str(row[0]).strip()
        dist_c    = str(row[2]).strip()
        dist_n    = str(row[3]).strip().title()
        subdt_c   = str(row[4]).strip()
        subdt_n   = str(row[5]).strip().title()
        village_c = str(row[6]).strip()
        village_n = str(row[7]).strip()

        if is_summary_row(state_c, dist_c, subdt_c, village_c):
            continue

        if not village_n:
            stats['skipped'] += 1
            continue

        # District
        dk = (dist_c, state_id)
        if dk not in district_cache:
            district_cache[dk] = upsert_district(cur, dist_c, dist_n, state_id)
        district_id = district_cache[dk]

        # Sub-district
        sk = (subdt_c, district_id)
        if sk not in subdistrict_cache:
            subdistrict_cache[sk] = upsert_subdistrict(cur, subdt_c, subdt_n, district_id)
        subdistrict_id = subdistrict_cache[sk]

        village_batch.append({'code': village_c, 'name': village_n, 'sub_district_id': subdistrict_id})

        if len(village_batch) >= BATCH_SIZE:
            insert_villages_batch(cur, village_batch)
            stats['villages'] += len(village_batch)
            village_batch = []

    # Insert remaining
    if village_batch:
        insert_villages_batch(cur, village_batch)
        stats['villages'] += len(village_batch)

    stats['states'] += 1
    stats['districts'] += len(district_cache)
    stats['subdistricts'] += len(subdistrict_cache)
    print(f"  ✓ {state_name}: {len(district_cache)} districts, {len(subdistrict_cache)} sub-districts, {stats['villages']} villages total")

def run():
    if not DATASET_PATH.exists():
        sys.exit(f"ERROR: Dataset path not found: {DATASET_PATH}\nSet DATASET_PATH env var to the folder containing the XLS files.")

    xls_files = sorted(DATASET_PATH.glob("*.xls")) + sorted(DATASET_PATH.glob("*.ods"))
    if not xls_files:
        sys.exit(f"ERROR: No .xls files found in {DATASET_PATH}")

    print(f"\nCapstone Project — Village Data Import")
    print(f"{'═' * 50}")
    print(f"Dataset: {DATASET_PATH}")
    print(f"Files found: {len(xls_files)}")
    print(f"Database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL[:30]}")
    print(f"{'═' * 50}\n")

    stats = {'states': 0, 'districts': 0, 'subdistricts': 0, 'villages': 0, 'skipped': 0, 'errors': 0}
    start = time.time()

    conn = get_conn()
    try:
        with conn:
            with conn.cursor() as cur:
                country_id = ensure_country(cur)
                print(f"Country 'India' ready (id={country_id})\n")

        for xls_path in xls_files:
            print(f"Processing: {xls_path.name}")
            try:
                with conn:
                    with conn.cursor() as cur:
                        import_file(cur, xls_path, country_id, stats)
            except Exception as e:
                print(f"  ✗ Error in {xls_path.name}: {e}")
                traceback.print_exc()
                stats['errors'] += 1

    finally:
        conn.close()

    elapsed = time.time() - start
    print(f"\n{'═' * 50}")
    print(f"Import Complete in {elapsed:.1f}s")
    print(f"  States:        {stats['states']}")
    print(f"  Districts:     {stats['districts']}")
    print(f"  Sub-Districts: {stats['subdistricts']}")
    print(f"  Villages:      {stats['villages']:,}")
    print(f"  Skipped rows:  {stats['skipped']}")
    print(f"  Files errored: {stats['errors']}")
    print(f"{'═' * 50}\n")

    if stats['errors']:
        print("WARNING: Some files had errors. Check output above.")
        sys.exit(1)

# ─── Verification queries ─────────────────────────────────────────────────────

def verify():
    """Run spot-checks to verify import integrity."""
    print("\nRunning verification queries…")
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            queries = [
                ('Total states', 'SELECT COUNT(*) FROM "State"'),
                ('Total districts', 'SELECT COUNT(*) FROM "District"'),
                ('Total sub-districts', 'SELECT COUNT(*) FROM "SubDistrict"'),
                ('Total villages', 'SELECT COUNT(*) FROM "Village"'),
                ('Orphaned districts (should be 0)', 'SELECT COUNT(*) FROM "District" d WHERE NOT EXISTS (SELECT 1 FROM "State" s WHERE s.id = d."stateId")'),
                ('Orphaned villages (should be 0)', 'SELECT COUNT(*) FROM "Village" v WHERE NOT EXISTS (SELECT 1 FROM "SubDistrict" s WHERE s.id = v."subDistrictId")'),
            ]
            for label, sql in queries:
                cur.execute(sql)
                count = cur.fetchone()[0]
                print(f"  {label}: {count:,}")

            # Spot-check
            cur.execute('''
                SELECT v.name, sd.name, d.name, s.name
                FROM "Village" v
                JOIN "SubDistrict" sd ON sd.id = v."subDistrictId"
                JOIN "District" d ON d.id = sd."districtId"
                JOIN "State" s ON s.id = d."stateId"
                WHERE v.name ILIKE 'Manibeli' LIMIT 1
            ''')
            row = cur.fetchone()
            if row:
                print(f"\n  Spot-check: Manibeli → {row[0]}, {row[1]}, {row[2]}, {row[3]} ✓")
            else:
                print("\n  Spot-check: Manibeli not found (Maharashtra may not be imported yet)")
    finally:
        conn.close()

# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    if '--verify' in sys.argv:
        verify()
    else:
        run()
        verify()
