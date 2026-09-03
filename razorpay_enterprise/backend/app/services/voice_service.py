import os
import uuid
from pathlib import Path
from gtts import gTTS
from app.services.config_service import get_config

AUDIO_DIR = Path("/tmp/voice_audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

def text_to_hinglish_voice(hinglish_text: str) -> str:
    """
    Step 1: Convert Hinglish text to spoken voice audio using gTTS (Hindi engine).
    Hindi TTS engines naturally pronounce phonetic Hinglish vocabulary accurately.
    """
    clean_filename = f"voice_{uuid.uuid4().hex[:12]}.mp3"
    audio_path = AUDIO_DIR / clean_filename
    
    # Generate MP3 using Google Text-to-Speech
    tts = gTTS(text=hinglish_text, lang="hi", slow=False)
    tts.save(str(audio_path))
    
    return clean_filename

def send_voice_recovery(customer_phone: str, hinglish_text: str, txn_id: str = None) -> dict:
    """
    Step 2 & 3: Deliver Hinglish voice message via Voice API (Twilio / Exotel / Local Stream).
    """
    # 0. Global Kill Switch
    if get_config("is_paused", "false").lower() == "true":
        return {
            "status": "PAUSED",
            "message": "🛑 Global Kill Switch Engaged. Outbound voice calling is halted."
        }

    # Generate the actual audio file
    filename = text_to_hinglish_voice(hinglish_text)
    audio_stream_url = f"/api/voice/play/{filename}"

    # Twilio / Exotel dispatch logic
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE", "+18005550199")

    call_sid = f"CA_{uuid.uuid4().hex[:16]}"
    delivery_channel = "TWILIO_VOICE" if (twilio_sid and twilio_token) else "VOICE_SIMULATOR_SANDBOX"

    if twilio_sid and twilio_token:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            call = client.calls.create(
                url=f"http://localhost:8000{audio_stream_url}",
                to=customer_phone,
                from_=twilio_from
            )
            call_sid = call.sid
            delivery_channel = "TWILIO_VOICE_LIVE"
        except Exception as e:
            print(f"Twilio Voice dispatch notice: {e}. Falling back to sandbox stream.")
            delivery_channel = "VOICE_SANDBOX_STREAM"

    print(f"📞 [Hinglish Outbound Voice Call to {customer_phone}]: Call SID={call_sid} | Audio={audio_stream_url}")

    return {
        "status": "QUEUED_AND_DIALING",
        "call_sid": call_sid,
        "customer_phone": customer_phone,
        "txn_id": txn_id,
        "hinglish_script": hinglish_text,
        "audio_filename": filename,
        "audio_url": audio_stream_url,
        "delivery_channel": delivery_channel
    }
