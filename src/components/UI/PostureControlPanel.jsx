import React from 'react';
import { RotateCcw, Sliders, ChevronRight, Activity, Zap, Link, Unlink, Footprints, Disc } from 'lucide-react';
import { POSTURE_CONDITIONS } from '../../data/postureConditions';

export default function PostureControlPanel({
  selectedConditionId,
  onSelectCondition,
  postureParams,
  onParamChange,
  onResetPosture,
  kineticMode = 'foot_ascending', // 'foot_ascending' | 'pelvis_rooted' | 'manual'
  onKineticModeChange = null,
}) {
  const radToDeg = (rad) => Math.round((rad || 0) * (180 / Math.PI));
  const degToRad = (deg) => deg * (Math.PI / 180);

  const calculateAlignmentScore = () => {
    let deviationSum = 0;
    Object.values(postureParams).forEach((val) => {
      if (typeof val === 'number') deviationSum += Math.abs(val);
    });
    return Math.max(10, Math.round(100 - deviationSum * 45));
  };

  const alignmentScore = calculateAlignmentScore();

  return (
    <aside
      className="glass-panel"
      style={{
        width: '370px',
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
      {/* Header & Alignment Score */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Kinetic Chain Diagnostics
            </h2>
          </div>
          <button
            onClick={onResetPosture}
            className="btn-secondary"
            style={{ fontSize: '0.725rem', padding: '3px 8px', height: '24px' }}
            title="Reset All Joint Angles to Neutral"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>

        {/* Live Alignment Meter */}
        <div
          className="glass-card"
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            borderLeft: `4px solid ${alignmentScore > 80 ? 'var(--accent-emerald)' : alignmentScore > 55 ? 'var(--accent-amber)' : 'var(--accent-crimson)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Kinetic Chain Alignment:
            </span>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: alignmentScore > 80 ? '#34d399' : alignmentScore > 55 ? '#fbbf24' : '#f87171',
              }}
            >
              {alignmentScore}% {alignmentScore > 80 ? 'Optimal' : alignmentScore > 55 ? 'Compensated' : 'Dysfunctional'}
            </span>
          </div>

          <div style={{ width: '100%', height: '5px', backgroundColor: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${alignmentScore}%`,
                backgroundColor: alignmentScore > 80 ? 'var(--accent-emerald)' : alignmentScore > 55 ? 'var(--accent-amber)' : 'var(--accent-crimson)',
                transition: 'width 0.25s ease-out',
              }}
            />
          </div>
        </div>
      </div>

      {/* DYNAMIC KINETIC CHAIN COUPLING SELECTOR */}
      <div
        className="glass-card"
        style={{
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          background: 'rgba(14, 165, 233, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
              Dynamic Kinetic Coupling
            </span>
          </div>
          <span style={{ fontSize: '0.65rem', color: kineticMode === 'manual' ? '#94a3b8' : '#34d399', fontWeight: 700 }}>
            {kineticMode === 'manual' ? 'DECOUPLED' : 'AUTO-PROPAGATING'}
          </span>
        </div>

        {/* Driver Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
          <button
            onClick={() => onKineticModeChange && onKineticModeChange('foot_ascending')}
            className={`btn-secondary ${kineticMode === 'foot_ascending' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              fontSize: '0.675rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              border: kineticMode === 'foot_ascending' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            }}
            title="Ground-up cascade: Foot arch collapse drives tibial torsion, knee valgus, pelvic drop, and spinal curve"
          >
            <Footprints size={13} color={kineticMode === 'foot_ascending' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            <span>Foot Driver</span>
          </button>

          <button
            onClick={() => onKineticModeChange && onKineticModeChange('pelvis_rooted')}
            className={`btn-secondary ${kineticMode === 'pelvis_rooted' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              fontSize: '0.675rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              border: kineticMode === 'pelvis_rooted' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            }}
            title="Core cascade: Pelvic drop and tilt drive lower limb valgus collapse and upper spine kyphosis"
          >
            <Disc size={13} color={kineticMode === 'pelvis_rooted' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            <span>Pelvis Driver</span>
          </button>

          <button
            onClick={() => onKineticModeChange && onKineticModeChange('manual')}
            className={`btn-secondary ${kineticMode === 'manual' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              fontSize: '0.675rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              border: kineticMode === 'manual' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            }}
            title="Isolated manual control for micro joint inspection"
          >
            <Unlink size={13} color={kineticMode === 'manual' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            <span>Manual</span>
          </button>
        </div>

        <div style={{ marginTop: '8px', fontSize: '0.675rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
          {kineticMode === 'foot_ascending' && (
            <span>⚡ <strong>Ascending Chain:</strong> Moving Foot Pronation automatically articulates Shin $\rightarrow$ Knee $\rightarrow$ Pelvis $\rightarrow$ Spine $\rightarrow$ Jaw.</span>
          )}
          {kineticMode === 'pelvis_rooted' && (
            <span>⚡ <strong>Core-Rooted Chain:</strong> Moving Pelvis Drop automatically accommodates Femur, Knee Valgus, Foot Arch & Kyphosis.</span>
          )}
          {kineticMode === 'manual' && (
            <span>🔓 <strong>Decoupled:</strong> Individual joints can be manipulated independently.</span>
          )}
        </div>
      </div>

      {/* Clinical Posture Presets */}
      <div>
        <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>
          Clinical Misalignment Presets
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {Object.values(POSTURE_CONDITIONS).map((cond) => {
            const isSelected = selectedConditionId === cond.id;
            return (
              <button
                key={cond.id}
                onClick={() => onSelectCondition(cond.id)}
                className={`glass-card ${isSelected ? 'active' : ''}`}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(14, 165, 233, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                    {cond.name}
                  </div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {cond.category}
                  </div>
                </div>
                <ChevronRight size={14} color={isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-Tuning Kinematic Biomechanical Sliders */}
      <div>
        <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.05em' }}>
          Interactive Joint Angles & Chain Links
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 1. Foot Pronation / Arch Drop */}
          <div
            className="glass-card"
            style={{
              padding: '8px 10px',
              border: kineticMode === 'foot_ascending' ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid var(--border-subtle)',
              background: kineticMode === 'foot_ascending' ? 'rgba(14, 165, 233, 0.12)' : 'rgba(15, 23, 42, 0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: kineticMode === 'foot_ascending' ? 'var(--accent-cyan)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {kineticMode === 'foot_ascending' && <Zap size={11} />}
                R Foot Pronation & Arch Drop {kineticMode === 'foot_ascending' && '(Master Driver)'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {radToDeg(postureParams.rightFootPronation)}°
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="35"
              step="1"
              value={radToDeg(postureParams.rightFootPronation)}
              onChange={(e) => onParamChange('rightFootPronation', degToRad(parseFloat(e.target.value)))}
            />
          </div>

          {/* 2. Knee Valgus */}
          <div className="glass-card" style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                R Knee Valgus (Inward Collapse) {kineticMode !== 'manual' && '🔗'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {radToDeg(postureParams.rightKneeValgus)}°
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="25"
              step="1"
              value={radToDeg(postureParams.rightKneeValgus)}
              onChange={(e) => onParamChange('rightKneeValgus', degToRad(parseFloat(e.target.value)))}
            />
          </div>

          {/* 3. Pelvis Roll (Lateral Hip Drop) */}
          <div
            className="glass-card"
            style={{
              padding: '8px 10px',
              border: kineticMode === 'pelvis_rooted' ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid var(--border-subtle)',
              background: kineticMode === 'pelvis_rooted' ? 'rgba(14, 165, 233, 0.12)' : 'rgba(15, 23, 42, 0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: kineticMode === 'pelvis_rooted' ? 'var(--accent-cyan)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {kineticMode === 'pelvis_rooted' && <Zap size={11} />}
                Lateral Pelvic Drop (Roll) {kineticMode === 'pelvis_rooted' && '(Master Driver)'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {radToDeg(postureParams.pelvisDrop)}° {postureParams.pelvisDrop > 0.03 ? '(R Drop)' : postureParams.pelvisDrop < -0.03 ? '(L Drop)' : '(Level)'}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={radToDeg(postureParams.pelvisDrop)}
              onChange={(e) => onParamChange('pelvisDrop', degToRad(parseFloat(e.target.value)))}
            />
          </div>

          {/* 4. Pelvis Pitch (Anterior/Posterior Tilt) */}
          <div className="glass-card" style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Pelvic Tilt (APT Pitch) {kineticMode !== 'manual' && '🔗'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {radToDeg(postureParams.pelvisTilt)}° {postureParams.pelvisTilt < -0.05 ? '(Anterior)' : postureParams.pelvisTilt > 0.05 ? '(Posterior)' : '(Neutral)'}
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="1"
              value={radToDeg(postureParams.pelvisTilt)}
              onChange={(e) => onParamChange('pelvisTilt', degToRad(parseFloat(e.target.value)))}
            />
          </div>

          {/* 5. Lumbar Lordosis */}
          <div className="glass-card" style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Lumbar Lordosis (L1-L5) {kineticMode !== 'manual' && '🔗'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {radToDeg(postureParams.lumbarLordosis)}°
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="30"
              step="1"
              value={radToDeg(postureParams.lumbarLordosis)}
              onChange={(e) => onParamChange('lumbarLordosis', degToRad(parseFloat(e.target.value)))}
            />
          </div>

          {/* 6. Thoracic Kyphosis */}
          <div className="glass-card" style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Thoracic Kyphosis (T1-T12) {kineticMode !== 'manual' && '🔗'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                +{radToDeg(postureParams.thoracicKyphosis)}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={radToDeg(postureParams.thoracicKyphosis)}
              onChange={(e) => onParamChange('thoracicKyphosis', degToRad(parseFloat(e.target.value)))}
            />
          </div>

          {/* 7. Cervical Forward Head & Mandible */}
          <div className="glass-card" style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Forward Head & Jaw Pull {kineticMode !== 'manual' && '🔗'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {Math.round((postureParams.cervicalForwardHead || 0) * 100)} mm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={Math.round((postureParams.cervicalForwardHead || 0) * 100)}
              onChange={(e) => onParamChange('cervicalForwardHead', parseFloat(e.target.value) / 100)}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
