/**
 * QuestionCard.jsx
 * ─────────────────────────────────────────────────────────
 * Displays the current question + answer choices.
 * Tracks elapsed time locally (via requestAnimationFrame) to
 * drive the progress bar — no extra socket traffic needed.
 *
 * Props:
 *   question       — { id, text, options[], startedAt, duration }
 *   onAnswer       — callback(questionId, answerIndex)
 *   answerResult   — null | { isCorrect, correctAnswer, pointsEarned }
 *   isSabotaged    — bool: whether to apply sabotage CSS
 *   sabotage       — null | { sabotageType, attackerUsername }
 */

import React, { useState, useEffect, useRef } from 'react';

// Maps sabotageType strings to CSS class names on the card
const SABOTAGE_CLASSES = {
  flip:   'question-card--flip',
  blur:   'question-card--blur',
  hide:   'question-card--hide',
  jitter: 'question-card--jitter',
  timer:  'question-card--timer',   // visual feedback; speed logic is server-side
};

export function QuestionCard({ question, onAnswer, answerResult, isSabotaged, sabotage }) {
  const [selected, setSelected]         = useState(null);    // index of chosen answer
  const [progress, setProgress]         = useState(100);     // countdown bar %
  const animFrameRef                    = useRef(null);

  // Reset local state when question changes (new round)
  useEffect(() => {
    setSelected(null);
    setProgress(100);

    if (!question) return;

    // Countdown animation loop using requestAnimationFrame
    // Much smoother than setInterval; no extra Socket.io calls needed
    const tick = () => {
      const elapsed = Date.now() - question.startedAt;
      const remaining = Math.max(0, 1 - elapsed / question.duration);
      setProgress(remaining * 100);

      if (remaining > 0) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [question]);

  if (!question) {
    return (
      <div className="question-card question-card--loading">
        <p>Waiting for next question…</p>
      </div>
    );
  }

  const hasAnswered = selected !== null || answerResult !== null;

  // Determine CSS class for sabotage effect
  const sabotageClass = (isSabotaged && sabotage)
    ? (SABOTAGE_CLASSES[sabotage.sabotageType] ?? '')
    : '';

  function handleSelect(index) {
    if (hasAnswered) return;          // can only answer once per round
    setSelected(index);
    onAnswer(question.id, index);     // fire up to GameRoom → socket.emit
  }

  return (
    <div className={`question-card ${sabotageClass}`}>
      {/* Sabotage warning banner */}
      {isSabotaged && sabotage && (
        <div className="question-card__sabotage-banner">
          ⚡ SABOTAGED by {sabotage.attackerUsername}!
        </div>
      )}

      {/* Countdown progress bar */}
      <div className="question-card__timer-track">
        <div
          className="question-card__timer-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question text */}
      <h3 className="question-card__text">{question.text}</h3>

      {/* Answer options */}
      <div className="question-card__options">
        {question.options.map((option, index) => {
          let modifier = '';
          if (answerResult) {
            // Show correct/wrong AFTER result arrives from server
            if (option === answerResult.correctAnswer)  modifier = 'option--correct';
            else if (index === selected)                modifier = 'option--wrong';
            else                                        modifier = 'option--dimmed';
          } else if (index === selected) {
            modifier = 'option--selected';
          }

          return (
            <button
              key={index}
              className={`question-card__option ${modifier}`}
              onClick={() => handleSelect(index)}
              disabled={hasAnswered}
            >
              <span className="option__letter">{String.fromCharCode(65 + index)}</span>
              <span className="option__text">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Answer feedback — shown after server responds */}
      {answerResult && (
        <div className={`question-card__result ${answerResult.isCorrect ? 'result--correct' : 'result--wrong'}`}>
          {answerResult.isCorrect
            ? `✓ Correct! +${answerResult.pointsEarned} pts${answerResult.tokenEarned ? ' ⚡ Token earned!' : ''}`
            : `✗ Wrong — correct was: ${answerResult.correctAnswer}`
          }
        </div>
      )}
    </div>
  );
}
