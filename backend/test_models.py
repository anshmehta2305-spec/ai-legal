import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
import scipy.sparse as sp
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import string

weapon_words = ["knife", "knif", "gun", "shoot", "shot", "stab", "rod", "weapon", "axe", "pistol", "revolver", "sickle", "hammer", "sword"]
death_words = ["kill", "killed", "murder", "dead", "death", "poison", "strangle", "homicide", "fatal"]
intent_words = ["intentionally", "deliberately", "planned", "intent", "premeditated"]
financial_words = ["money", "fraud", "scam", "cheat", "rs", "amount", "rupee", "bank", "invest", "property", "bogus"]
cruelty_words = ["dowry", "husband", "wife", "in-laws", "harass", "cruelty", "torture", "suicide", "marriage"]
assault_words = ["assault", "rape", "sexual", "consent", "force", "gang"]
theft_words = ["steal", "stole", "theft", "thief", "thieves", "rob", "burglar", "break-in", "gang"]

def extract_structural_features(text: str):
    t = text.lower()
    features = [
        1.0 if any(w in t for w in weapon_words) else 0.0,
        1.0 if any(w in t for w in death_words) else 0.0,
        1.0 if any(w in t for w in intent_words) else 0.0,
        1.0 if any(w in t for w in financial_words) else 0.0,
        1.0 if any(w in t for w in cruelty_words) else 0.0,
        1.0 if any(w in t for w in assault_words) else 0.0,
        1.0 if any(w in t for w in theft_words) else 0.0,
    ]
    return features

def preprocess_text(text: str):
    t = text.lower().translate(str.maketrans('', '', string.punctuation))
    return t

df = pd.read_csv('legal_data.csv')
df['combined_text'] = df['description'] + " " + df['case_study']
df['processed_description'] = df['combined_text'].apply(preprocess_text)

vectorizer = TfidfVectorizer(max_features=5000)
X_text = vectorizer.fit_transform(df['processed_description'])
X_struct = np.array([extract_structural_features(t) for t in df['combined_text']])
X = sp.hstack((X_text, sp.csr_matrix(X_struct)))
y = df['section'].astype(str)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)
preds = clf.predict(X_test)
print(classification_report(y_test, preds))

test_text = "A man attacked another person by first hitting him with a brick and then repeatedly stabbing him in the chest. The victim survived due to timely medical treatment. The court held that the repeated attack on vital body parts showed a clear intention to kill and convicted the accused for attempt to murder."
p_text = preprocess_text(test_text)
f_text = vectorizer.transform([p_text])
f_struct = np.array([extract_structural_features(test_text.lower())])
f_all = sp.hstack((f_text, sp.csr_matrix(f_struct)))

print("Test prediction:", clf.predict(f_all))
print("Probabilities:", dict(zip(clf.classes_, clf.predict_proba(f_all)[0])))
