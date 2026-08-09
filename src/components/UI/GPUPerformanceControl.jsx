import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Sliders, ShieldCheck, X, Sparkles, Activity } from 'lucide-react';

export default function GPUPerformanceControl({
  isOpen,
  onClose,
  vertexRatio,
  onVertexRatioChange,
  pixelRatioScale,
  onPixelRatioScaleChange,
  shadowsEnabled,
  onToggleShadows,
  geometryStats,
}) {
  if (!isOpen) return null;

  // Preset Handlers
  const handleApplyPreset = (preset) => {
    if (preset === 'eco') {
      onVertexRatioChange(0.35);
      onPixelRatioScaleChange(0.8);
      onToggleShadows(false);
    } else if (preset === 'balanced') {
      onVertexRatioChange(0.65);
      onPixelRatioScaleChange(1.0);
      onToggleShadows(true);
    } else if (preset === 'ultra') {
      onVertexRatioChange(1.0);
      onPixelRatioScaleChange(1.25);
      onToggleShadows(true);
    }
  };

  const currentPreset =
    vertexRatio <= 0.4 && !shadowsEnabled
      ? 'eco'
      : vertexRatio >= 0.95 && pixelRatioScale >= 1.2
      ? 'ultra'
      : 'balanced';

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '64px',
        right: '16px',
        width: '330px',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.2)',
        zIndex: 55,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="var(--accent-cyan)" />
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              GPU & Vertex Resolution
            </h4>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
              Integrated Graphics Saver
            </span>
          </div>
        </div>
        <button className="btn-icon" style={{ width: '26px', height: '26px' }} onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {/* Live Vertex & Polygon Counter */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: '0.725rem',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Active Vertices:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
            {geometryStats?.totalVertices?.toLocaleString() || '45,200'}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Active Triangles:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#34d399', fontSize: '0.9rem' }}>
            {geometryStats?.totalTriangles?.toLocaleString() || '90,400'}
          </span>
        </div>
      </div>

      {/* Quick 1-Click Optimization Presets */}
      <div>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          PERFORMANCE PROFILES:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <button
            className={`btn-secondary ${currentPreset === 'eco' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              borderColor: currentPreset === 'eco' ? '#34d399' : 'var(--border-subtle)',
              color: currentPreset === 'eco' ? '#34d399' : 'var(--text-primary)',
            }}
            onClick={() => handleApplyPreset('eco')}
          >
            <Zap size={13} color={currentPreset === 'eco' ? '#34d399' : 'var(--accent-cyan)'} />
            <span>⚡ Eco (iGPU)</span>
          </button>

          <button
            className={`btn-secondary ${currentPreset === 'balanced' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              borderColor: currentPreset === 'balanced' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              color: currentPreset === 'balanced' ? 'var(--accent-cyan)' : 'var(--text-primary)',
            }}
            onClick={() => handleApplyPreset('balanced')}
          >
            <ShieldCheck size={13} />
            <span>⚖️ Balanced</span>
          </button>

          <button
            className={`btn-secondary ${currentPreset === 'ultra' ? 'active' : ''}`}
            style={{
              padding: '6px 4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              borderColor: currentPreset === 'ultra' ? '#f59e0b' : 'var(--border-subtle)',
              color: currentPreset === 'ultra' ? '#f59e0b' : 'var(--text-primary)',
            }}
            onClick={() => handleApplyPreset('ultra')}
          >
            <Sparkles size={13} />
            <span>💎 Ultra</span>
          </button>
        </div>
      </div>

      {/* Fine-Tuning Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Slider 1: Vertex Count / Density */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Mesh Vertex Density:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {Math.round(vertexRatio * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.25"
            max="1.0"
            step="0.05"
            value={vertexRatio}
            onChange={(e) => onVertexRatioChange(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            <span>25% (Low Power)</span>
            <span>50%</span>
            <span>100% (Full Res)</span>
          </div>
        </div>

        {/* Slider 2: Render Resolution Scale */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Render Pixel Scale:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {pixelRatioScale}x DPR
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {[0.75, 1.0, 1.25, 1.5].map((scale) => (
              <button
                key={scale}
                className={`btn-secondary ${pixelRatioScale === scale ? 'active' : ''}`}
                style={{ height: '24px', fontSize: '0.65rem', padding: '0 4px', fontFamily: 'var(--font-mono)' }}
                onClick={() => onPixelRatioScaleChange(scale)}
              >
                {scale}x
              </button>
            ))}
          </div>
        </div>

        {/* Shadow Maps Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Real-time PBR Shadows:</span>
          <button
            className={`btn-secondary ${shadowsEnabled ? 'active' : ''}`}
            style={{ height: '24px', fontSize: '0.7rem', padding: '0 8px', color: shadowsEnabled ? '#34d399' : 'var(--text-muted)' }}
            onClick={() => onToggleShadows(!shadowsEnabled)}
          >
            {shadowsEnabled ? 'Enabled' : 'Disabled (Saves GPU)'}
          </button>
        </div>
      </div>
    </div>
  );
}
