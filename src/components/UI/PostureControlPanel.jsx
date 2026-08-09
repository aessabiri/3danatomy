import React from 'react';
import { RotateCcw, Sliders, ChevronRight, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { POSTURE_CONDITIONS } from '../../data/postureConditions';

export default function PostureControlPanel({
  selectedConditionId,
  onSelectCondition,
  postureParams,
  onParamChange,
  onResetPosture,
}) {
  // Convert radians to degrees for intuitive display
  const radToDeg = (rad) => Math.round(rad * (180 / Math.PI));
  const degToRad = (deg) => deg * (Math.PI / 180);

  // Compute a live posture alignment deviation score (0 - 100)
  const calculateAlignmentScore = () => {
    let deviationSum = 0;
    Object.values(postureParams).forEach((val) => {
      deviationSum += Math.abs(val);
    });
    const score = Math.max(10, Math.round(100 - deviationSum * 45));
    return score;
  };

  const alignmentScore = calculateAlignmentScore();

  return (
    <aside
      className="glass-panel"
      style={{
        width: '360px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header & Alignment Score */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Posture Diagnostics
            </h2>
          </div>
          <button
            onClick={onResetPosture}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 8px', height: '26px' }}
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
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            borderLeft: `4px solid ${alignmentScore > 80 ? 'var(--accent-emerald)' : alignmentScore > 55 ? 'var(--accent-amber)' : 'var(--accent-crimson)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Plumb Line Alignment:
            </span>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: alignmentScore > 80 ? '#34d399' : alignmentScore > 55 ? '#fbbf24' : '#f87171',
              }}
            >
              {alignmentScore}% {alignmentScore > 80 ? 'Optimal' : alignmentScore > 55 ? 'Compensated' : 'Dysfunctional'}
            </span>
          </div>

          <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${alignmentScore}%`,
                backgroundColor: alignmentScore > 80 ? 'var(--accent-emerald)' : alignmentScore > 55 ? 'var(--accent-amber)' : 'var(--accent-crimson)',
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>
        </div>
      </div>

      {/* Clinical Posture Presets */}
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
          Clinical Misalignment Presets
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(14, 165, 233, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                    {cond.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {cond.category}
                  </div>
                </div>
                <ChevronRight size={16} color={isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-Tuning Kinematic Biomechanical Sliders */}
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
          Articulated Joint Kinematics
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 1. Pelvis Pitch (Anterior/Posterior Tilt) */}
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Pelvic Tilt (Pitch)</span>
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

          {/* 2. Pelvis Roll (Lateral Hip Drop) */}
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Lateral Pelvic Drop (Roll)</span>
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

          {/* 3. Lumbar Lordosis */}
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Lumbar Lordosis (L1-L5)</span>
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

          {/* 4. Thoracic Kyphosis */}
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Thoracic Kyphosis (T1-T12)</span>
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

          {/* 5. Spinal Lateral Bend (Scoliosis) */}
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Spinal Lateral Curve (Scoliosis)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {radToDeg(postureParams.spinalLateralBend)}°
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="1"
              value={radToDeg(postureParams.spinalLateralBend)}
              onChange={(e) => onParamChange('spinalLateralBend', degToRad(parseFloat(e.target.value)))}
            />
          </div>

          {/* 6. Cervical Forward Head */}
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Forward Head Displacement</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {Math.round(postureParams.cervicalForwardHead * 100)} mm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={Math.round(postureParams.cervicalForwardHead * 100)}
              onChange={(e) => onParamChange('cervicalForwardHead', parseFloat(e.target.value) / 100)}
            />
          </div>

          {/* 7. Knee Valgus / Varus */}
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Knee Valgus (Inward Collapse)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {radToDeg(postureParams.rightKneeValgus)}°
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="25"
              step="1"
              value={radToDeg(postureParams.rightKneeValgus)}
              onChange={(e) => {
                const val = degToRad(parseFloat(e.target.value));
                onParamChange('rightKneeValgus', val);
                onParamChange('leftKneeValgus', val);
              }}
            />
          </div>

          {/* 8. Foot Pronation / Arch Drop */}
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Foot Pronation & Eversion</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {radToDeg(postureParams.rightFootPronation)}°
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="30"
              step="1"
              value={radToDeg(postureParams.rightFootPronation)}
              onChange={(e) => {
                const val = degToRad(parseFloat(e.target.value));
                onParamChange('rightFootPronation', val);
                onParamChange('leftFootPronation', val);
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
