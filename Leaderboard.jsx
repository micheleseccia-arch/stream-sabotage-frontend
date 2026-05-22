/**
 * Leaderboard.jsx
 * ─────────────────────────────────────────────────────────
 * Shows a live-updating ranked list of all players.
 * Receives sorted `leaderboard` array from GameRoom via props.
 * 
 * Re-renders only when `leaderboard` array reference changes —
 * which only happens when Socket.io fires `leaderboardUpdate`.
 */

import React from 'react';

// Crown icons for top 3
const RANK_ICONS = ['👑', '🥈', '🥉'];

export function Leaderboard({ leaderboard, currentUsername }) {
  return (
    <aside className="leaderboard">
      <h2 className="leaderboard__title">
        <span className="neon-text">LEADERBOARD</span>
      </h2>

      <ol className="leaderboard__list">
        {leaderboard.map((player, index) => {
          const isMe   = player.username === currentUsername;
          const rankIcon = RANK_ICONS[index] ?? `#${index + 1}`;

          return (
            <li
              key={player.username}
              className={`leaderboard__row ${isMe ? 'leaderboard__row--me' : ''}`}
            >
              {/* Rank badge */}
              <span className="leaderboard__rank">{rankIcon}</span>

              {/* Username */}
              <span className="leaderboard__name">
                {player.username}
                {isMe && <sup className="leaderboard__you-tag"> YOU</sup>}
              </span>

              {/* Score — animates via CSS when value changes */}
              <span className="leaderboard__score">
                {player.score.toLocaleString()}
                <small> pts</small>
              </span>

              {/* Sabotage token count — only show if > 0 */}
              {player.saboTokens > 0 && (
                <span
                  className="leaderboard__tokens"
                  title="Sabotage Tokens"
                >
                  ⚡{player.saboTokens}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {leaderboard.length === 0 && (
        <p className="leaderboard__empty">Waiting for players…</p>
      )}
    </aside>
  );
}
