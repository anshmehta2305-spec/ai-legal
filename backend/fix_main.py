import re

with open(r"c:\old lap data\7th sem\ai legal\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

new_tables = """
    # 11. legal_sections
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS legal_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            section_number TEXT UNIQUE,
            section_name TEXT,
            offence_description TEXT,
            category TEXT,
            chapter TEXT,
            keywords TEXT,
            min_punishment TEXT,
            max_punishment TEXT,
            fine_amount TEXT,
            imprisonment_type TEXT,
            bns_section TEXT,
            bns_description TEXT,
            elements TEXT,
            examples TEXT,
            evidence_required TEXT,
            procedure TEXT,
            defences TEXT,
            related_sections TEXT,
            ai_explanation TEXT,
            ai_risk_level TEXT,
            ai_severity_score INTEGER,
            ai_next_steps TEXT
        )
    ''')

    # 12. legal_classifications
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS legal_classifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            section_id INTEGER REFERENCES legal_sections(id),
            is_cognizable BOOLEAN,
            is_bailable BOOLEAN,
            is_compoundable BOOLEAN,
            triable_by TEXT
        )
    ''')

    # 13. legal_case_precedents
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS legal_case_precedents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            section_id INTEGER REFERENCES legal_sections(id),
            case_name TEXT,
            year INTEGER,
            summary TEXT,
            citation TEXT,
            key_principle TEXT
        )
    ''')
"""

bad_string = new_tables + "\n    conn.commit()"

# Count occurrences to be sure
print(f"Occurrences of bad_string: {content.count(bad_string)}")

# Revert all of them
content = content.replace(bad_string, "conn.commit()")

# Now properly inject it only inside init_db.
# Let's find the specific conn.commit() inside init_db.
# It's right after checking for default admin user:
#     if not cursor.fetchone():
#         ...
#     conn.commit()

# I will use a regex to find the end of init_db().
pattern = r"(cursor\.execute\(\"SELECT id FROM users WHERE email = 'admin@legal\.com'\"\)\s+if not cursor\.fetchone\(\):\s+cursor\.execute\([^)]+\)\s+)conn\.commit\(\)"
replacement = r"\1" + new_tables + "\n    conn.commit()"

content = re.sub(pattern, replacement, content)

with open(r"c:\old lap data\7th sem\ai legal\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed main.py")
