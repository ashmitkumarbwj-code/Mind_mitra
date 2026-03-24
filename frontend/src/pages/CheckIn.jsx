import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Activity, ShieldAlert, AlertCircle, Mic, MicOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CheckIn() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load History & Initialize Speech Recognition
  useEffect(() => {
    // 1. Initialize Greeting & History
    const loadHistory = async () => {
      try {
        const uid = currentUser?.uid || `anon-${Date.now()}`;
        const res = await axios.get(`${API_BASE}/api/v1/checkin/history?userId=${uid}&_t=${Date.now()}`);
        const history = res.data.data.reverse(); // oldest first

        const greeting = currentUser?.isAnonymous
          ? 'Hey there! How are you feeling today?'
          : `Welcome back, ${currentUser?.displayName?.split(' ')[0] || 'there'}! How are you feeling today?`;

        let chatFlow = [{ id: 'init', sender: 'bot', text: greeting }];

        if (history.length > 0) {
          history.forEach(c => {
            if (c.raw_message) {
              chatFlow.push({ id: `u-${c.id}`, sender: 'user', text: c.raw_message });
            }
            if (c.ai_response) {
              chatFlow.push({
                id: `b-${c.id}`,
                sender: 'bot',
                text: c.ai_response,
                riskLevel: c.risk_level,
                intent: c.intent
              });
            }
          });
          // Add a fresh prompt at the end of history
          chatFlow.push({ id: 'prompt-now', sender: 'bot', text: "I'm here for you right now. What's on your mind today?" });
        }

        setMessages(chatFlow);
      } catch (err) {
        console.error('Failed to load history', err);
        setMessages([{ id: 'init', sender: 'bot', text: 'How are you feeling today?' }]);
      }
    };
    loadHistory();

    // 2. Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setText(prev => prev.trim() ? prev.trim() + ' ' + finalTranscript.trim() : finalTranscript.trim());
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [currentUser]);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      return alert('Voice typing is not supported in this browser. We highly recommend using Google Chrome for full functionality.');
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Explicitly check/request basic audio permissions first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic permission or start error:', err);
        alert('Microphone access denied or unavailable.\n\nPlease ensure:\n1. You have granted camera/microphone permissions in your browser (check the lock icon in the URL bar).\n2. No other app is currently using your microphone.');
        setIsListening(false);
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (loading) return; // ✅ Prevent API spamming during demo
    if (!text.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setText('');
    setLoading(true);

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      const res = await axios.post(`${API_BASE}/api/v1/checkin/submit`, {
        userId: currentUser?.uid || null,
        email: currentUser?.email || null,
        isAnonymous: currentUser?.isAnonymous || false,
        text: userMsg.text
      });

      const data = res.data.data;
      const botMsg = {
        id: Date.now().toString() + 'bot',
        sender: 'bot',
        text: data.aiResponse,
        riskLevel: data.riskLevel,
        intent: data.intent,
        copingStrategy: data.copingStrategy,
        empathyEcho: data.empathyEcho
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Message failed', error);
      // ✅ 4. Add Backup Response (VERY IMPORTANT FOR DEMO)
      if (error.response?.status === 429) {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: "I'm a bit busy right now, but I understand you're going through something. Tell me more, I'm listening 💙" }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Sorry, I am having trouble connecting to the server. Please try again in a moment.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const logCopingAction = async (intent, strategy) => {
    try {
      await axios.post(`${API_BASE}/api/v1/checkin/action/coping`, {
        userId: currentUser?.uid,
        intent,
        strategy
      });
      alert('Awesome effort! This is logged in your progress.');
    } catch (err) {
      console.error('Failed to log coping action', err);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', padding: '20px 10px' }}>

      {/* Header */}
      <div style={{ padding: '0 10px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity color="#818cf8" size={24} /> MindMitra AI
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Your safe space to talk.</p>
        </div>
      </div>

      {/* Chat History Window */}
      <div className="chat-window">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          const isRed = msg.riskLevel === 'Red';
          const isAmber = msg.riskLevel === 'Amber';
          const isGreen = msg.riskLevel === 'Green';

          return (
            <div key={msg.id} className={`chat-bubble ${isBot ? 'bot' : 'user'}`} style={isRed ? { borderLeft: '4px solid #f87171' } : {}}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

              {/* Dynamic Risk Indicators for Bot Messages */}
              {isBot && msg.riskLevel && (
                <div className="risk-badge">
                  {isGreen && <><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} /> Safe Zone</>}
                  {isAmber && <><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} /> Elevated Stress</>}
                  {isRed && <><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} /> High Risk Detected</>}
                </div>
              )}

              {/* Dynamic Therapeutic UI: Grounding Circle */}
              {isBot && (msg.intent === 'anxiety' || msg.intent === 'panic' || msg.intent === 'stress') && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '24px', margin: '16px 0', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#a5b4fc', fontSize: '1.05rem' }}>Breathe with me</h4>
                  <div className="breathing-circle">
                    <span style={{ color: 'white', fontWeight: 600, opacity: 0.8, fontSize: '0.8rem' }}>Breathe</span>
                  </div>
                  <p style={{ margin: '10px 0 0 0', color: '#cbd5e1', fontSize: '0.8rem', textAlign: 'center' }}>
                    Follow the glowing circle to reset your nervous system.
                  </p>
                </div>
              )}

              {/* Empathy Echo Campus Solidarity */}
              {isBot && msg.empathyEcho && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '12px', borderLeft: '3px solid #8b5cf6', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <strong><Activity size={12} style={{ marginRight: '6px', transform: 'translateY(2px)' }} />Campus Pulse: </strong> {msg.empathyEcho}
                </div>
              )}

              {/* Coping & Emergency Action Cards */}
              {isBot && isAmber && msg.copingStrategy && (
                <div className="coping-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={14} /> Suggested Action
                    </span>
                    <button
                      onClick={() => logCopingAction(msg.intent, msg.copingStrategy)}
                      style={{ background: 'transparent', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CheckCircle2 size={12} /> Mark Done
                    </button>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{msg.copingStrategy}</div>
                </div>
              )}

              {isBot && isRed && (
                <div className="coping-card" style={{ background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.3)' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={16} /> You're Not Alone</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0' }}>This is a safe space, but we strongly encourage you to talk to a human professional. <br /><br />iCall Helpline: <b style={{ color: '#f87171', fontSize: '1.1rem' }}>9152987821</b></p>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="chat-bubble bot" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '12px 16px' }}>
            <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8' }} />
            <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc', animationDelay: '0.2s' }} />
            <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8', animationDelay: '0.4s' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button
          type="button"
          onClick={toggleListening}
          className={`mic-button ${isListening ? 'listening' : ''}`}
          style={{
            background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: isListening ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: isListening ? '#f87171' : '#94a3b8',
            borderRadius: '12px',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            flexShrink: 0
          }}
          title={isListening ? "Stop listening" : "Start Voice Typing"}
        >
          {isListening ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message MindMitra..."
          className="input-field"
          style={{ flex: 1, borderRadius: '12px', padding: '0 16px' }}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="button-primary"
          style={{ padding: '0', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Send size={18} />
        </button>
      </form>

    </div>
  );
}
