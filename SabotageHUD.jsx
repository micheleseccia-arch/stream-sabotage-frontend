/**
 * SabotageHUD.jsx
 * ─────────────────────────────────────────────────────────
 * The sabotage action panel — ONLY renders when the player
 * has ≥1 Sabotage Token. Lets them target any other player.
 *
 * Design intent:
 *   • Hidden when tokens = 0 (no visual noise)
 *   • Pulsing neon border to draw streamer attention
 *   • Target picker + sabotage type selector
 *
 * Props:
 *   saboTokens      — number: how many tokens this player has
 *   leaderboard     — array of { username, score, saboTokens }
 *   currentUsername — string: this player's own name (exclude from targets)
 *   onActivate      — callback({ targetUsername, sabotageType })
 */

import React, { useState } from 'react';

const SABOTAGE_TYPES = [
  { id: 'flip',   label: '🙃 Flip',   description: 'Flips their screen upside-down' },
  { id: 'blur',   label: '😵 Blur',   description: 'Blurs their question card' },
  { id: 'hide',   label: '🙈 Hide',   description: 'Hides answer choices briefly' },
  { id: 'jitter', label: '💀 Jitter', description: 'Shakes their entire layout' },
];

export function SabotageHUD({ saboTokens, leaderboard, currentUsername, onActivate }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedType,   setSelectedType]   = useState(SABOTAGE_TYPES[0].id);
  const [cooldown,       setCooldown]        = useState(false);

  // Hide entirely when player has no tokens
  if (saboTokens < 1) return null;

  // Filter out self from target list
  const targets = leaderboard.filter(p => p.username !== currentUsername);

  function handleActivate() {
    if (!selectedTarget || cooldown) return;

    onActivate({ targetUsername: selectedTarget, sabotageType: selectedType });

    // Local cooldown to prevent double-clicking
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000);
  }

  return (
    <div className="sabotage-hud">
      {/* Header */}
      <div className="sabotage-hud__header">
        <span className="sabotage-hud__icon">⚡</span>
        <h3 className="sabotage-hud__title">SABOTAGE</h3>
        <span className="sabotage-hud__token-count">
          {saboTokens} token{saboTokens !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Target Selector */}
      <div className="sabotage-hud__field">
        <label className="sabotage-hud__label">Target</label>
        <select
          className="sabotage-hud__select"
          value={selectedTarget}
          onChange={e => setSelectedTarget(e.target.value)}
        >
          <option value="">— pick a victim —</option>
          {targets.map(p => (
            <option key={p.username} value={p.username}>
              {p.username} ({p.score.toLocaleString()} pts)
            </option>
          ))}
        </select>
      </div>

      {/* Sabotage Type Selector */}
      <div className="sabotage-hud__field">
        <label className="sabotage-hud__label">Type</label>
        <div className="sabotage-hud__types">
          {SABOTAGE_TYPES.map(t => (
            <button
              key={t.id}
              className={`sabotage-hud__type-btn ${selectedType === t.id ? 'type-btn--active' : ''}`}
              onClick={() => setSelectedType(t.id)}
              title={t.description}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fire Button */}
      <button
        className={`sabotage-hud__fire-btn ${(!selectedTarget || cooldown) ? 'fire-btn--disabled' : ''}`}
        onClick={handleActivate}
        disabled={!selectedTarget || cooldown}
      >
        {cooldown ? 'DEPLOYING…' : '⚡ DEPLOY SABOTAGE'}
      </button>

      <p className="sabotage-hud__cost">Costs 1 token per use</p>
    </div>
  );
}
