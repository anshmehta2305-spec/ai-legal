import requests
import json
with open('../temp_last_user.txt', 'r', encoding='utf-8') as f:
    data = json.load(f)
token = data['token']

text = "A man attacked another person by first hitting him with a brick and then repeatedly stabbing him in the chest. The victim survived due to timely medical treatment. The court held that the repeated attack on vital body parts showed a clear intention to kill and convicted the accused for attempt to murder."

# Without summarize
r1 = requests.post('http://127.0.0.1:8000/api/predict', headers={'Authorization': 'Bearer '+token}, json={'model_name': 'Random Forest Classifier', 'case_description': text})
print("Predict without summarize:", r1.json())

# With summarize
r2 = requests.post('http://127.0.0.1:8000/api/summarize', headers={'Authorization': 'Bearer '+token}, json={'case_description': text})
print("Summarize output:", r2.json())
summary = r2.json().get('summary', '')

r3 = requests.post('http://127.0.0.1:8000/api/predict', headers={'Authorization': 'Bearer '+token}, json={'model_name': 'Random Forest Classifier', 'case_description': summary})
print("Predict with summarize:", r3.json())
