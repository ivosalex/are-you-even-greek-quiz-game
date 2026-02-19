import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import './App.css';

const TOKEN_SERVER = 'http://localhost:3001';
const ROOM_NAME = 'greek-quiz-room';

const AGENT_STATE_LABELS = {
  initializing: 'Getting ready...',
  listening: 'Listening — speak your answer now',
  thinking: 'Thinking...',
  speaking: 'Quiz master is speaking',
};

export default function App() {
  // phase: 'idle' | 'connecting' | 'active' | 'error'
  const [phase, setPhase] = useState('idle');
  const [agentState, setAgentState] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const roomRef = useRef(null);

  async function startQuiz() {
    setPhase('connecting');
    setErrorMsg('');

    try {
      const res = await fetch(
        `${TOKEN_SERVER}/token?room=${ROOM_NAME}&identity=user-${Date.now()}`
      );
      if (!res.ok) throw new Error('Token server returned an error — is it running on port 3001?');
      const { token, url } = await res.json();

      const room = new Room();
      roomRef.current = room;

      // Track agent state changes via participant attributes
      room.on(RoomEvent.ParticipantAttributesChanged, (changedAttrs) => {
        if (changedAttrs['lk.agent.state']) {
          setAgentState(changedAttrs['lk.agent.state']);
        }
      });

      // Check initial agent state when a remote participant connects
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        const state = participant.attributes?.['lk.agent.state'];
        if (state) setAgentState(state);
      });

      // Auto-play agent audio
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          document.body.appendChild(el);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        const elements = track.detach();
        elements.forEach((el) => el.remove());
      });

      room.on(RoomEvent.Disconnected, () => {
        setPhase('idle');
        setAgentState(null);
      });

      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setPhase('active');
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  }

  async function endQuiz() {
    await roomRef.current?.disconnect();
    roomRef.current = null;
    setPhase('idle');
    setAgentState(null);
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <div className="card">
        <h1 className="title">Greek History Quiz</h1>
        <p className="subtitle">A voice quiz powered by LiveKit</p>

        {phase === 'idle' && (
          <>
            <p className="description">
              Answer 5 questions about ancient Greece by speaking aloud. The
              quiz master will ask questions and listen for your answers.
            </p>
            <button className="btn-primary" onClick={startQuiz}>
              Start Quiz
            </button>
          </>
        )}

        {phase === 'connecting' && (
          <div className="status-row">
            <span className="spinner" />
            <span className="status-text">Connecting...</span>
          </div>
        )}

        {phase === 'active' && (
          <>
            <div className={`agent-badge ${agentState || 'waiting'}`}>
              {agentState
                ? AGENT_STATE_LABELS[agentState] ?? agentState
                : 'Waiting for quiz master...'}
            </div>

            <div className="mic-hint">
              {agentState === 'listening'
                ? 'Microphone is active'
                : 'Wait for the quiz master to finish speaking'}
            </div>

            <button className="btn-secondary" onClick={endQuiz}>
              End Quiz
            </button>
          </>
        )}

        {phase === 'error' && (
          <>
            <p className="error-text">{errorMsg}</p>
            <button className="btn-primary" onClick={startQuiz}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
