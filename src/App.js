import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import './App.css';

const TOKEN_URL =
  process.env.REACT_APP_TOKEN_URL || 'http://localhost:3001/token';

const STATE_LABELS = {
  initializing: 'THE ORACLE AWAKENS',
  listening:    'SPEAK YOUR ANSWER',
  thinking:     'THE GODDESS PONDERS',
  speaking:     'ATHENA SPEAKS',
};

// ── Athena SVG Avatar ────────────────────────────────────────────────────────
function AthenaAvatar({ state }) {
  return (
    <div className={`avatar-wrapper ${state || ''}`}>
      <div className="ring ring-1" />
      <div className="ring ring-2" />
      <div className="ring ring-3" />
      <svg className="avatar-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1a1440" />
            <stop offset="100%" stopColor="#06050f" />
          </radialGradient>
          <radialGradient id="skinGrad" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#e8d5b0" />
            <stop offset="100%" stopColor="#c8a878" />
          </radialGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#bgGrad)" />
        <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="91" fill="none" stroke="#c9a84c" strokeWidth="0.5" strokeDasharray="3 4" />
        <path d="M 58 95 Q 55 65 68 48 Q 80 32 100 28 Q 120 32 132 48 Q 145 65 142 95 Q 135 85 128 80 Q 118 68 100 65 Q 82 68 72 80 Q 65 85 58 95 Z" fill="#3a2810" />
        <path d="M 58 95 Q 52 110 55 130 Q 62 125 68 115 Q 65 105 65 95 Z" fill="#3a2810" />
        <path d="M 142 95 Q 148 110 145 130 Q 138 125 132 115 Q 135 105 135 95 Z" fill="#3a2810" />
        <path d="M 63 82 Q 65 76 100 70 Q 135 76 137 82 Q 120 78 100 76 Q 80 78 63 82 Z" fill="#c9a84c" />
        <ellipse cx="100" cy="73" rx="4" ry="5" fill="#e8d070" filter="url(#softGlow)" />
        <ellipse cx="83" cy="76" rx="3" ry="3.5" fill="#c9a84c" />
        <ellipse cx="117" cy="76" rx="3" ry="3.5" fill="#c9a84c" />
        <ellipse cx="68" cy="80" rx="2.5" ry="3" fill="#b89840" />
        <ellipse cx="132" cy="80" rx="2.5" ry="3" fill="#b89840" />
        <g opacity="0.85">
          <ellipse cx="74" cy="77" rx="6" ry="3" fill="#4a7a38" transform="rotate(-20 74 77)" />
          <ellipse cx="86" cy="73" rx="6" ry="2.5" fill="#5a8a48" transform="rotate(-10 86 73)" />
          <ellipse cx="114" cy="73" rx="6" ry="2.5" fill="#5a8a48" transform="rotate(10 114 73)" />
          <ellipse cx="126" cy="77" rx="6" ry="3" fill="#4a7a38" transform="rotate(20 126 77)" />
        </g>
        <ellipse cx="100" cy="110" rx="40" ry="46" fill="url(#skinGrad)" />
        <ellipse cx="100" cy="88" rx="22" ry="10" fill="#f0e0c0" opacity="0.35" />
        <path d="M 76 100 Q 84 93 93 100 Q 84 107 76 100 Z" fill="white" />
        <ellipse cx="84" cy="100" rx="5.5" ry="5" fill="#2a4a80" />
        <ellipse cx="84" cy="100" rx="3.5" ry="3.5" fill="#0c1a30" />
        <circle cx="85.5" cy="98" r="1.2" fill="white" opacity="0.9" />
        <path d="M 73 92 Q 84 87 95 90" stroke="#3a2010" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 107 100 Q 116 93 124 100 Q 116 107 107 100 Z" fill="white" />
        <ellipse cx="116" cy="100" rx="5.5" ry="5" fill="#2a4a80" />
        <ellipse cx="116" cy="100" rx="3.5" ry="3.5" fill="#0c1a30" />
        <circle cx="117.5" cy="98" r="1.2" fill="white" opacity="0.9" />
        <path d="M 105 90 Q 116 87 127 92" stroke="#3a2010" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 100 106 L 95 118 Q 100 121 105 118 Z" fill="none" stroke="#c09878" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 88 126 Q 100 133 112 126" stroke="#c08878" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M 91 126 Q 100 129 109 126" fill="#d09888" />
        <rect x="90" y="150" width="20" height="12" rx="4" fill="#d8c098" />
        <path d="M 52 185 Q 60 162 90 155 L 90 162 Q 68 168 58 188 Z" fill="#6a5030" />
        <path d="M 148 185 Q 140 162 110 155 L 110 162 Q 132 168 142 188 Z" fill="#6a5030" />
        <path d="M 58 188 L 142 188 Q 138 168 110 162 L 90 162 Q 62 168 58 188 Z" fill="#5a4025" />
        <path d="M 58 188 L 142 188" stroke="#c9a84c" strokeWidth="1.5" opacity="0.6" />
        <path d="M 90 162 L 84 188 M 100 162 L 100 188 M 110 162 L 116 188" stroke="#c9a84c" strokeWidth="0.6" opacity="0.4" />
        <g transform="translate(138, 148) scale(0.55)" opacity="0.75">
          <ellipse cx="20" cy="22" rx="14" ry="18" fill="#4a3a20" />
          <circle cx="20" cy="10" r="12" fill="#4a3a20" />
          <ellipse cx="20" cy="12" rx="9" ry="8" fill="#6a5030" />
          <circle cx="15" cy="10" r="4.5" fill="#c9a84c" />
          <circle cx="25" cy="10" r="4.5" fill="#c9a84c" />
          <circle cx="15" cy="10" r="2.5" fill="#1a0a00" />
          <circle cx="25" cy="10" r="2.5" fill="#1a0a00" />
          <circle cx="15.8" cy="9" r="0.8" fill="white" />
          <circle cx="25.8" cy="9" r="0.8" fill="white" />
          <path d="M 17 16 L 20 20 L 23 16 Z" fill="#c9a84c" />
        </g>
      </svg>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase]           = useState('idle');
  const [agentState, setAgentState] = useState(null);
  const [errorMsg, setErrorMsg]     = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [transcript, setTranscript] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [quizStarted, setQuizStarted] = useState(false);
  const [micActive, setMicActive]   = useState(false);
  const [micAvailable, setMicAvailable] = useState(true);
  const [score, setScore]           = useState({ current: 0, total: 0 });
  const [gameOver, setGameOver]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [skipped, setSkipped]       = useState(false);
  const roomRef        = useRef(null);
  const inputRef       = useRef(null);
  const audioElsRef    = useRef([]);
  const skippedRef     = useRef(false);
  const prevAgentState = useRef(null);
  const fullTextRef    = useRef(''); // full LLM text received before TTS finishes

  // ── Auto-silence mic the moment agent starts thinking or speaking ───────────
  useEffect(() => {
    // Only auto-silence if the user hasn't explicitly pressed Skip (skip enables the mic button)
    if ((agentState === 'thinking' || agentState === 'speaking') && micActive && !skippedRef.current) {
      const micPub = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (micPub?.track?.mediaStreamTrack) {
        micPub.track.mediaStreamTrack.enabled = false;
      }
      setMicActive(false);
    }
    // Clear buffered full text when Athena starts a new thinking turn (LLM begins).
    // Must NOT clear on 'speaking' start — by then DataReceived has already set fullTextRef.
    if (agentState === 'thinking' && prevAgentState.current !== 'thinking') {
      fullTextRef.current = '';
    }
    // When Athena stops speaking (TTS done or interrupted), clear skip state and unmute audio
    if (prevAgentState.current === 'speaking' && agentState !== 'speaking' && skippedRef.current) {
      skippedRef.current = false;
      setSkipped(false);
      audioElsRef.current.forEach((el) => { el.muted = false; });
    }
    prevAgentState.current = agentState;
  }, [agentState, micActive]);

  // Score and game-over are now sent via DataReceived (athena_score topic) — instant, no lag.

  // ── Connection ──────────────────────────────────────────────────────────────
  async function startQuiz() {
    setPhase('connecting');
    setErrorMsg('');
    setTranscript('');
    setQuizStarted(false);
    setMicActive(false);

    try {
      const res = await fetch(
        `${TOKEN_URL}?identity=mortal-${Date.now()}&difficulty=${difficulty}`
      );
      if (!res.ok) throw new Error('Token server not responding — is it running on port 3001?');
      const { token, url } = await res.json();

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.ParticipantAttributesChanged, (attrs) => {
        if (attrs['lk.agent.state']) setAgentState(attrs['lk.agent.state']);
      });
      room.on(RoomEvent.ParticipantConnected, (p) => {
        const s = p.attributes?.['lk.agent.state'];
        if (s) setAgentState(s);
      });
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.autoplay = true;
          el.muted = false;
          document.body.appendChild(el);
          el.play().catch(() => {});
          audioElsRef.current.push(el);
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => {
          audioElsRef.current = audioElsRef.current.filter((e) => e !== el);
          el.remove();
        });
      });
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        if (!participant || participant.isLocal) return;
        if (skippedRef.current) return; // full text already shown — don't overwrite
        const text = segments.map((s) => s.text).join(' ').trim();
        if (text) setTranscript(text);
      });
      room.on(RoomEvent.DataReceived, (data, _participant, _kind, topic) => {
        if (topic === 'athena_score') {
          // Score arrives instantly when the tool runs — no TTS lag
          const { current, total, isGameOver } = JSON.parse(new TextDecoder().decode(data));
          setScore({ current, total });
          if (isGameOver) setGameOver(true);
          return;
        }
        if (topic === 'athena_full') {
          // Full LLM text published early (before TTS finishes) for Skip display
          const text = new TextDecoder().decode(data).trim();
          fullTextRef.current = text;
          if (skippedRef.current) setTranscript(text);
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        audioElsRef.current = [];
        skippedRef.current = false;
        fullTextRef.current = '';
        setPhase('idle');
        setAgentState(null);
        setTranscript('');
        setQuizStarted(false);
        setMicActive(false);
        setMicAvailable(true);
        setScore({ current: 0, total: 0 });
        setGameOver(false);
        setSkipped(false);
      });

      await room.connect(url, token);
      await room.startAudio();
      // Try to publish the mic track, but don't fail the whole session if
      // the user has denied microphone permission — text input still works.
      try {
        await room.localParticipant.setMicrophoneEnabled(true, {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        });
        // Silence immediately — only unmute on push-to-talk
        const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
        if (micPub?.track?.mediaStreamTrack) {
          micPub.track.mediaStreamTrack.enabled = false;
        }
        setMicAvailable(true);
      } catch (micErr) {
        console.warn('Microphone unavailable:', micErr.message);
        setMicAvailable(false);
      }
      setMicActive(false);
      setPhase('active');
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  }

  // ── Skip: silence audio + show full text + enable mic so user can answer now ─
  function skipSpeech() {
    skippedRef.current = true;
    setSkipped(true); // enables the "Press to Speak" button immediately
    // Silence audio instantly (before server-side interruption propagates)
    audioElsRef.current.forEach((el) => { el.muted = true; });
    if (fullTextRef.current) {
      setTranscript(fullTextRef.current);
    }
  }

  // ── Begin: unlock audio (user gesture), ensure mic is silent, signal agent ──
  async function beginQuiz() {
    await roomRef.current?.startAudio();
    setQuizStarted(true);
    // Ensure mic is silent (media mute, not unpublish)
    const micPub = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Microphone);
    if (micPub?.track?.mediaStreamTrack) {
      micPub.track.mediaStreamTrack.enabled = false;
    }
    setMicActive(false);
    try {
      await roomRef.current?.localParticipant.sendText(
        'I am ready. Begin the trial!',
        { topic: 'lk.chat' }
      );
    } catch (err) {
      console.error('Failed to send begin:', err);
    }
  }

  // ── Push-to-talk toggle ────────────────────────────────────────────────────
  function toggleMic() {
    if (!roomRef.current) return;
    const next = !micActive;
    // Toggle audio data flow without republishing — keeps the audio pipeline
    // intact and avoids triggering another browser permission prompt.
    const micPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Microphone);
    if (micPub?.track?.mediaStreamTrack) {
      micPub.track.mediaStreamTrack.enabled = next;
    }
    setMicActive(next);
    if (next) inputRef.current?.blur();
  }

  // ── Text answer ────────────────────────────────────────────────────────────
  async function sendTextAnswer() {
    const text = typedAnswer.trim();
    if (!text || !roomRef.current) return;
    try {
      await roomRef.current.localParticipant.sendText(text, { topic: 'lk.chat' });
      setTypedAnswer('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send text:', err);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') sendTextAnswer();
  }

  async function endQuiz() {
    await roomRef.current?.disconnect();
    roomRef.current = null;
    audioElsRef.current = [];
    skippedRef.current = false;
    fullTextRef.current = '';
    setPhase('idle');
    setAgentState(null);
    setTranscript('');
    setQuizStarted(false);
    setMicActive(false);
    setMicAvailable(true);
    setScore({ current: 0, total: 0 });
    setGameOver(false);
    setCopied(false);
    setSkipped(false);
  }

  // ── Share helpers ────────────────────────────────────────────────────────────
  function shareText() {
    return `I scored ${score.current}/10 on the Are You Even Greek? quiz! 🏛️ Think you can beat me?\nareyouevengreek.com`;
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, '_blank');
  }

  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}`, '_blank');
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText(), url: 'https://areyouevengreek.com' });
      } catch (_) {}
    }
  }

  async function copyScore() {
    await navigator.clipboard.writeText(shareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  useEffect(() => {
    return () => { roomRef.current?.disconnect(); };
  }, []);

  const isSpeaking = agentState === 'speaking';
  const isThinking = agentState === 'thinking';
  const agentBusy  = isSpeaking || isThinking;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <div className="game-container">

        <h1 className="title">Are You Even Greek?</h1>
        <p className="subtitle">A Voice Trial of Ancient Wisdom</p>

        <div className="divider">
          <span className="divider-line" />
          <span className="divider-symbol">⚡</span>
          <span className="divider-line" />
        </div>

        <AthenaAvatar state={agentState} />

        {/* Agent state badge */}
        {phase === 'active' && (
          <p className={`status-badge ${agentState || ''}`}>
            {STATE_LABELS[agentState] || 'AWAITING THE GODDESS'}
          </p>
        )}

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <div className="panel">
            <p className="description">
              Face the goddess Athena in a trial of wisdom.<br />
              Answer 10 questions on Greek mythology and history.<br />
              Speak aloud or type your answers to the oracle.
            </p>
            <div className="difficulty-row">
              {['easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  className={`btn-difficulty ${d} ${difficulty === d ? 'selected' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={startQuiz}>
              ⚡ Enter the Oracle ⚡
            </button>
          </div>
        )}

        {/* ── CONNECTING ── */}
        {phase === 'connecting' && (
          <div className="panel">
            <p className="connecting-text">
              <span className="spinner" />
              Summoning Athena from Olympus...
            </p>
          </div>
        )}

        {/* ── ACTIVE ── */}
        {phase === 'active' && (
          <div className="panel">

            {/* Scoreboard — visible once first question has been answered */}
            {quizStarted && score.total > 0 && (
              <div className="scoreboard">
                <span className="score-label">SCORE</span>
                <span className="score-value">{score.current} / {score.total}</span>
              </div>
            )}

            {/* Transcript */}
            <div className="transcript-box">
              <p className="transcript-text">
                {transcript || (isSpeaking ? '...' : 'Awaiting the goddess...')}
              </p>
            </div>

            {/* Skip button — mutes audio only, never advances quiz state */}
            {isSpeaking && (
              <button className="btn-skip" onClick={skipSpeech}>
                Skip ›
              </button>
            )}

            {/* ── INTRO phase: waiting for user to press Begin ── */}
            {!quizStarted && (
              <div className="intro-actions">
                <p className="mic-hint">
                  {isSpeaking
                    ? '🔊 Athena is speaking...'
                    : agentState === 'thinking'
                      ? '⚡ The goddess ponders...'
                      : 'Listen to Athena, then press Begin when ready'}
                </p>
                <button className="btn-primary" onClick={beginQuiz}>
                  ⚡ Begin the Trial ⚡
                </button>
                <button className="btn-secondary leave-intro" onClick={endQuiz}>
                  Leave the Temple
                </button>
              </div>
            )}

            {/* ── QUIZ phase: push-to-talk + text input ── */}
            {quizStarted && !gameOver && (
              <div className="quiz-actions">
                <button
                  className={`btn-speak ${micActive ? 'recording' : ''}`}
                  onClick={toggleMic}
                  disabled={(agentBusy && !skipped) || !micAvailable}
                >
                  {!micAvailable
                    ? '🎙 Mic blocked — use text below'
                    : micActive
                      ? '🔴 Recording — click to stop'
                      : skipped
                        ? '🎙 Press to Speak'
                        : isSpeaking
                          ? '🔊 Athena is speaking...'
                          : isThinking
                            ? '⚡ Athena ponders...'
                            : '🎙 Press to Speak'}
                </button>

                <div className="input-row">
                  <input
                    ref={inputRef}
                    className="text-input"
                    type="text"
                    placeholder="Or type your answer here..."
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    className="btn-send"
                    onClick={sendTextAnswer}
                    disabled={!typedAnswer.trim()}
                  >
                    Submit
                  </button>
                </div>

                <button className="btn-secondary" onClick={endQuiz}>
                  Leave the Temple
                </button>
              </div>
            )}

            {/* ── GAME OVER: share panel ── */}
            {gameOver && (
              <div className="share-panel">
                <p className="share-title">⚡ Trial Complete ⚡</p>
                <p className="share-score-display">{score.current} / {score.total}</p>
                <p className="share-subtitle">Share your result</p>
                <div className="share-row">
                  <button className="btn-share whatsapp" onClick={shareWhatsApp}>
                    WhatsApp
                  </button>
                  <button className="btn-share twitter" onClick={shareTwitter}>
                    X / Twitter
                  </button>
                  {typeof navigator.share === 'function' && (
                    <button className="btn-share native" onClick={shareNative}>
                      More
                    </button>
                  )}
                  <button className="btn-share copy" onClick={copyScore}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={endQuiz}>
                  Play Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="panel">
            <p className="error-text">{errorMsg}</p>
            <button className="btn-primary" onClick={startQuiz}>
              Try Again
            </button>
          </div>
        )}

        <p className="stars">✦ ✦ ✦</p>
      </div>
    </div>
  );
}
