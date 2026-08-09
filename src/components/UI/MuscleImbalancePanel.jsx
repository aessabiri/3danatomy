import React from 'react';
import { Flame, ShieldAlert, Zap, ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';

export default function MuscleImbalancePanel({
  condition,
  onSelectMuscle,
}) {
  if (!condition || condition.id === 'neutral') {
    return (
      <aside
        className="glass-panel"
        style={{
          width: '340px',
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
          }}
        >
          <Activity size={24} color="#34d399" />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Symmetrical Kinetic Balance
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          All muscle agonist-antagonist force-couples are operating within ideal length-tension relationships.
        </p>
      </aside>
    );
  }

  const { overactiveMuscles = [], underactiveMuscles = [], kineticChainImpact, name } = condition;

  return (
    <aside
      className="glass-panel"
      style={{
        width: '350px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      {/* Title & Syndrome */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldAlert size={18} color="var(--accent-crimson)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Myofascial Imbalances
          </h2>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Agonist-antagonist length-tension breakdown for <strong style={{ color: 'var(--accent-cyan)' }}>{name}</strong>
        </p>
      </div>

      {/* Kinetic Chain Cascade Box */}
      <div
        className="glass-card"
        style={{
          padding: '12px',
          borderLeft: '4px solid var(--accent-cyan)',
          background: 'rgba(14, 165, 233, 0.08)',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={13} />
          Kinetic Chain Cascade:
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          {kineticChainImpact}
        </p>
      </div>

      {/* 1. SHORTENED / OVERACTIVE (NEEDS INHIBIT & LENGTHEN) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={15} color="#f87171" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#f87171', letterSpacing: '0.05em' }}>
              Overactive / Tight Muscles
            </span>
          </div>
          <span className="badge badge-tight">Inhibit & Stretch</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {overactiveMuscles.map((muscle) => (
            <div
              key={muscle.id}
              onClick={() => onSelectMuscle(muscle.id)}
              className="glass-card"
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderLeft: '3px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {muscle.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpRight size={12} />
                  {muscle.role}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {muscle.severity}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. LENGTHENED / UNDERACTIVE (NEEDS ACTIVATE & STRENGTHEN) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
              Underactive / Weak Muscles
            </span>
          </div>
          <span className="badge badge-weak">Activate & Fire</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {underactiveMuscles.map((muscle) => (
            <div
              key={muscle.id}
              onClick={() => onSelectMuscle(muscle.id)}
              className="glass-card"
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderLeft: '3px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {muscle.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowDownRight size={12} />
                  {muscle.role}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {muscle.severity}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
