import { useState, useRef, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import './MessageInput.css'

/**
 * MessageInput – text input bar with:
 *  • Text compose
 *  • File upload (images)
 *  • Camera capture (mobile-native via accept="image/*;capture=camera")
 *  • Image preview with retake / use-photo actions
 */
export default function MessageInput({ onSendText, onSendImage, disabled }) {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)   // { url, file }
  const [cameraMode, setCameraMode] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const textareaRef = useRef(null)

  const { lang } = useLanguage()

  /* ── Voice Assistant Setup ── */
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('micSupported'));
      return;
    }

    const recognition = new SpeechRecognition();

    // Map internal language codes to speech recognition language codes
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    recognition.lang = langMap[lang] || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev ? prev + ' ' + transcript : transcript);
      // Trigger auto-grow
      setTimeout(() => {
        const el = textareaRef.current
        if (el) {
          el.style.height = 'auto'
          el.style.height = Math.min(el.scrollHeight, 120) + 'px'
        }
      }, 0);
    };

    recognition.onerror = (event) => {
      console.error(t('voiceError'), event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  /* ── Textarea auto-grow ── */
  const handleTextChange = (e) => {
    setText(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  /* ── Send text ── */
  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendText(text.trim())
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }

  /* ── Enter key (shift+enter = newline) ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /* ── File / camera chosen ── */
  const handleFileChosen = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview({ url, file })
    e.target.value = ''   // reset so same file can be re-selected
  }, [])

  /* ── Retake (clear preview) ── */
  const handleRetake = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  /* ── Use photo (send image) ── */
  const handleUsePhoto = () => {
    if (!preview || disabled) return
    onSendImage(preview.file, text.trim() || undefined)
    URL.revokeObjectURL(preview.url)
    setPreview(null)
    setText('')
  }

  return (
    <div className="msg-input-area">
      {/* ── Image preview strip ── */}
      {preview && (
        <div className="msg-input__preview">
          <img src={preview.url} alt="Preview" className="msg-input__preview-img" />
          <div className="msg-input__preview-actions">
            <button className="preview-btn preview-btn--retake" onClick={handleRetake}>
              {t('retake')}
            </button>
            <button
              className="preview-btn preview-btn--use"
              onClick={handleUsePhoto}
              disabled={disabled}
            >
              {t('usePhoto')}
            </button>
          </div>
        </div>
      )}

      {/* ── Input row ── */}
      <div className="msg-input__row">
        {/* Camera capture (hidden) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChosen}
        />

        {/* Gallery upload (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChosen}
        />

        {/* Camera / upload button */}
        <div className="msg-input__attach-group">
          <button
            className="msg-input__icon-btn"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
            title={t('capturePhoto')}
            aria-label={t('capturePhoto')}
          >
            📷
          </button>
          <button
            className="msg-input__icon-btn msg-input__icon-btn--gallery"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title={t('uploadPhoto')}
            aria-label={t('uploadPhoto')}
          >
            🖼
          </button>
          <button
            className={`msg-input__icon-btn mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            disabled={disabled}
            title={t('voiceAssistant')}
            aria-label={t('voiceAssistant')}
          >
            <MicIcon />
          </button>
        </div>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          className="msg-input__textarea"
          placeholder={t('inputPlaceholder')}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />

        {/* Send button */}
        <button
          className={`msg-input__send ${text.trim() || preview ? 'msg-input__send--active' : ''}`}
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label={t('send')}
          title={t('send')}
        >
          ➤
        </button>
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  )
}
