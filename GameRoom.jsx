/**
 * GameRoom.jsx
 * ─────────────────────────────────────────────────────────
 * The root game component. Owns the socket connection via
 * useSocket() and passes slices of state down to children.
 *
 * COMPONENT TREE:
 *   GameRoom
 *   ├── Lobby (username entry)
 *   ├── Leaderboard (always visible during game)
 *   ├── QuestionCard (center stage)
 *   └── SabotageHUD (only when tokens ≥ 1)
 *
 * REAL-TIME COMMUNICATION MAP:
 *   User action         →  socket.emit(event)     →  Server
 *   Server broadcasts   →  socket.on(event)        →  setState → re-render
 *
 *   joinGame         ──→  server registers player, returns joinSuccess
 *   submitAnswer     ──→  server scores it, broadcasts leaderboardUpdate
 *   activateSabotage ──→  server unicasts sabotageTarget to ONE client
 */

import React, { useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Leaderboard }  from './Leaderboard';
import { QuestionCard } from './QuestionCard';
import { SabotageHUD }  from './SabotageHUD';

const SERVER_URL = 'https://stream-sabotage.onrender.com';

export function GameRoom() {
  const { gameState, emit, socketId } = useSocket(SERVER_URL);
  const [username, setUsername]       = useState('');
  const [inputVal, setInputVal]       = useState('');

  // ── Join handler ─────────────────────────────────────────────────────────
  function handleJoin(e) {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    // Tell server we want to join; useSocket handles the response events
    emit('joinGame', { username: trimmed });
    setUsername(trimmed);  // optimistic local state
  }

  // ── Submit answer ─────────────────────────────────────────────────────────
  // Wrapped in useCallback so QuestionCard gets a stable reference
  const handleAnswer = useCallback((questionId, answerIndex) => {
    // submitAnswer: speed is measured as (Date.now() - question.startedAt)
    // The server independently records startedAt, so clients can't cheat
    // by delaying or modifying the timestamp.
    emit('submitAnswer', { questionId, answerIndex });
  }, [emit]);

  // ── Activate sabotage ─────────────────────────────────────────────────────
  const handleSabotage = useCallback(({ targetUsername, sabotageType }) => {
    emit('activateSabotage', { targetUsername, sabotageType });
  }, [emit]);

  // ── Lobby screen ──────────────────────────────────────────────────────────
  if (gameState.phase === 'lobby') {
    return (
      <div className="lobby">
        <h1 className="lobby__title">
          <span className="neon-text">STREAM</span>
          <br />
          <span className="neon-text neon-text--red">SABOTAGE</span>
        </h1>
        <p className="lobby__subtitle">Answer fast. Sabotage faster.</p>

        <form className="lobby__form" onSubmit={handleJoin}>
          <input
            className="lobby__input"
            type="text"
            placeholder="Enter username…"
            value={inputVal}
            maxLength={20}
            onChange={e => setInputVal(e.target.value)}
            autoFocus
          />
          <button className="lobby__btn neon-btn" type="submit">
            JOIN GAME ⚡
          </button>
        </form>

        {gameState.error && (
          <p className="lobby__error">⚠ {gameState.error}</p>
        )}
      </div>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────
  const isSabotaged = gameState.phase === 'sabotaged';

  return (
    <div className={`game-room ${isSabotaged ? 'game-room--sabotaged' : ''}`}>

      {/* ── Room-wide sabotage announcement toast ─────────────────────── */}
      {gameState.announcement && (
        <div className="announcement-toast">
          ⚡ <strong>{gameState.announcement.attackerUsername}</strong> sabotaged{' '}
          <strong>{gameState.announcement.targetUsername}</strong>!
        </div>
      )}

      {/* ── Left sidebar: Leaderboard ─────────────────────────────────── */}
      <Leaderboard
        leaderboard={gameState.leaderboard}
        currentUsername={username}
      />

      {/* ── Main content: Question ────────────────────────────────────── */}
      <main className="game-room__main">
        <QuestionCard
          question={gameState.question}
          onAnswer={handleAnswer}
          answerResult={gameState.answerResult}
          isSabotaged={isSabotaged}
          sabotage={gameState.sabotage}
        />
      </main>

      {/* ── Right sidebar: Sabotage HUD (conditional) ────────────────── */}
      <SabotageHUD
        saboTokens={gameState.saboTokens}
        leaderboard={gameState.leaderboard}
        currentUsername={username}
        onActivate={handleSabotage}
      />
    </div>
  );
}
