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

# The exact block before conn.commit() in init_db
search_block = """        cursor.execute(
            "INSERT INTO users (name, mobile, gender, age, email, hashed_password, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("Admin User", "0000000000", "Other", 30, "admin@legal.com", pwd, "admin", 1)
        )
        
    conn.commit()"""

replace_block = """        cursor.execute(
            "INSERT INTO users (name, mobile, gender, age, email, hashed_password, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("Admin User", "0000000000", "Other", 30, "admin@legal.com", pwd, "admin", 1)
        )
""" + new_tables + """
    conn.commit()"""

if "11. legal_sections" not in content:
    content = content.replace(search_block, replace_block)

with open(r"c:\old lap data\7th sem\ai legal\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Tables injected.")
