import React, { useState } from 'react';
import { Gauge, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export default function BiomechanicalAnalysisHUD({
  postureParams,
  onToggleVectors,
  showVectors,
}) {
  // Start collapsed by default to keep the 3D canvas completely clear!
  const [isExpanded, setIsExpanded] = useState(false);

  const radToDeg = (r) => Math.round((r || 0) * (180 / Math.PI));

  const archDropMm = Math.round((postureParams.rightFootPronation || 0) * 45);
  const archHeightMm = Math.max(2, 18 - archDropMm);
  const tibialTorsionDeg = radToDeg((postureParams.rightFootPronation || 0) * 0.8);
  const kneeValgusDeg = radToDeg(postureParams.rightKneeValgus || 0);
  const pelvicDropMm = Math.round((postureParams.pelvisDrop || 0) * 75);
  const aptDeg = radToDeg(-postureParams.pelvisTilt || 0);
  const fhpMm = Math.round((postureParams.cervicalForwardHead || 0) * 100);
  const jawTractionN = ((postureParams.cervicalForwardHead || 0) * 9.5).toFixed(1);

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '14px',
        left: '14px',
        width: isExpanded ? '300px' : 'auto',
        borderRadius: isExpanded ? 'var(--radius-lg)' : 'var(--radius-full)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        zIndex: 25,
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Compact Header Pill */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.8)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Gauge size={14} color="var(--accent-cyan)" />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {isExpanded ? 'Live Biomechanical Telemetry' : `Telemetry: ${archHeightMm}mm Arch | +${tibialTorsionDeg}° Shin`}
        </span>
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Expanded Metrics Drawer */}
      {isExpanded && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(13, 18, 29, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>R Medial Arch:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: archHeightMm < 10 ? '#f87171' : '#34d399' }}>
              {archHeightMm} mm {archDropMm > 4 ? `(-${archDropMm}mm Drop)` : '(Normal)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>R Tibial Torsion:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: tibialTorsionDeg > 8 ? '#fbbf24' : '#34d399' }}>
              +{tibialTorsionDeg}° {tibialTorsionDeg > 8 ? 'External Torque' : 'Aligned'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>R Knee Valgus:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: kneeValgusDeg > 6 ? '#f87171' : '#34d399' }}>
              {kneeValgusDeg}° {kneeValgusDeg > 6 ? '(Medial Collapse)' : '(Aligned)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Pelvic Horizon Level:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: pelvicDropMm > 6 ? '#f87171' : '#34d399' }}>
              {pelvicDropMm > 6 ? `R Hip Dropped -${pelvicDropMm}mm` : 'Level'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Anterior Pelvic Tilt:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: aptDeg > 10 ? '#fbbf24' : '#34d399' }}>
              {aptDeg}° {aptDeg > 10 ? '(Hyperlordotic)' : '(Neutral)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Forward Head (FHP):</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: fhpMm > 15 ? '#f87171' : '#34d399' }}>
              +{fhpMm} mm
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Jaw Traction Load:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: parseFloat(jawTractionN) > 1.5 ? '#f87171' : '#34d399' }}>
              {jawTractionN} N Downward
            </span>
          </div>

          <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>3D Laser Vectors:</span>
            <button
              className={`btn-secondary ${showVectors ? 'active' : ''}`}
              style={{ fontSize: '0.675rem', padding: '1px 6px', height: '22px', color: showVectors ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleVectors();
              }}
            >
              <Zap size={10} />
              {showVectors ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
