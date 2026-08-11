import React from 'react';
import { Flame, ShieldAlert, Zap, ArrowDownRight, ArrowUpRight, Activity, Layers } from 'lucide-react';
import { KineticChainSolver } from '../../utils/KineticChainSolver';

export default function MuscleImbalancePanel({
  condition,
  postureParams = {},
  onSelectMuscle,
}) {
  // Dynamically compute real-time length-tension strains from current 3D bone positions
  const { registry, overactive, underactive } = KineticChainSolver.calculateMuscleStrains(postureParams);

  const dynamicOveractive = overactive.length > 0
    ? overactive
    : (condition?.overactiveMuscles || []);

  const dynamicUnderactive = underactive.length > 0
    ? underactive
    : (condition?.underactiveMuscles || []);

  const kineticCascadeText = condition?.kineticChainImpact ||
    'Real-time kinetic chain compensation: Foot arch collapse triggers internal tibial torsion, driving knee valgus, pelvic obliquity (hip drop), compensatory thoracic kyphosis, and anterior cervical traction.';

  return (
    <aside
      className="glass-panel"
      style={{
        width: '360px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'rgba(10, 15, 26, 0.95)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Title & Diagnostic State */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldAlert size={18} color="var(--accent-crimson)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Dynamic Muscle Length-Tension
          </h2>
        </div>
        <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
          Real-time myofascial strain computed from 3D joint articulation & closed kinetic chain
        </p>
      </div>

      {/* Kinetic Chain Cascade Box */}
      <div
        className="glass-card"
        style={{
          padding: '10px 12px',
          borderLeft: '4px solid var(--accent-cyan)',
          background: 'rgba(14, 165, 233, 0.08)',
        }}
      >
        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={13} />
          Active Closed-Chain Cascade:
        </div>
        <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {kineticCascadeText}
        </p>
      </div>

      {/* 1. SHORTENED / OVERACTIVE (HYPERTONIC / SPASM) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={15} color="#f87171" />
            <span style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#f87171', letterSpacing: '0.05em' }}>
              Hypertonic / Shortened ({dynamicOveractive.length})
            </span>
          </div>
          <span className="badge badge-tight" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
            Inhibit & Stretch
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {dynamicOveractive.map((muscle) => (
            <div
              key={muscle.id}
              onClick={() => onSelectMuscle(muscle.id)}
              className="glass-card"
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                borderLeft: '3px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {muscle.name}
                </div>
                <div style={{ fontSize: '0.675rem', color: '#f87171', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpRight size={12} />
                  {muscle.role}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: '#f87171',
                    background: 'rgba(239, 68, 68, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  {muscle.strainPercent ? `${muscle.strainPercent}%` : `${muscle.severity}%`}
                </span>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Shortened
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. OVERSTRETCHED / UNDERACTIVE (INHIBITED / ECCENTRIC LOAD) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} color="#38bdf8" />
            <span style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em' }}>
              Inhibited / Overstretched ({dynamicUnderactive.length})
            </span>
          </div>
          <span className="badge badge-weak" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
            Activate & Strengthen
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {dynamicUnderactive.map((muscle) => (
            <div
              key={muscle.id}
              onClick={() => onSelectMuscle(muscle.id)}
              className="glass-card"
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                borderLeft: '3px solid #06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {muscle.name}
                </div>
                <div style={{ fontSize: '0.675rem', color: '#38bdf8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowDownRight size={12} />
                  {muscle.role}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: '#38bdf8',
                    background: 'rgba(6, 182, 212, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  {muscle.strainPercent ? `+${muscle.strainPercent}%` : `${muscle.severity}%`}
                </span>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Lengthened
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
