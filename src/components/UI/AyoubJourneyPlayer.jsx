import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, Sparkles, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { AYOUB_JOURNEY_STAGES } from '../../data/ayoubJourneyData';

export default function AyoubJourneyPlayer({
  isActive,
  onClose,
  onStageChange,
  onOpenExercises,
}) {
  if (!isActive) return null;

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [stageProgress, setStageProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const activeStage = AYOUB_JOURNEY_STAGES[currentStageIdx];
  const timerRef = useRef(null);

  useEffect(() => {
    if (activeStage && onStageChange) {
      onStageChange(activeStage);
    }
  }, [currentStageIdx]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const duration = 6500 / speed;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    timerRef.current = setInterval(() => {
      setStageProgress((prev) => {
        if (prev >= 100) {
          setCurrentStageIdx((curr) => (curr + 1) % AYOUB_JOURNEY_STAGES.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, currentStageIdx]);

  const handleNext = () => {
    setStageProgress(0);
    setCurrentStageIdx((prev) => (prev + 1) % AYOUB_JOURNEY_STAGES.length);
  };

  const handlePrev = () => {
    setStageProgress(0);
    setCurrentStageIdx((prev) => (prev - 1 + AYOUB_JOURNEY_STAGES.length) % AYOUB_JOURNEY_STAGES.length);
  };

  const handleSelectStage = (idx) => {
    setStageProgress(0);
    setCurrentStageIdx(idx);
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: isMinimized ? '540px' : '760px',
        borderRadius: 'var(--radius-lg)',
        padding: isMinimized ? '8px 16px' : '14px 18px',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7)',
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top Header & Stage Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={14} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Ayoub: {activeStage.title}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginLeft: '6px' }}>
              ({activeStage.year})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-accent"
            style={{ height: '24px', padding: '0 8px', fontSize: '0.7rem' }}
            onClick={onOpenExercises}
          >
            <Dumbbell size={11} />
            Rehab Guide
          </button>

          <button
            className="btn-icon"
            style={{ width: '24px', height: '24px' }}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Details' : 'Minimize Bar'}
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            className="btn-icon"
            style={{ width: '24px', height: '24px' }}
            onClick={onClose}
            title="Exit Ayoub Mode"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Concise Summary */}
      {!isMinimized && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Stage Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
            {AYOUB_JOURNEY_STAGES.map((stg, idx) => {
              const isCurrent = currentStageIdx === idx;
              return (
                <button
                  key={stg.id}
                  onClick={() => handleSelectStage(idx)}
                  style={{
                    padding: '3px 2px',
                    borderRadius: '4px',
                    border: isCurrent ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    background: isCurrent ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                    color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                  }}
                >
                  S{idx + 1}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
            {activeStage.description}
          </p>
        </div>
      )}

      {/* Controls & Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn-icon" style={{ width: '26px', height: '26px' }} onClick={handlePrev}>
          <SkipBack size={12} />
        </button>
        <button
          className="btn-primary"
          style={{ width: '28px', height: '26px', padding: 0, borderRadius: '4px' }}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <button className="btn-icon" style={{ width: '26px', height: '26px' }} onClick={handleNext}>
          <SkipForward size={12} />
        </button>

        <div style={{ flex: 1, height: '4px', backgroundColor: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${stageProgress}%`,
              backgroundColor: 'var(--accent-cyan)',
              transition: isPlaying ? 'width 0.05s linear' : 'none',
            }}
          />
        </div>

        <button
          className="btn-secondary"
          style={{ height: '22px', padding: '0 6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}
          onClick={() => setSpeed((s) => (s === 1.0 ? 1.5 : s === 1.5 ? 2.0 : 1.0))}
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}
