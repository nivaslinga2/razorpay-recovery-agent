import React, { useState } from 'react';
import { previewVoice, dispatchVoiceCall } from '../services/api';

const TEMPLATES = [
  {
    title: 'Card Declined',
    text: 'Namaste! Main Razorpay PayResQ se call kar raha hoon. Aapka payment bank card decline hone ke kaaran incomplete reh gaya tha. Kripya naye link par click karke dusre card ya UPI se payment complete karein.'
  },
  {
    title: 'Bank Low Balance',
    text: 'Namaste! Aapke transaction me bank insufficient funds ka issue aaya tha. Humne aapke registered WhatsApp par ek discount payment link bhej diya hai, kripya check karein.'
  },
  {
    title: 'Subscription Retries Halted',
    text: 'Namaste! Aapka recurring subscription teen retries ke baad pause ho gaya hai. Service uninterrupted rakhne ke liye kripya mandate re-authorization link par click karein.'
  }
];

export const VoiceRecoveryCard = () => {
  const [phone, setPhone] = useState('+91 98765 43210');
  const [script, setScript] = useState(TEMPLATES[0].text);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callLog, setCallLog] = useState(null);
  const [notification, setNotification] = useState(null);

  const handleSynthesize = async () => {
    setLoadingAudio(true);
    setNotification(null);
    try {
      const res = await previewVoice(script);
      // In dev, API is proxied through Vite or port 8000
      setAudioUrl(`http://localhost:8000${res.audio_url}`);
      setNotification({ type: 'success', message: 'Audio synthesized successfully via Google TTS!' });
    } catch (e) {
      setNotification({ type: 'danger', message: `TTS Error: ${e.message}` });
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleCall = async () => {
    setCalling(true);
    setNotification(null);
    try {
      const res = await dispatchVoiceCall(phone, script);
      setCallLog(res);
      setAudioUrl(`http://localhost:8000${res.audio_url}`);
      setNotification({
        type: 'success',
        message: `Outbound call queued! Call SID: ${res.call_sid} (${res.delivery_channel})`
      });
    } catch (e) {
      setNotification({ type: 'danger', message: `Call dispatch error: ${e.message}` });
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4" style={{ backgroundColor: 'var(--obsidian-surface)', borderColor: 'var(--gold-border)' }}>
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid var(--gold-border)' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-telephone-outbound-fill text-warning fs-5"></i>
          <div>
            <h3 className="card-title fs-5 fw-bold mb-0 text-white">Feature 4: Hinglish Voice Recovery</h3>
            <span className="text-secondary small">Text-to-Speech Engine + Twilio / Exotel Outbound Voice Calling</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary px-3 py-2 fw-bold">
            <i className="bi bi-soundwave me-1"></i>gTTS Hindi Engine
          </span>
          <span className="badge bg-success px-3 py-2 fw-bold">
            <i className="bi bi-broadcast me-1"></i>Twilio Voice Ready
          </span>
        </div>
      </div>

      <div className="card-body p-4">
        {notification && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show mb-4 small`} role="alert">
            {notification.message}
            <button type="button" className="btn-close btn-close-white" onClick={() => setNotification(null)}></button>
          </div>
        )}

        {/* Quick Template Picker */}
        <div className="mb-3">
          <label className="form-label text-secondary small fw-bold text-uppercase">
            <i className="bi bi-stars text-warning me-1"></i>Select Voice Recovery Template:
          </label>
          <div className="d-flex gap-2 flex-wrap">
            {TEMPLATES.map((t, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-sm btn-outline-secondary text-light px-3 py-1"
                onClick={() => setScript(t.text)}
                style={{ borderColor: 'var(--gold-border)' }}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Script Editor + Phone Input */}
        <div className="row g-3 mb-4">
          <div className="col-md-8">
            <label className="form-label text-secondary small fw-bold text-uppercase">Hinglish Call Script:</label>
            <textarea
              className="form-control font-monospace"
              rows="4"
              value={script}
              onChange={e => setScript(e.target.value)}
              style={{
                backgroundColor: 'var(--obsidian-vault)',
                borderColor: 'var(--gold-border)',
                color: '#f8fafc',
                fontSize: '13px'
              }}
            />
          </div>
          <div className="col-md-4 d-flex flex-column justify-content-between">
            <div>
              <label className="form-label text-secondary small fw-bold text-uppercase">Customer Phone Number:</label>
              <div className="input-group mb-3">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <i className="bi bi-phone"></i>
                </span>
                <input
                  type="text"
                  className="form-control font-monospace"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{
                    backgroundColor: 'var(--obsidian-vault)',
                    borderColor: 'var(--gold-border)',
                    color: '#f8fafc'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-column gap-2">
              <button
                className="btn btn-outline-warning fw-bold py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={handleSynthesize}
                disabled={loadingAudio}
              >
                {loadingAudio ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Synthesizing Voice...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-headphones"></i>
                    <span>🎧 Synthesize & Preview Audio</span>
                  </>
                )}
              </button>

              <button
                className="btn btn-primary fw-bold py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={handleCall}
                disabled={calling}
              >
                {calling ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Placing Outbound Call...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-telephone-outbound-fill"></i>
                    <span>📞 Call Customer Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Audio Player & Call Telemetry */}
        {audioUrl && (
          <div className="p-3 rounded border mb-3 d-flex flex-column gap-2"
               style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'var(--gold-border)' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-volume-up-fill text-warning fs-5"></i>
                <span className="fw-bold text-white small">Synthesized Audio Stream:</span>
              </div>
              <span className="badge bg-success font-monospace">Audio Format: MP3 (24kHz)</span>
            </div>
            <audio controls src={audioUrl} autoPlay className="w-100 mt-2" style={{ height: '40px' }} />
          </div>
        )}

        {/* Call Telemetry Card */}
        {callLog && (
          <div className="p-3 rounded border font-monospace small"
               style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: '#10B981' }}>
            <div className="d-flex justify-content-between text-success fw-bold mb-1">
              <span><i className="bi bi-check-circle-fill me-1"></i>Outbound Voice Call Dispatched</span>
              <span className="badge bg-success">{callLog.status}</span>
            </div>
            <div className="text-light">Call SID: <span className="text-warning">{callLog.call_sid}</span></div>
            <div className="text-light">Recipient: <span className="text-white">{callLog.customer_phone}</span></div>
            <div className="text-light">Delivery Channel: <span className="badge bg-dark border border-secondary">{callLog.delivery_channel}</span></div>
          </div>
        )}
      </div>
    </div>
  );
};
