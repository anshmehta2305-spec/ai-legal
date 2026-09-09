import sqlite3
import json

DB_FILE = r"c:\old lap data\7th sem\ai legal\backend\users.db"

def seed_data():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    sections = [
        {
            "section_number": "420",
            "section_name": "Cheating and dishonestly inducing delivery of property",
            "offence_description": "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security.",
            "category": "Offences Against Property",
            "chapter": "Chapter XVII",
            "keywords": "Cheating, Fraud, Inducement, Deception, Forgery",
            "min_punishment": "No statutory minimum",
            "max_punishment": "7 Years",
            "fine_amount": "Unlimited (At discretion of court)",
            "imprisonment_type": "Simple or Rigorous",
            "bns_section": "318(4)",
            "bns_description": "Cheating and dishonestly inducing delivery of property under the Bharatiya Nyaya Sanhita.",
            "elements": json.dumps([
                "Deception by the accused",
                "Dishonest intention from the beginning",
                "Inducement of the victim",
                "Delivery of property or money",
                "Wrongful loss to the victim",
                "Wrongful gain to the accused"
            ]),
            "examples": json.dumps([
                "Fake investment schemes (Ponzi)",
                "Online marketplace fraud",
                "Property sale scams using forged documents",
                "Fake job offers demanding upfront fees",
                "Phishing and Bank fraud"
            ]),
            "evidence_required": json.dumps([
                "Agreements or contracts",
                "Payment proofs (bank statements, receipts)",
                "Call records and messages",
                "Witness statements",
                "Digital evidence (emails, WhatsApp chats)"
            ]),
            "procedure": json.dumps([
                "FIR Registration under IPC 420",
                "Evidence Collection by IO",
                "Recording of Statements (Section 161/164 CrPC)",
                "Arrest and Remand",
                "Filing of Charge Sheet",
                "Trial and Cross Examination"
            ]),
            "defences": json.dumps([
                "No dishonest intention at the time of making the promise",
                "Breach of contract (Civil dispute, not criminal)",
                "Lack of evidence showing inducement",
                "False implication out of enmity"
            ]),
            "related_sections": json.dumps(["IPC 406", "IPC 415", "IPC 467", "IPC 468", "IPC 471"]),
            "ai_explanation": "IPC Section 420 deals with aggravated forms of cheating where the victim is dishonestly induced to deliver property or money. Unlike a simple breach of contract, 420 requires the intent to deceive to exist from the very beginning of the transaction.",
            "ai_risk_level": "High",
            "ai_severity_score": 8,
            "ai_next_steps": json.dumps([
                "Consult a criminal defense lawyer immediately.",
                "Collate all financial transactions and communication.",
                "If accused, consider applying for Anticipatory Bail under Section 438 CrPC."
            ]),
            "classification": {
                "is_cognizable": True,
                "is_bailable": False,
                "is_compoundable": True,
                "triable_by": "Magistrate First Class"
            },
            "precedents": [
                {
                    "case_name": "Dalip Kaur & Ors. v. Jagnar Singh & Anr.",
                    "year": 2009,
                    "summary": "The Supreme Court distinguished between mere breach of contract and the offence of cheating.",
                    "citation": "AIR 2009 SC 3191",
                    "key_principle": "Fraudulent or dishonest intention must be shown to exist from the very beginning."
                }
            ]
        },
        {
            "section_number": "302",
            "section_name": "Punishment for Murder",
            "offence_description": "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
            "category": "Offences Against the Human Body",
            "chapter": "Chapter XVI",
            "keywords": "Murder, Homicide, Killing, Death, Intention",
            "min_punishment": "Life Imprisonment",
            "max_punishment": "Death Penalty",
            "fine_amount": "Unlimited",
            "imprisonment_type": "Rigorous",
            "bns_section": "103",
            "bns_description": "Punishment for Murder under Bharatiya Nyaya Sanhita.",
            "elements": json.dumps([
                "Intention to cause death",
                "Intention to cause bodily injury likely to cause death",
                "Knowledge that the act is so imminently dangerous it must cause death"
            ]),
            "examples": json.dumps([
                "Shooting someone with intent to kill",
                "Poisoning a person's food",
                "Pre-planned contract killing"
            ]),
            "evidence_required": json.dumps([
                "Post-mortem report",
                "Murder weapon recovery",
                "Eyewitness testimony",
                "Motive establishment",
                "Forensic and DNA evidence"
            ]),
            "procedure": json.dumps([
                "Registration of FIR under 302",
                "Inquest under 174 CrPC",
                "Arrest of accused without warrant",
                "Collection of forensic evidence",
                "Filing of charge sheet within 90 days",
                "Trial before Sessions Court"
            ]),
            "defences": json.dumps([
                "Right of private defence (Self-defense)",
                "Sudden and grave provocation",
                "Unsoundness of mind (Insanity)",
                "Alibi"
            ]),
            "related_sections": json.dumps(["IPC 300", "IPC 304", "IPC 307", "IPC 120B"]),
            "ai_explanation": "IPC 302 provides the punishment for murder, which is the most severe crime against a human body. It requires clear proof of intention or knowledge to cause death.",
            "ai_risk_level": "Critical",
            "ai_severity_score": 10,
            "ai_next_steps": json.dumps([
                "Immediate legal representation is mandatory.",
                "Ensure no statements are made to the police without counsel.",
                "Bail is exceptionally rare; prepare for trial."
            ]),
            "classification": {
                "is_cognizable": True,
                "is_bailable": False,
                "is_compoundable": False,
                "triable_by": "Court of Session"
            },
            "precedents": [
                {
                    "case_name": "Bachan Singh v. State of Punjab",
                    "year": 1980,
                    "summary": "Established the 'Rarest of Rare' doctrine for awarding the death penalty.",
                    "citation": "AIR 1980 SC 898",
                    "key_principle": "Death penalty should only be awarded in the rarest of rare cases where life imprisonment is wholly inadequate."
                }
            ]
        },
        {
            "section_number": "307",
            "section_name": "Attempt to Murder",
            "offence_description": "Whoever does any act with such intention or knowledge, and under such circumstances that, if he by that act caused death, he would be guilty of murder.",
            "category": "Offences Against the Human Body",
            "chapter": "Chapter XVI",
            "keywords": "Attempted Murder, Severe Injury, Attack",
            "min_punishment": "Up to 10 Years",
            "max_punishment": "Life Imprisonment (If hurt is caused)",
            "fine_amount": "Unlimited",
            "imprisonment_type": "Rigorous",
            "bns_section": "109",
            "bns_description": "Attempt to Murder under BNS.",
            "elements": json.dumps([
                "Action done with intent to kill",
                "Knowledge that the act would cause death",
                "Act done towards the commission of murder"
            ]),
            "examples": json.dumps([
                "Shooting at someone but missing",
                "Stabbing someone in vital organs who survives"
            ]),
            "evidence_required": json.dumps([
                "Medico-Legal Certificate (MLC)",
                "Weapon recovery",
                "Victim's statement"
            ]),
            "procedure": json.dumps([
                "FIR Registration",
                "Medical examination of victim",
                "Arrest and Charge Sheet",
                "Sessions Trial"
            ]),
            "defences": json.dumps([
                "No intention to kill, only to cause hurt (IPC 324/326)",
                "Private Defence"
            ]),
            "related_sections": json.dumps(["IPC 302", "IPC 326", "IPC 324"]),
            "ai_explanation": "IPC 307 penalizes an attempt to commit murder. The prosecution must prove that the accused had the exact intention to kill, even if the victim survived.",
            "ai_risk_level": "High",
            "ai_severity_score": 9,
            "ai_next_steps": json.dumps(["Consult criminal lawyer", "Prepare for trial as bail is difficult."]),
            "classification": {
                "is_cognizable": True,
                "is_bailable": False,
                "is_compoundable": False,
                "triable_by": "Court of Session"
            },
            "precedents": [
                {
                    "case_name": "State of Maharashtra v. Balram Bama Patil",
                    "year": 1983,
                    "summary": "Clarified that injury is not essential for a conviction under 307; intention is key.",
                    "citation": "1983 AIR 305",
                    "key_principle": "The intention to kill can be inferred from the nature of the weapon and the part of the body targeted."
                }
            ]
        },
        {
            "section_number": "498A",
            "section_name": "Husband or relative of husband of a woman subjecting her to cruelty",
            "offence_description": "Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine.",
            "category": "Offences Against Women / Marriage",
            "chapter": "Chapter XXA",
            "keywords": "Cruelty, Dowry, Harassment, Marriage, Domestic Violence",
            "min_punishment": "No statutory minimum",
            "max_punishment": "3 Years",
            "fine_amount": "Unlimited",
            "imprisonment_type": "Simple or Rigorous",
            "bns_section": "84",
            "bns_description": "Cruelty by husband or relatives under BNS.",
            "elements": json.dumps([
                "Woman must be married",
                "Subjected to cruelty or harassment",
                "Cruelty driven by unlawful demands for property/dowry"
            ]),
            "examples": json.dumps([
                "Beating wife for not bringing dowry",
                "Continuous mental harassment and taunts"
            ]),
            "evidence_required": json.dumps([
                "Medical records of injuries",
                "Witness statements",
                "Proof of dowry demand"
            ]),
            "procedure": json.dumps([
                "Complaint to Women's Cell",
                "Mediation",
                "FIR Registration",
                "Trial"
            ]),
            "defences": json.dumps([
                "Vague and omnibus allegations",
                "No proof of unlawful demand"
            ]),
            "related_sections": json.dumps(["IPC 304B", "IPC 406", "Domestic Violence Act"]),
            "ai_explanation": "Section 498A deals with domestic cruelty and dowry harassment.",
            "ai_risk_level": "High",
            "ai_severity_score": 7,
            "ai_next_steps": json.dumps([
                "Parties should explore mediation if possible.",
                "Accused relatives should file for Anticipatory Bail if named generally."
            ]),
            "classification": {
                "is_cognizable": True,
                "is_bailable": False,
                "is_compoundable": False,
                "triable_by": "Magistrate First Class"
            },
            "precedents": [
                {
                    "case_name": "Arnesh Kumar v. State of Bihar",
                    "year": 2014,
                    "summary": "Supreme Court laid down guidelines to prevent arbitrary arrests under Section 498A.",
                    "citation": "(2014) 8 SCC 273",
                    "key_principle": "Police cannot automatically arrest under 498A; must follow Section 41 CrPC notice."
                }
            ]
        }
    ]

    for sec in sections:
        classification = sec.pop("classification")
        precedents = sec.pop("precedents")
        
        cursor.execute("SELECT id FROM legal_sections WHERE section_number = ?", (sec["section_number"],))
        existing = cursor.fetchone()
        
        if not existing:
            columns = ', '.join(sec.keys())
            placeholders = ', '.join(['?'] * len(sec))
            cursor.execute(f"INSERT INTO legal_sections ({columns}) VALUES ({placeholders})", list(sec.values()))
            section_id = cursor.lastrowid
            
            cursor.execute("INSERT INTO legal_classifications (section_id, is_cognizable, is_bailable, is_compoundable, triable_by) VALUES (?, ?, ?, ?, ?)",
                           (section_id, classification["is_cognizable"], classification["is_bailable"], classification["is_compoundable"], classification["triable_by"]))
                           
            for p in precedents:
                cursor.execute("INSERT INTO legal_case_precedents (section_id, case_name, year, summary, citation, key_principle) VALUES (?, ?, ?, ?, ?, ?)",
                               (section_id, p["case_name"], p["year"], p["summary"], p["citation"], p["key_principle"]))

    conn.commit()
    conn.close()
    print("Database seeded with legal sections successfully.")

if __name__ == "__main__":
    seed_data()
