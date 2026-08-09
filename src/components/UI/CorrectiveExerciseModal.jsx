import React, { useState } from 'react';
import { X, Dumbbell, Play, CheckCircle2, Clock, Repeat, Target, Sparkles, ChevronRight } from 'lucide-react';

export default function CorrectiveExerciseModal({
  protocol,
  conditionName,
  onClose,
}) {
  if (!protocol) return null;

  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const activePhase = protocol.phases[activePhaseIndex];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(7, 9, 14, 0.82)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Dumbbell size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {protocol.title}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Targeted 4-Phase Biomechanical Realignment Protocol for <strong style={{ color: 'var(--accent-cyan)' }}>{conditionName}</strong>
              </p>
            </div>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            style={{ borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Phase Navigation Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.4)',
          }}
        >
          {protocol.phases.map((phase, idx) => {
            const isActive = activePhaseIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setActivePhaseIndex(idx)}
                style={{
                  padding: '14px 10px',
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  Phase {idx + 1}
                </div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', marginTop: '2px' }}>
                  {phase.phase.split('. ')[1] || phase.phase}
                </div>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Action Title */}
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              borderLeft: '4px solid var(--accent-emerald)',
              background: 'rgba(16, 185, 129, 0.08)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Prescribed Exercise Action
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {activePhase.action}
            </h3>
          </div>

          {/* Execution Technique & Coaching Cues */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-cyan)" />
              Biomechanical Coaching Technique
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              {activePhase.technique}
            </p>
          </div>

          {/* Details Grid: Target Muscles, Sets/Reps, Frequency */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Target size={14} color="var(--accent-cyan)" />
                Target Anatomy
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activePhase.targetMuscles}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Repeat size={14} color="#34d399" />
                Prescribed Volume
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activePhase.setsReps}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Clock size={14} color="#fbbf24" />
                Frequency
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activePhase.frequency}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Step Next / Close */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Phase {activePhaseIndex + 1} of {protocol.phases.length}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {activePhaseIndex < protocol.phases.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setActivePhaseIndex((prev) => prev + 1)}
              >
                Next Phase
                <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-accent" onClick={onClose}>
                <CheckCircle2 size={16} />
                Complete Protocol
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
