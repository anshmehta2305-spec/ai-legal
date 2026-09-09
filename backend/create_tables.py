import sqlite3

DB_FILE = r"c:\old lap data\7th sem\ai legal\backend\users.db"

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

try:
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

    conn.commit()
    print("Tables created manually.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
