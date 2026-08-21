import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    # Try the absolute safest, oldest model on Groq
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": "Say 'Hello CTO'"}],
        model="mixtral-8x7b-32768",
    )
    print("✅ SUCCESS! API Key is working perfectly!")
    print(chat_completion.choices[0].message.content)
except Exception as e:
    print(f"❌ API Error: {e}")