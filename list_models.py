import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    models = client.models.list()
    print("✅ Raw list of models available to your API key:\n")
    for model in models.data:
        print(f"  - {model.id}")
except Exception as e:
    print(f"❌ Error: {e}")