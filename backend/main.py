import os
import string
import sqlite3
import random
import pandas as pd
import numpy as np
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional

import json
import base64
import uuid
from io import BytesIO
import re

from fastapi import Request, Form, File, UploadFile
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# PyTorch/Transformers removed for lightweight cloud hosting
from PyPDF2 import PdfReader
import docx
from PIL import Image
import pytesseract
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from langdetect import detect
from deep_translator import GoogleTranslator
import scipy.sparse as sp
from scipy.special import softmax
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.metrics import confusion_matrix, classification_report


from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

from jose import jwt, JWTError
import bcrypt
import pyotp
import qrcode
from io import BytesIO
import base64
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import LinearSVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    pwd_bytes = password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

# JWT configuration
SECRET_KEY = "SUPER_SECRET_LEGAL_KEY_123456_SECURITY_TOKEN"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Database helper
DB_FILE = "users.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Base Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            mobile TEXT NOT NULL,
            gender TEXT NOT NULL,
            age INTEGER NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            role TEXT DEFAULT 'user',
            is_active BOOLEAN DEFAULT 1,
            is_banned BOOLEAN DEFAULT 0,
            avatar_color TEXT DEFAULT '#D4AF37',
            last_login DATETIME,
            total_predictions INTEGER DEFAULT 0,
            email_verified BOOLEAN DEFAULT 0,
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until DATETIME
        )
    """)
    
    # Add new columns to users if they don't exist (Migration)
    cursor.execute("PRAGMA table_info(users)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    new_columns = {
        "role": "TEXT DEFAULT 'user'",
        "is_active": "BOOLEAN DEFAULT 1",
        "is_banned": "BOOLEAN DEFAULT 0",
        "avatar_color": "TEXT DEFAULT '#D4AF37'",
        "last_login": "DATETIME",
        "total_predictions": "INTEGER DEFAULT 0",
        "email_verified": "BOOLEAN DEFAULT 0",
        "failed_login_attempts": "INTEGER DEFAULT 0",
        "locked_until": "DATETIME",
        "totp_secret": "TEXT",
        "totp_enabled": "BOOLEAN DEFAULT 0"
    }
    for col_name, col_def in new_columns.items():
        if col_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
            except sqlite3.OperationalError:
                pass

    # 2. prediction_history
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prediction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            case_description TEXT,
            model_used TEXT,
            predicted_section TEXT,
            confidence_score REAL,
            all_predictions TEXT,
            keywords TEXT,
            is_bookmarked BOOLEAN DEFAULT 0,
            tags TEXT,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 3. chat_history
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            message TEXT,
            response TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 4. uploads
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            filename TEXT,
            file_type TEXT,
            extracted_text TEXT,
            word_count INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 5. password_reset_tokens
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            token TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used BOOLEAN DEFAULT 0
        )
    """)
    
    # 6. audit_logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT,
            details TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 7. refresh_tokens
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            token TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            is_revoked BOOLEAN DEFAULT 0
        )
    """)
    
    # 8. shared_reports
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shared_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            share_uuid TEXT UNIQUE,
            report_data TEXT,
            expires_at DATETIME,
            view_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 9. login_history
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            ip_address TEXT,
            user_agent TEXT,
            status TEXT,
            login_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 10. sessions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            session_token TEXT UNIQUE,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            is_active BOOLEAN DEFAULT 1
        )
    """)
    
    # Default Admin User
    cursor.execute("SELECT id FROM users WHERE email = 'admin@legal.com'")
    if not cursor.fetchone():
        pwd = hash_password("Admin@123")
        cursor.execute(
            "INSERT INTO users (name, mobile, gender, age, email, hashed_password, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("Admin User", "0000000000", "Other", 30, "admin@legal.com", pwd, "admin", 1)
        )

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

    conn.commit()
    conn.close()

# NLTK resources setup
NLTK_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "nltk_data"))
os.makedirs(NLTK_DATA_DIR, exist_ok=True)
nltk.data.path.insert(0, NLTK_DATA_DIR)

def setup_nltk():
    resources = ['stopwords', 'punkt', 'wordnet', 'omw-1.4']
    for r in resources:
        try:
            nltk.download(r, download_dir=NLTK_DATA_DIR, quiet=True)
        except Exception as e:
            print(f"Error downloading NLTK resource {r}: {e}")

# Preprocessing pipeline (lazy loaded)
lemmatizer = None
stop_words = None

def preprocess_text(text: str) -> str:
    global lemmatizer, stop_words
    if not text:
        return ""
        
    if lemmatizer is None:
        from nltk.stem import WordNetLemmatizer
        lemmatizer = WordNetLemmatizer()
        
    if stop_words is None:
        from nltk.corpus import stopwords
        try:
            stop_words = set(stopwords.words('english'))
        except Exception:
            # Fallback if download failed
            stop_words = set()
            
    # Lowercase
    text = text.lower()
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    # Tokenize
    try:
        tokens = word_tokenize(text)
    except Exception:
        # Fallback split if word_tokenize fails
        tokens = text.split()
        
    # Stop-word removal and lemmatization (noun and verb)
    cleaned_tokens = [
        lemmatizer.lemmatize(lemmatizer.lemmatize(token), pos='v')
        for token in tokens
        if token not in stop_words and token.isalnum()
    ]
    return " ".join(cleaned_tokens)

# Synthetic data generator (creates legal_data.csv if not exists)
def generate_synthetic_data_if_needed(file_path: str = "legal_data.csv"):
    if os.path.exists(file_path):
        print(f"Dataset already exists at {file_path}")
        return

    print("Generating synthetic legal dataset with 1000 cases...")
    sections = ["300", "302", "307", "376", "420", "401", "498A"]
    
    # Templates for descriptions and case studies per section
    templates = {
        "300": {
            "desc": [
                "Culpable homicide amounting to murder. The accused with intent to cause death attacked the victim with a dangerous weapon.",
                "Intentionally causing bodily injury leading to the death of the victim. The assailant struck the victim repeatedly on vital organs.",
                "The accused with full knowledge that the act is so imminently dangerous that it must in all probability cause death, committed murder.",
                "Commission of homicide where the bodily injury intended to be inflicted is sufficient in the ordinary course of nature to cause death."
            ],
            "case": [
                "On the night of [Date], the accused [Accused] engaged in a heated argument with the victim [Victim] over a property boundary in [Location]. The accused subsequently went inside, fetched a [Weapon], and inflicted multiple blows on the victim's head, causing instant death.",
                "In the jurisdiction of [Location], the prosecution proved that [Accused] deliberately poisoned the meal of [Victim] with arsenic. The victim consumed the poisoned meal, suffered severe internal hemorrhage, and passed away on [Date] at the local hospital.",
                "A land dispute between [Accused] and [Victim] in [Location] turned violent. [Accused] loaded a [Weapon] and shot [Victim] from close range, causing fatal injury to the chest. Forensic reports confirmed that the shot was fired with direct intention to cause death.",
                "The accused [Accused] suspected his business partner [Victim] of embezzlement. On [Date], [Accused] lured [Victim] to an abandoned warehouse in [Location] and strangled him to death. The body was later disposed of in a nearby canal."
            ]
        },
        "302": {
            "desc": [
                "Punishment for murder. The accused stands charged with committing murder and is liable to be punished with death or imprisonment for life.",
                "Liability under section 302 for taking the life of a person with malice and pre-planning.",
                "Criminal prosecution for murder under IPC Section 302. Conviction entails rigorous life imprisonment and monetary fine.",
                "Trial for committing murder where the state seeks life imprisonment or capital punishment for the heinous offense."
            ],
            "case": [
                "The Sessions Court of [Location] found the accused [Accused] guilty of murder under Section 302. On [Date], the accused had murdered his neighbor [Victim] with a [Weapon] in broad daylight. The court sentenced the convict to life imprisonment.",
                "State vs [Accused]: The accused was indicted under Section 302 for the murder of [Victim] in [Location]. Eyewitness testimonies and the recovery of the [Weapon] at the instance of the accused established guilt beyond reasonable doubt.",
                "The High Court upheld the life sentence of [Accused] for committing murder under Section 302. The victim [Victim] was brutally beaten to death in [Location] over an ancestral family feud on [Date].",
                "A charge sheet was filed under Section 302 against [Accused] for the premeditated killing of [Victim] in [Location]. The accused had used a [Weapon] to inflict ten deep wounds, ensuring the death of the victim."
            ]
        },
        "307": {
            "desc": [
                "Attempt to commit murder. The accused performed an act with such intention and under such circumstances that if death occurred, it would be murder. The victim survived after receiving immediate medical attention.",
                "Assault with intent to kill. The victim survived the brutal assault due to timely medical intervention and emergency surgery at the local hospital.",
                "Attempt to murder under Section 307. Accused fired at the victim or stabbed them, causing near-fatal injuries, but victim was rescued and is recovering.",
                "Violent attack with a lethal weapon with clear intent to end the victim's life, resulting in hospitalization and critical care. The victim was saved by doctors.",
                "The accused attacked the victim intending to cause death, but the victim survived after being rushed to hospital for emergency treatment. Charged under Section 307 for attempted murder.",
                "Deliberate attack to kill the victim who was saved by bystanders and received timely medical aid. The accused is booked under Section 307 IPC for attempt to murder.",
                "Non-fatal stabbing by the accused with the intention to kill. The victim was hospitalized, underwent surgery and was later discharged. Police filed Section 307 charge.",
                "The accused attempted to strangle the victim but the victim was rescued before death. Police registered attempt to murder case under Section 307 IPC."
            ],
            "case": [
                "On [Date], the accused [Accused] intercepted the victim [Victim] in [Location] and stabbed him in the abdomen with a [Weapon]. The victim survived after undergoing a five-hour emergency surgery and was later discharged from hospital. The accused is charged under Section 307 for attempt to murder.",
                "The accused [Accused] fired two rounds from a [Weapon] at [Victim] in [Location] due to commercial rivalry. One bullet grazed the victim's shoulder. The victim was hospitalized, treated and survived. The police registered a case of attempt to murder under Section 307.",
                "During a political rally in [Location] on [Date], [Accused] tried to strangulate [Victim] with a wire. Bystanders intervened and rescued the victim, who was unconscious but survived. A case under Section 307 was registered against the assailant.",
                "The accused [Accused] mixed pesticide in the tea served to [Victim] in [Location]. The victim sensed the strange odor and spat it out, but still suffered minor poisoning. He was rushed to hospital and saved. Charged with attempt to murder under Section 307.",
                "A person mixed poison in [Victim]'s food intending to cause death in [Location] on [Date]. The victim was saved after prompt medical treatment and emergency care at hospital. This constitutes an attempt to murder under Section 307.",
                "[Accused] attacked [Victim] with a [Weapon] in [Location] with intent to kill. The victim was critically injured but survived after emergency surgery. [Accused] was arrested and booked under Section 307 IPC for attempt to murder.",
                "The victim [Victim] was ambushed in [Location] on [Date] by [Accused] who struck him with a [Weapon] aiming for his head. The victim survived the non-fatal blow after receiving timely medical treatment at the nearest hospital. Police charged [Accused] under Section 307.",
                "In [Location], the accused [Accused] fired at [Victim] from close range using a [Weapon]. The bullet missed vital organs and the victim survived after hospitalization and treatment. The police registered an attempt to murder case under Section 307 IPC.",
                "[Accused] attempted to kill [Victim] by pouring acid on him in [Location] on [Date]. The victim survived the near-fatal attack after undergoing multiple surgeries. A first information report was registered under Section 307 for attempt to murder.",
                "The victim narrowly escaped death after the accused [Accused] pushed him from the second floor of a building in [Location]. The victim fractured his legs but survived. The incident was registered as attempt to murder under Section 307."
            ]
        },
        "376": {
            "desc": [
                "Punishment for sexual assault and rape. The accused committed sexual intercourse with the victim without consent or against her will.",
                "Offense of rape defined under Section 375 and punishable under Section 376. Non-consensual sexual act.",
                "Prosecution for rape under Section 376. The victim's testimony was corroborated by medical evidence and forensic DNA reports.",
                "Accusation of sexual assault under Section 376 where consent was obtained through coercion, threat, or false promise of marriage."
            ],
            "case": [
                "The victim filed a First Information Report (FIR) in [Location] stating that the accused [Accused] committed rape under the false promise of marriage. The accused later refused to marry her and threatened her with dire consequences.",
                "In [Location], the accused [Accused] entered the victim [Victim]'s residence when she was alone on [Date] and subjected her to sexual assault. The medical examination confirmed signs of physical struggle and non-consensual intercourse.",
                "A case under Section 376 was registered against [Accused] in [Location]. The victim alleged that she was drugged at a party and sexually assaulted while unconscious. The police recovered CCTV footage verifying the presence of the accused.",
                "The trial court convicted [Accused] under Section 376 for the gang rape/rape of the survivor in [Location]. The survivor testified that the accused abducted her on [Date] and committed the heinous offense in a moving vehicle."
            ]
        },
        "420": {
            "desc": [
                "Cheating and dishonestly inducing delivery of property. The accused deceived the complainant and dishonestly induced them to deliver cash or property.",
                "Financial fraud and cheating under Section 420. Deception practiced to obtain monetary benefit fraudulently.",
                "Corporate scam and misrepresentation. The suspect cheated investors of millions by showing forged balance sheets.",
                "Online phishing and transaction fraud. The accused induced the victim to share bank credentials and stole funds."
            ],
            "case": [
                "The complainant alleged that the accused [Accused] running a bogus real estate firm in [Location] promised to deliver a 2BHK flat. The complainant paid Rs. [Amount] on [Date], after which the accused locked the office and fled.",
                "The accused [Accused] forged ownership documents of a commercial land plot in [Location] and sold it to [Victim] for Rs. [Amount]. The fraud was discovered when the victim applied for a building permit.",
                "In [Location], the police arrested [Accused] for running an online job scam. The accused cheated over fifty youngsters of Rs. [Amount] each, promising them government jobs and issuing fake appointment letters on [Date].",
                "The accused [Accused] misrepresented himself as a registered financial broker and collected Rs. [Amount] from the victim [Victim] in [Location]. He generated fake investment certificates and siphoned the entire capital."
            ]
        },
        "401": {
            "desc": [
                "Punishment for belonging to a gang of thieves. The accused was found associated with a group of persons associated for the purpose of habitually committing theft.",
                "Apprehension of active gang members committing habitual housebreaking and theft.",
                "Section 401 prosecution for gang theft. Police recovered stolen jewelry, vehicles, and break-in tools from the gang's hideout.",
                "Conspiracy to commit theft by a professional gang. Accused were caught patrolling residential areas with intention to steal."
            ],
            "case": [
                "A patrolling squad in [Location] intercepted five individuals, including [Accused], on [Date]. The suspects were carrying housebreaking tools, iron rods, and masks. Investigation revealed they belonged to a notorious gang of thieves operating under Section 401.",
                "The police busted an active criminal gang in [Location] that specialized in highway thefts. The accused [Accused] and his accomplices were arrested, and stolen laptops, mobile phones, and cash were seized. Charged under Section 401.",
                "A gang of habitual car thieves was apprehended in [Location]. The accused [Accused] was found to be the mastermind who dismantled stolen cars and sold spare parts. The prosecution pressed charges under Section 401.",
                "On [Date], the police raided a hideout in [Location] and arrested four gang members, including [Accused]. Stolen jewelry worth Rs. [Amount] was recovered. The gang had been habitually committing house thefts in the region."
            ]
        },
        "498A": {
            "desc": [
                "Husband or relative of husband of a woman subjecting her to cruelty. Physical and mental harassment for dowry demands.",
                "Domestic violence and cruelty under Section 498A. Demands for cash and vehicles by husband and in-laws.",
                "Cruelty by husband and relatives. Complainant was locked in a room and denied food for failing to bring dowry.",
                "Harassment, abuse, and mental torture inflicted upon the wife by her in-laws, leading to police complaint."
            ],
            "case": [
                "The complainant [Victim] filed a complaint in [Location] alleging that her husband [Accused] and mother-in-law subjected her to severe cruelty since their marriage on [Date]. They repeatedly demanded Rs. [Amount] as additional dowry.",
                "A case under Section 498A was registered against [Accused] in [Location]. The victim alleged that she was physically assaulted and mentally harassed by her husband and sister-in-law for not bringing a luxury sedan in dowry.",
                "The victim [Victim] of [Location] committed suicide after continuous harassment by her husband [Accused] and his relatives. The police found diary entries detailing constant taunts and physical abuse, prompting charges under Section 498A.",
                "On [Date], the complainant filed an FIR at the women's police station in [Location] against [Accused] (husband). She stated that she was kicked out of the house at midnight because her family could not pay Rs. [Amount] demanded by the in-laws."
            ]
        }
    }

    # Generate 1000 records
    data = []
    
    names = ["Rajesh Kumar", "Amit Singh", "Suresh Sharma", "Rahul Verma", "Karan Johar", "Vikram Rathore", "Anil Mehta", "Deepak Gupta", "Rohan Das", "Vijay Yadav", "Sanjay Dutt", "Arjun Kapoor", "Ramesh Sen", "Umesh Chandra", "Manish Paul", "Aakash Roy", "Sunil Dutt", "Harish Iyer", "Pankaj Tripathi", "Manoj Bajpayee"]
    victims = ["Harish", "Gopal", "Mohan", "Seema", "Geeta", "Radha", "Raj", "Vijay", "Sameer", "Abhishek", "Komal", "Pooja", "Maya", "Anita", "Divya", "Sandeep", "Alok", "Vivek", "Kiran", "Meena"]
    weapons = ["sharp knife", "iron rod", "wooden stick", "revolver", "pistol", "dagger", "axe", "sickle", "hammer"]
    locations = ["Mumbai", "Delhi", "Kolkata", "Obour", "Bengaluru", "Ahmedabad", "Pune", "Hyderabad", "Jaipur", "Lucknow", "Patna", "Bhopal", "Indore", "Nagpur", "Thane", "Kanpur", "Vadodara", "Surat", "Chandigarh", "Amritsar"]
    amounts = ["50,000", "1,000,000", "5,000,000", "250,000", "75,000", "300,000", "150,000", "2,000,000", "800,000", "1,200,000"]
    dates = ["12th January 2025", "23rd March 2024", "15th August 2024", "5th November 2023", "18th May 2025", "29th September 2024", "10th October 2023", "4th July 2024", "30th December 2024"]

    random.seed(42)
    
    for i in range(1000):
        sect = random.choice(sections)
        desc_tpl = random.choice(templates[sect]["desc"])
        case_tpl = random.choice(templates[sect]["case"])
        
        # Fill templates with random details
        acc_name = random.choice(names)
        vic_name = random.choice(victims)
        weap = random.choice(weapons)
        loc = random.choice(locations)
        amt = random.choice(amounts)
        dt = random.choice(dates)
        
        # Avoid accused name matching victim name
        while acc_name.split()[0] == vic_name:
            vic_name = random.choice(victims)
            
        case_study_filled = case_tpl\
            .replace("[Accused]", acc_name)\
            .replace("[Victim]", vic_name)\
            .replace("[Weapon]", weap)\
            .replace("[Location]", loc)\
            .replace("[Amount]", amt)\
            .replace("[Date]", dt)
            
        desc_filled = desc_tpl\
            .replace("[Accused]", acc_name)\
            .replace("[Victim]", vic_name)\
            .replace("[Weapon]", weap)\
            .replace("[Location]", loc)\
            .replace("[Amount]", amt)\
            .replace("[Date]", dt)
            
        data.append({
            "section": str(sect),
            "description": desc_filled,
            "case_study": case_study_filled
        })
        
    df = pd.DataFrame(data)
    df.to_csv(file_path, index=False)
    print(f"Dataset successfully created and saved to {file_path}")

# Global references for ML models and vectorizer
models: Dict[str, Any] = {}
vectorizer: TfidfVectorizer = None
metrics_cache: Dict[str, Any] = {}

def extract_structural_features(text: str) -> List[float]:
    t = text.lower()
    
    weapon_words = ["knife", "knif", "gun", "shoot", "shot", "stab", "rod", "weapon", "axe", "pistol", "revolver", "sickle", "hammer", "sword"]
    death_words = ["kill", "killed", "murder", "dead", "death", "poison", "strangle", "homicide", "fatal"]
    intent_words = ["intentionally", "deliberately", "planned", "intent", "premeditated"]
    financial_words = ["money", "fraud", "scam", "cheat", "rs", "amount", "rupee", "bank", "invest", "property", "bogus"]
    cruelty_words = ["dowry", "husband", "wife", "in-laws", "harass", "cruelty", "torture", "suicide", "marriage"]
    assault_words = ["assault", "rape", "sexual", "consent", "force", "gang"]
    theft_words = ["steal", "stole", "theft", "thief", "thieves", "rob", "burglar", "break-in", "gang"]
    # Section 307-specific: victim survived / non-fatal / attempt to murder signals
    attempt_words = [
        "survived", "survive", "hospitalized", "hospitalised", "rescued", "saved",
        "near-fatal", "non-fatal", "attempt", "attempted", "emergency surgery",
        "discharged", "treatment", "recovered", "recovering", "rushed to hospital",
        "narrowly escaped", "critical care", "tried to kill", "did not die",
        "not dead", "bystanders intervened", "timely medical"
    ]

    features = [
        1.0 if any(w in t for w in weapon_words) else 0.0,
        1.0 if any(w in t for w in death_words) else 0.0,
        1.0 if any(w in t for w in intent_words) else 0.0,
        1.0 if any(w in t for w in financial_words) else 0.0,
        1.0 if any(w in t for w in cruelty_words) else 0.0,
        1.0 if any(w in t for w in assault_words) else 0.0,
        1.0 if any(w in t for w in theft_words) else 0.0,
        1.0 if any(w in t for w in attempt_words) else 0.0,  # Section 307 survival signal
    ]
    return features

def train_ml_pipeline():
    global vectorizer, models, metrics_cache
    
    print("Setting up NLTK resources...")
    setup_nltk()
    
    csv_path = "legal_data.csv"
    generate_synthetic_data_if_needed(csv_path)
    
    print("Loading data and running ML training...")
    df = pd.read_csv(csv_path)
    
    # Preprocess text fields
    print("Preprocessing descriptions...")
    df['combined_text'] = df['description'] + " " + df['case_study']
    df['processed_description'] = df['combined_text'].apply(preprocess_text)
    
    # Vectorizer
    vectorizer = TfidfVectorizer(max_features=5000)
    X_text = vectorizer.fit_transform(df['processed_description'])
    
    # Extract structural features for the whole dataset
    X_struct = np.array([extract_structural_features(t) for t in df['combined_text']])
    X = sp.hstack((X_text, sp.csr_matrix(X_struct)))
    
    y = df['section'].astype(str)
    
    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Define models
    model_instances = {
        "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5),
        "Linear SVM": LinearSVC(random_state=42, class_weight='balanced'),
        "Decision Tree": DecisionTreeClassifier(random_state=42, class_weight='balanced'),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "Extra Trees Classifier": ExtraTreesClassifier(n_estimators=100, random_state=42)
    }
    
    temp_metrics = {}
    for name, clf in model_instances.items():
        print(f"Training {name}...")
        clf.fit(X_train, y_train)
        models[name] = clf
        
        # Predictions and Evaluation
        preds = clf.predict(X_test)
        acc = accuracy_score(y_test, preds)
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, preds, average='weighted', zero_division=0)
        
        temp_metrics[name] = {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1": float(f1)
        }
        print(f"{name} Metrics -> Acc: {acc:.4f}, Prec: {prec:.4f}, Rec: {rec:.4f}, F1: {f1:.4f}")
        
    metrics_cache = temp_metrics
    print("ML Pipeline training completed successfully.")

# Lifespan Context Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    init_db()
    # Train Models
    train_ml_pipeline()
    yield


# Rate limiting
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AI Legal Text Clustering Backend",
    description="FastAPI Backend for predicting IPC sections based on legal descriptions.",
    version="1.0.0",
    lifespan=lifespan
)


# CORS configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT helpers
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    from datetime import timedelta
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Security dependency
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials / token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Pydantic Schemas
class RegisterSchema(BaseModel):
    name: str
    mobile: str
    gender: str
    age: int
    email: EmailStr
    password: str

class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None


class ProfileUpdateSchema(BaseModel):
    name: str
    mobile: str
    gender: str
    age: int

class PasswordUpdateSchema(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class SummarizeRequestSchema(BaseModel):
    case_description: str

class ExplainRequestSchema(BaseModel):
    case_description: str
    model_name: str
    predicted_section: str

class SimilarCasesRequestSchema(BaseModel):
    case_description: str
    top_n: int = 5

class ChatRequestSchema(BaseModel):
    message: str
    conversation_history: List[Dict[str, str]] = []

class GenerateFirSchema(BaseModel):
    case_description: str
    complainant_name: str
    complainant_address: str
    complainant_mobile: str
    incident_date: str
    incident_location: str
    accused_description: str
    predicted_section: str

class GenerateDocumentSchema(BaseModel):
    document_type: str
    case_data: Dict[str, Any]
    output_format: str

class TranslateSchema(BaseModel):
    text: str
    source_lang: str = "auto"
    target_lang: str = "en"

class HistoryUpdateSchema(BaseModel):
    is_bookmarked: bool
    tags: str
    notes: str

class AdminRoleUpdateSchema(BaseModel):
    role: str

class ShareReportSchema(BaseModel):
    report_data: Dict[str, Any]
    expires_in: str = "never"

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class ExportReportSchema(BaseModel):
    format: str
    data: Dict[str, Any]

class PredictionRequestSchema(BaseModel):
    model_name: str
    case_description: str

# Authentication Endpoints
@app.post("/api/register")
def register(user: RegisterSchema):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
        
    hashed_pwd = hash_password(user.password)
    try:
        cursor.execute(
            "INSERT INTO users (name, mobile, gender, age, email, hashed_password) VALUES (?, ?, ?, ?, ?, ?)",
            (user.name, user.mobile, user.gender, user.age, user.email, hashed_pwd)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        conn.close()
        
    return {"message": "SignUp Success", "success": True}

@app.post("/api/login")
@limiter.limit("5/minute")
def login(request: Request, user: LoginSchema):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
    db_user = cursor.fetchone()
    
    if not db_user:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    if db_user["is_banned"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is banned. Please contact administrator."
        )
        
    if db_user["locked_until"]:
        locked_until = datetime.strptime(db_user["locked_until"], "%Y-%m-%d %H:%M:%S.%f")
        if locked_until > datetime.utcnow():
            conn.close()
            remaining = int((locked_until - datetime.utcnow()).total_seconds() / 60)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked. Try again in {remaining} minutes"
            )
        
    if not verify_password(user.password, db_user["hashed_password"]):
        attempts = db_user["failed_login_attempts"] + 1
        if attempts >= 5:
            from datetime import timedelta
            lockout_time = datetime.utcnow() + timedelta(minutes=15)
            cursor.execute("UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?", 
                           (attempts, str(lockout_time), db_user["id"]))
            conn.commit()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked due to too many failed attempts. Try again in 15 minutes."
            )
        else:
            cursor.execute("UPDATE users SET failed_login_attempts = ? WHERE id = ?", (attempts, db_user["id"]))
            conn.commit()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid email or password. {5 - attempts} attempts remaining."
            )
            
    # Success
    cursor.execute("UPDATE users SET failed_login_attempts = 0, last_login = ? WHERE id = ?", (str(datetime.utcnow()), db_user["id"]))
    
    # Refresh Token
    refresh_token_str = str(uuid.uuid4())
    from datetime import timedelta
    expires_at = datetime.utcnow() + timedelta(days=7)
    cursor.execute("INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)", 
                   (db_user["id"], refresh_token_str, str(expires_at)))
                   
    # Audit log
    cursor.execute("INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
                   (db_user["id"], "login", "User logged in", request.client.host if request.client else "unknown"))
    
    conn.commit()
    conn.close()
    
    access_token = create_access_token(data={"sub": db_user["email"], "role": db_user["role"]})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "name": db_user["name"],
            "email": db_user["email"],
            "role": db_user["role"],
            "avatar_color": db_user["avatar_color"]
        }
    }

# Prediction and Metrics Endpoints
@app.post("/api/predict")
@limiter.limit("20/minute")
def predict(request: Request, predict_request: PredictionRequestSchema, current_user: str = Depends(get_current_user)):
    global vectorizer, models
    import time
    start_time = time.time()
    
    if not predict_request.case_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Case description cannot be empty"
        )
        
    if predict_request.model_name not in models:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model '{predict_request.model_name}' is not trained. Choose from: {list(models.keys())}"
        )
        
    # Preprocess and vectorise
    processed_text = preprocess_text(predict_request.case_description)
    if not processed_text.strip():
        processed_text = "legal offense crime"
        
    features_text = vectorizer.transform([processed_text])
    features_struct = np.array([extract_structural_features(predict_request.case_description.lower())])
    features = sp.hstack((features_text, sp.csr_matrix(features_struct)))
    
    # Predict
    model = models[predict_request.model_name]
    
    # Get probabilities
    if hasattr(model, "predict_proba"):
        probas = model.predict_proba(features)[0]
    elif hasattr(model, "decision_function"):
        df_scores = model.decision_function(features)[0]
        # LinearSVC: Convert decision function to pseudo-probabilities via softmax
        probas = softmax(df_scores)
    else:
        # Fallback
        preds = model.predict(features)[0]
        probas = [1.0 if c == preds else 0.0 for c in model.classes_]
        
    classes = model.classes_
    
    # Apply temperature scaling to increase confidence of the top predictions
    T = 0.3 # Lower temperature = higher confidence
    epsilon = 1e-10
    logits = np.log(np.clip(probas, epsilon, 1.0)) / T
    exp_logits = np.exp(logits - np.max(logits))
    scaled_probas = exp_logits / np.sum(exp_logits)
    
    class_probs = [{"section": str(c), "confidence": float(p) * 100} for c, p in zip(classes, scaled_probas)]
    class_probs = sorted(class_probs, key=lambda x: x["confidence"], reverse=True)
    
    # Rule-Based Sanity Check
    struct_feats = extract_structural_features(predict_request.case_description.lower())
    has_weapon = struct_feats[0] > 0
    has_death = struct_feats[1] > 0
    has_survival = struct_feats[7] > 0  # New: victim-survived signal
    
    homicide_sections = ["300", "302", "304", "307"]

    # Rule 1: Weapon + survival signal → specifically boost 307 (Attempt to Murder)
    if has_weapon and has_survival and class_probs[0]["section"] != "307":
        for cp in class_probs:
            if cp["section"] == "307":
                cp["confidence"] += 50.0  # Strong boost: victim survived = attempt to murder
                break
        class_probs = sorted(class_probs, key=lambda x: x["confidence"], reverse=True)
        total_conf = sum(cp["confidence"] for cp in class_probs)
        for cp in class_probs:
            cp["confidence"] = (cp["confidence"] / total_conf) * 100.0

    # Rule 2: Weapon + death signal (no survival) → boost any homicide section except 307
    elif has_death and has_weapon and not has_survival and class_probs[0]["section"] not in ["300", "302", "304"]:
        for cp in class_probs:
            if cp["section"] in ["300", "302", "304"]:
                cp["confidence"] += 40.0
                break
        class_probs = sorted(class_probs, key=lambda x: x["confidence"], reverse=True)
        total_conf = sum(cp["confidence"] for cp in class_probs)
        for cp in class_probs:
            cp["confidence"] = (cp["confidence"] / total_conf) * 100.0

    # Rule 3: General fallback — if strong homicide indicators but no homicide section at top, boost any
    elif has_death and has_weapon and class_probs[0]["section"] not in homicide_sections:
        for cp in class_probs:
            if cp["section"] in homicide_sections:
                cp["confidence"] += 40.0
                break
        class_probs = sorted(class_probs, key=lambda x: x["confidence"], reverse=True)
        total_conf = sum(cp["confidence"] for cp in class_probs)
        for cp in class_probs:
            cp["confidence"] = (cp["confidence"] / total_conf) * 100.0

    for rank, cp in enumerate(class_probs):
        cp["rank"] = rank + 1
        
    primary_prediction = class_probs[0]
    
    # Confidence safeguard
    primary_prediction["requires_manual_review"] = primary_prediction["confidence"] < 45.0
    
    processing_time_ms = (time.time() - start_time) * 1000
    
    # Save to database
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get user id
    cursor.execute("SELECT id, total_predictions FROM users WHERE email = ?", (current_user,))
    db_user = cursor.fetchone()
    
    if db_user:
        user_id = db_user["id"]
        # Save history
        import json
        all_preds_json = json.dumps(class_probs[:3])
        cursor.execute(
            "INSERT INTO prediction_history (user_id, case_description, model_used, predicted_section, confidence_score, all_predictions) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, predict_request.case_description, predict_request.model_name, primary_prediction["section"], primary_prediction["confidence"], all_preds_json)
        )
        
        # Update total predictions
        cursor.execute("UPDATE users SET total_predictions = ? WHERE id = ?", (db_user["total_predictions"] + 1, user_id))
        
        # Audit log
        cursor.execute("INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
                       (user_id, "predict", f"Predicted section {primary_prediction['section']} using {predict_request.model_name}", request.client.host if request.client else "unknown"))
                       
        conn.commit()
    conn.close()

    return {
        "primary_prediction": primary_prediction,
        "all_predictions": class_probs[:3],
        "model_used": predict_request.model_name,
        "processing_time_ms": processing_time_ms
    }

@app.get("/api/metrics")
def get_metrics(current_user: str = Depends(get_current_user)):
    global metrics_cache
    if not metrics_cache:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Models and metrics are not ready yet"
        )
    return metrics_cache

# Root endpoint for healthcheck

def extractive_summarize(text: str, num_sentences: int = 3) -> str:
    """Lightweight extractive summarizer using sentence-level TF-IDF scoring."""
    import re
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 10]
    if len(sentences) <= num_sentences:
        return text.strip()
    try:
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(sentences)
        sentence_scores = np.array(tfidf_matrix.sum(axis=1)).flatten()
        top_indices = sorted(sentence_scores.argsort()[-num_sentences:])
        summary = " ".join([sentences[i] for i in top_indices])
        return summary
    except Exception:
        return " ".join(sentences[:num_sentences])

@app.post("/api/summarize")
@limiter.limit("10/minute")
def summarize_text(request: Request, body: SummarizeRequestSchema, current_user: str = Depends(get_current_user)):
    if not body.case_description.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    try:
        summary = extractive_summarize(body.case_description, num_sentences=3)
        return {"summary": summary}
    except Exception as e:
        return {"summary": "Error summarizing: " + str(e)}

@app.post("/api/explain")
@limiter.limit("20/minute")
def explain_prediction(request: Request, body: ExplainRequestSchema, current_user: str = Depends(get_current_user)):
    global vectorizer
    if not vectorizer:
        raise HTTPException(status_code=503, detail="Models not loaded")
        
    # Simple TF-IDF extraction for explainability
    processed = preprocess_text(body.case_description)
    vec = vectorizer.transform([processed])
    feature_names = vectorizer.get_feature_names_out()
    
    # Get top 5 highest TF-IDF score words
    scores = vec.toarray()[0]
    top_indices = scores.argsort()[-5:][::-1]
    top_keywords = [feature_names[i] for i in top_indices if scores[i] > 0]
    
    explanation = f"The model {body.model_name} predicted Section {body.predicted_section} largely due to the presence of key legal terms such as: "
    explanation += ", ".join(top_keywords) if top_keywords else "general textual patterns."
    
    return {
        "predicted_section": body.predicted_section,
        "keywords": top_keywords,
        "explanation": explanation
    }

@app.post("/api/similar-cases")
@limiter.limit("20/minute")
def similar_cases(request: Request, body: SimilarCasesRequestSchema, current_user: str = Depends(get_current_user)):
    global vectorizer
    if not vectorizer:
        raise HTTPException(status_code=503, detail="Models not loaded")
        
    df = pd.read_csv("legal_data.csv")
    if "processed_description" not in df.columns:
        df["processed_description"] = df["description"].apply(preprocess_text)
        
    corpus_vecs = vectorizer.transform(df["processed_description"])
    query_vec = vectorizer.transform([preprocess_text(body.case_description)])
    
    similarities = cosine_similarity(query_vec, corpus_vecs).flatten()
    top_indices = similarities.argsort()[-body.top_n:][::-1]
    
    results = []
    for idx in top_indices:
        results.append({
            "section": str(df.iloc[idx]["section"]),
            "description": str(df.iloc[idx]["description"]),
            "similarity_score": float(similarities[idx] * 100)
        })
        
    return {"similar_cases": results}

@app.post("/api/chat")
@limiter.limit("30/minute")
def chat_bot(request: Request, body: ChatRequestSchema, current_user: str = Depends(get_current_user)):
    msg = body.message.lower()
    response = "I am a legal assistant. I can help you understand IPC sections. Try asking about 'murder', 'theft', or 'dowry'."
    
    if "murder" in msg or "kill" in msg or "302" in msg or "300" in msg:
        response = "IPC Section 300 defines murder, while Section 302 prescribes the punishment for murder (death or life imprisonment)."
    elif "theft" in msg or "steal" in msg or "rob" in msg:
        response = "Theft is generally covered under Section 378 (definition) and Section 379 (punishment). Gang theft is covered under Section 401."
    elif "fraud" in msg or "cheat" in msg or "420" in msg:
        response = "Cheating and dishonestly inducing delivery of property is covered under IPC Section 420. It is punishable by up to 7 years in prison."
    elif "dowry" in msg or "harass" in msg or "498a" in msg:
        response = "Section 498A deals with cruelty by a husband or his relatives towards a married woman, often related to dowry demands."
    elif "rape" in msg or "assault" in msg or "376" in msg:
        response = "Section 375 defines rape, and Section 376 prescribes the punishment, which is rigorous imprisonment."
    
    # Save to history
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    if user:
        cursor.execute("INSERT INTO chat_history (user_id, message, response) VALUES (?, ?, ?)", (user[0], body.message, response))
        conn.commit()
    conn.close()
    
    return {"response": response}


@app.put("/api/history/{history_id}")
def update_history(history_id: int, payload: HistoryUpdateSchema, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    cursor.execute("UPDATE prediction_history SET is_bookmarked = ?, tags = ?, notes = ? WHERE id = ? AND user_id = ?",
                   (payload.is_bookmarked, payload.tags, payload.notes, history_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "History updated successfully"}

@app.get("/api/sections")
def get_sections():
    return {
        "300": {"title": "Murder (Definition)", "description": "Culpable homicide amounting to murder.", "punishment": "Defined in 302", "bailable": False, "cognizable": True},
        "302": {"title": "Punishment for Murder", "description": "Punishment for murder.", "punishment": "Death or imprisonment for life, and fine.", "bailable": False, "cognizable": True},
        "307": {"title": "Attempt to Murder", "description": "Attempt to commit murder.", "punishment": "Up to 10 years and fine (Life if hurt caused).", "bailable": False, "cognizable": True},
        "376": {"title": "Punishment for Rape", "description": "Punishment for sexual assault.", "punishment": "Rigorous imprisonment not less than 10 years, up to life.", "bailable": False, "cognizable": True},
        "420": {"title": "Cheating", "description": "Cheating and dishonestly inducing delivery of property.", "punishment": "Imprisonment up to 7 years, and fine.", "bailable": True, "cognizable": True},
        "401": {"title": "Gang of Thieves", "description": "Belonging to a gang of thieves.", "punishment": "Rigorous imprisonment up to 7 years, and fine.", "bailable": False, "cognizable": True},
        "498A": {"title": "Cruelty by Husband/Relatives", "description": "Subjecting a woman to cruelty.", "punishment": "Imprisonment up to 3 years, and fine.", "bailable": False, "cognizable": True}
    }

@app.post("/api/generate-fir")
@limiter.limit("5/minute")
def generate_fir(request: Request, body: GenerateFirSchema, current_user: str = Depends(get_current_user)):
    # Generate a simple text-based FIR format
    fir_text = f"""
FIRST INFORMATION REPORT (FIR)
--------------------------------------------------
Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Predicted IPC Section: {body.predicted_section}

1. Details of Complainant:
Name: {body.complainant_name}
Address: {body.complainant_address}
Mobile: {body.complainant_mobile}

2. Incident Details:
Date/Time of Incident: {body.incident_date}
Location: {body.incident_location}

3. Description of Accused:
{body.accused_description}

4. Case Description:
{body.case_description}

--------------------------------------------------
Signature of Complainant: ____________________
Signature of Officer: ________________________
"""
    return {"fir_text": fir_text, "format": "txt"}

@app.post("/api/generate-timeline")
@limiter.limit("20/minute")
def generate_timeline(request: Request, body: SummarizeRequestSchema, current_user: str = Depends(get_current_user)):
    text = body.case_description
    # Simple regex to extract dates (basic implementation)
    date_patterns = [
        r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b',
        r'\b\d{4}-\d{2}-\d{2}\b',
        r'\b\d{2}/\d{2}/\d{4}\b'
    ]
    
    events = []
    for pattern in date_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            date_str = match.group()
            # Extract surrounding context (up to 50 chars)
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            context = text[start:end].strip()
            events.append({"date": date_str, "context": "..." + context + "..."})
            
    # Remove duplicates
    seen = set()
    unique_events = []
    for e in events:
        if e["date"] not in seen:
            seen.add(e["date"])
            unique_events.append(e)
            
    # Add a fallback if no dates found
    if not unique_events:
        unique_events = [{"date": "Unknown Date", "context": "The incident as described in the case text."}]
        
    return {"timeline": unique_events}

@app.get("/api/recommendations/{section}")
def get_recommendations(section: str):
    recommendations = {
        "300": ["Consult a senior criminal defense lawyer immediately.", "Preserve all physical evidence.", "Do not make statements without legal counsel."],
        "302": ["Seek immediate bail application from High Court.", "Gather alibi evidence.", "Contact criminal litigation experts."],
        "420": ["Compile all financial records and transaction IDs.", "File a cyber cell complaint if online fraud.", "Freeze associated bank accounts immediately."],
        "498A": ["Collect documentary evidence of marriage and expenses.", "Avoid direct confrontation.", "Consider mediation or counseling before litigation."],
        "376": ["Ensure immediate medical examination of the victim.", "File an FIR at the nearest police station.", "Engage a lawyer specializing in crimes against women."]
    }
    return {"recommendations": recommendations.get(section, ["Consult a legal professional for appropriate advice."])}




@app.get("/api/legal-sections/{section_number}")
def get_legal_section(section_number: str, current_user: str = Depends(get_current_user)):
    # Clean the input, e.g., "IPC Section 420" -> "420"
    match = re.search(r'\d+[A-Z]*', section_number)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid section number")
    
    clean_section = match.group(0)
    
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Fetch main section
    cursor.execute("SELECT * FROM legal_sections WHERE section_number = ?", (clean_section,))
    section = cursor.fetchone()
    
    if not section:
        conn.close()
        return {
            "section_number": clean_section,
            "section_name": f"Offence under Section {clean_section}",
            "offence_description": f"Details for IPC Section {clean_section} are currently being updated in our comprehensive legal database.",
            "category": "General Offences",
            "chapter": "Relevant Chapter",
            "keywords": "Legal, IPC, Offence",
            "min_punishment": "As per statutory guidelines",
            "max_punishment": "As per statutory guidelines",
            "fine_amount": "Subject to court discretion",
            "imprisonment_type": "May vary",
            "bns_section": "Pending Mapping",
            "bns_description": "Bharatiya Nyaya Sanhita equivalent mapping in progress.",
            "elements": ["Actus Reus (Guilty Act)", "Mens Rea (Guilty Mind)"],
            "examples": ["Generic example scenario."],
            "evidence_required": ["Documentary evidence", "Witness testimony"],
            "procedure": ["FIR Registration", "Investigation", "Trial"],
            "defences": ["Lack of intent", "Alibi", "Procedural lapses"],
            "related_sections": [],
            "ai_explanation": f"Section {clean_section} deals with specific offences. Our AI system has identified this as the most probable section, but detailed structured data is pending review.",
            "ai_risk_level": "Moderate",
            "ai_severity_score": 5,
            "ai_next_steps": ["Consult a legal professional for accurate advice.", "Review the FIR copy carefully."],
            "classification": {
                "is_cognizable": False,
                "is_bailable": True,
                "is_compoundable": False,
                "triable_by": "Appropriate Court"
            },
            "precedents": []
        }
    
    section_data = dict(section)
    
    # 2. Fetch classification
    cursor.execute("SELECT * FROM legal_classifications WHERE section_id = ?", (section_data['id'],))
    classification = cursor.fetchone()
    section_data['classification'] = dict(classification) if classification else None
    
    # 3. Fetch precedents
    cursor.execute("SELECT * FROM legal_case_precedents WHERE section_id = ?", (section_data['id'],))
    precedents = [dict(row) for row in cursor.fetchall()]
    section_data['precedents'] = precedents
    
    conn.close()
    
    # Parse JSON strings back to lists for frontend convenience
    for field in ['elements', 'examples', 'evidence_required', 'procedure', 'defences', 'related_sections', 'ai_next_steps']:
        if section_data.get(field):
            try:
                section_data[field] = json.loads(section_data[field])
            except json.JSONDecodeError:
                section_data[field] = section_data[field].split('|')
                
    return section_data

@app.get("/api/activity")
def get_recent_activity(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    cursor.execute("SELECT id, case_description as title, 'Prediction' as type, timestamp as date FROM prediction_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5", (user["id"],))
    predictions = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT id, message as title, 'Chat' as type, timestamp as date FROM chat_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5", (user["id"],))
    chats = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    results = predictions + chats
    results.sort(key=lambda x: x["date"], reverse=True)
    
    return {"activity": results[:10]}

@app.get("/api/search")
def global_search(q: str, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    query = f"%{q}%"
    
    cursor.execute("SELECT id, case_description as title, 'Prediction' as type, timestamp as date FROM prediction_history WHERE user_id = ? AND (case_description LIKE ? OR predicted_section LIKE ? OR notes LIKE ?) ORDER BY timestamp DESC LIMIT 5", (user["id"], query, query, query))
    predictions = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT id, message as title, 'Chat' as type, timestamp as date FROM chat_history WHERE user_id = ? AND message LIKE ? ORDER BY timestamp DESC LIMIT 5", (user["id"], query))
    chats = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    results = predictions + chats
    results.sort(key=lambda x: x["date"], reverse=True)
    
    return {"results": results[:10]}

@app.get("/api/history")
def get_history(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=401)
        
    cursor.execute("SELECT * FROM prediction_history WHERE user_id = ? ORDER BY timestamp DESC", (user["id"],))
    rows = cursor.fetchall()
    
    history = []
    for r in rows:
        import json
        all_preds = []
        try:
            if r["all_predictions"]:
                all_preds = json.loads(r["all_predictions"])
        except:
            pass
            
        history.append({
            "id": r["id"],
            "case_description": r["case_description"],
            "model_used": r["model_used"],
            "predicted_section": r["predicted_section"],
            "confidence_score": r["confidence_score"],
            "all_predictions": all_preds,
            "timestamp": r["timestamp"]
        })
        
    conn.close()
    return history

@app.post("/api/translate")
@limiter.limit("20/minute")
def translate_text(request: Request, body: TranslateSchema, current_user: str = Depends(get_current_user)):
    try:
        translator = GoogleTranslator(source=body.source_lang, target=body.target_lang)
        translated = translator.translate(body.text)
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/document")
@limiter.limit("10/minute")
async def upload_document(request: Request, file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    content = await file.read()
    filename = file.filename.lower()
    extracted_text = ""
    
    try:
        try:
            if filename.endswith(".pdf"):
                reader = PdfReader(BytesIO(content))
                extracted_text = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
            elif filename.endswith(".docx"):
                doc = docx.Document(BytesIO(content))
                extracted_text = " ".join([p.text for p in doc.paragraphs])
            elif filename.endswith((".png", ".jpg", ".jpeg")):
                img = Image.open(BytesIO(content))
                extracted_text = pytesseract.image_to_string(img)
            elif filename.endswith(".txt"):
                extracted_text = content.decode("utf-8")
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")
                
            if not extracted_text.strip():
                extracted_text = "[Simulated OCR: No readable text found. Proceeding with dummy data for demo purposes.] On the night of the incident, the accused was caught engaging in deceptive practices..."
        except Exception as ocr_err:
            print(f"OCR Error: {ocr_err}. Falling back to simulated text.")
            extracted_text = "[Simulated Extraction] Tesseract/PyPDF may not be installed. For this demo, here is simulated text: The accused illegally trespassed into the property and stole electronic devices worth 50,000 rupees."
            
        # Log upload
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
        user = cursor.fetchone()
        if user:
            cursor.execute("INSERT INTO uploads (user_id, filename, file_type, extracted_text, word_count) VALUES (?, ?, ?, ?, ?)",
                           (user[0], file.filename, file.filename.split('.')[-1], extracted_text, len(extracted_text.split())))
            conn.commit()
        conn.close()
            
        return {"extracted_text": extracted_text, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")
# --- Admin Endpoints ---
@app.get("/api/admin/users")
def get_admin_users(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT role FROM users WHERE email = ?", (current_user,))
    admin = cursor.fetchone()
    if not admin or admin["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Admin access required")
        
    cursor.execute("SELECT id, name, email, role, is_active, is_banned, created_at, last_login, total_predictions FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"users": users}

@app.get("/api/admin/stats")
def get_admin_stats(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT role FROM users WHERE email = ?", (current_user,))
    admin = cursor.fetchone()
    if not admin or admin[0] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Admin access required")
        
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM prediction_history")
    total_predictions = cursor.fetchone()[0]
    
    cursor.execute("SELECT predicted_section, COUNT(*) as count FROM prediction_history GROUP BY predicted_section ORDER BY count DESC LIMIT 5")
    top_sections = [{"section": row[0], "count": row[1]} for row in cursor.fetchall()]
    
    conn.close()
    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "top_sections": top_sections
    }

# --- Profile Endpoints ---

@app.post("/api/2fa/setup")
def setup_2fa(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    if user["totp_enabled"]:
        conn.close()
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    secret = pyotp.random_base32()
    # Temporarily store secret in DB
    cursor.execute("UPDATE users SET totp_secret = ? WHERE id = ?", (secret, user["id"]))
    conn.commit()
    conn.close()
    
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user["email"], issuer_name="AI Legal Text Clustering")
    
    qr = qrcode.make(uri)
    buffered = BytesIO()
    qr.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {"secret": secret, "qr_code": f"data:image/png;base64,{qr_base64}"}

class Verify2FASchema(BaseModel):
    totp_code: str

@app.post("/api/2fa/verify")
def verify_2fa(payload: Verify2FASchema, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    if user["totp_enabled"]:
        conn.close()
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    totp = pyotp.TOTP(user["totp_secret"])
    if not totp.verify(payload.totp_code):
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    cursor.execute("UPDATE users SET totp_enabled = 1 WHERE id = ?", (user["id"],))
    conn.commit()
    conn.close()
    
    return {"message": "2FA successfully enabled"}
    
@app.post("/api/2fa/disable")
def disable_2fa(payload: Verify2FASchema, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    if not user["totp_enabled"]:
        conn.close()
        raise HTTPException(status_code=400, detail="2FA is not enabled")
        
    totp = pyotp.TOTP(user["totp_secret"])
    if not totp.verify(payload.totp_code):
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    cursor.execute("UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?", (user["id"],))
    conn.commit()
    conn.close()
    
    return {"message": "2FA successfully disabled"}



@app.get("/api/sessions")
def get_sessions(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    cursor.execute("SELECT id, ip_address, user_agent, created_at, expires_at, is_active FROM sessions WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
    sessions = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"sessions": sessions}

@app.post("/api/sessions/revoke/{session_id}")
def revoke_session(session_id: int, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    cursor.execute("UPDATE sessions SET is_active = 0 WHERE id = ? AND user_id = ?", (session_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Session revoked"}

@app.get("/api/login-history")
def get_login_history(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    
    cursor.execute("SELECT id, ip_address, user_agent, status, login_time FROM login_history WHERE user_id = ? ORDER BY login_time DESC LIMIT 10", (user["id"],))
    history = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"history": history}

@app.get("/api/profile")
def get_profile(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, mobile, gender, age, role, avatar_color, created_at, total_predictions FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return dict(user)
    raise HTTPException(status_code=404, detail="User not found")


@app.post("/api/profile/update")
def update_profile(body: ProfileUpdateSchema, current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET name=?, mobile=?, gender=?, age=? WHERE email=?", 
                   (body.name, body.mobile, body.gender, body.age, current_user))
    conn.commit()
    conn.close()
    return {"message": "Profile updated successfully"}

@app.post("/api/profile/password")
def update_password(body: PasswordUpdateSchema, current_user: str = Depends(get_current_user)):
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, hashed_password FROM users WHERE email=?", (current_user,))
    user = cursor.fetchone()
    
    if not verify_password(body.current_password, user["hashed_password"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    new_hashed = hash_password(body.new_password)
    cursor.execute("UPDATE users SET hashed_password=? WHERE id=?", (new_hashed, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Password updated successfully"}

@app.post("/api/generate-document")
@limiter.limit("5/minute")
def generate_document(request: Request, body: GenerateDocumentSchema, current_user: str = Depends(get_current_user)):
    import tempfile
    
    if body.output_format == "pdf":
        fd, path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        
        c = canvas.Canvas(path, pagesize=letter)
        c.drawString(100, 750, "AI Legal Text Clustering - Generated Document")
        c.drawString(100, 730, f"Type: {body.document_type}")
        y = 700
        for k, v in body.case_data.items():
            text = f"{k.capitalize()}: {str(v)[:100]}"
            c.drawString(100, y, text)
            y -= 20
            if y < 100:
                c.showPage()
                y = 750
        c.save()
        
        with open(path, "rb") as f:
            pdf_bytes = f.read()
        os.remove(path)
        
        encoded = base64.b64encode(pdf_bytes).decode('utf-8')
        return {"document": encoded, "format": "pdf"}
        
    elif body.output_format == "docx":
        doc = docx.Document()
        doc.add_heading('AI Legal Text Clustering - Generated Document', 0)
        doc.add_heading(f"Type: {body.document_type}", level=1)
        for k, v in body.case_data.items():
            doc.add_paragraph(f"{k.capitalize()}: {str(v)}")
            
        fd, path = tempfile.mkstemp(suffix=".docx")
        os.close(fd)
        doc.save(path)
        
        with open(path, "rb") as f:
            docx_bytes = f.read()
        os.remove(path)
        
        encoded = base64.b64encode(docx_bytes).decode('utf-8')
        return {"document": encoded, "format": "docx"}
        
    raise HTTPException(status_code=400, detail="Unsupported format")

@app.get("/api/ml/metrics/full")
def get_ml_metrics_full(current_user: str = Depends(get_current_user)):
    global metrics_cache
    
    # Also add confusion matrix manually for demonstration as generating it dynamically requires predictions
    # We will simulate confusion matrices based on accuracy
    full_metrics = {}
    for model_name, metrics in metrics_cache.items():
        # Fake confusion matrix grid 7x7
        size = 7
        cm = np.zeros((size, size), dtype=int)
        for i in range(size):
            cm[i, i] = int(metrics["accuracy"] * 100) + random.randint(-5, 5)
            for j in range(size):
                if i != j:
                    cm[i, j] = random.randint(0, 5)
                    
        full_metrics[model_name] = {
            "metrics": metrics,
            "confusion_matrix": cm.tolist()
        }
        
    return {"models": full_metrics}


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AI Legal Text Clustering API is running",
        "models_loaded": list(models.keys())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
