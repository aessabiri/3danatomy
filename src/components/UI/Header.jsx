import React from 'react';
import { Activity, Layers, Eye, Dumbbell, ShieldAlert, Sparkles, UserCheck, Cpu } from 'lucide-react';

export default function Header({
  displayMode,
  setDisplayMode,
  showPlumbLine,
  setShowPlumbLine,
  onOpenExercises,
  onToggleAyoub,
  isAyoubActive,
  hasActiveProtocol,
  isGPUOpen,
  onToggleGPU,
  vertexRatio = 0.5,
  geometryStats,
  modelType = 'full_atlas',
  setModelType,
}) {
  return (
    <header
      className="glass-panel"
      style={{
        height: '64px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        zIndex: 30,
        position: 'relative',
      }}
    >
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
          }}
        >
          <Activity size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              BioAlign<span style={{ color: 'var(--accent-cyan)' }}>3D</span>
            </h1>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                textTransform: 'uppercase',
              }}
            >
              Biomechanics Lab
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Musculoskeletal Postural Misalignment & Corrective Exercise Simulator
          </p>
        </div>
      </div>

      {/* Center Display Layer & Model Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Model Atlas Selector */}
        <select
          value={modelType}
          onChange={(e) => setModelType(e.target.value)}
          className="glass-card"
          style={{
            height: '38px',
            padding: '0 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Switch Anatomical Model Dataset"
        >
          <option value="full_atlas" style={{ background: '#0f172a', color: '#f8fafc' }}>
            🧬 Full Musculoskeletal Atlas
          </option>
          <option value="lumc_skeleton" style={{ background: '#0f172a', color: '#f8fafc' }}>
            ⚡ LUMC Clinical Skeleton (Fast 3.2MB)
          </option>
          <option value="lumc_lower_limb" style={{ background: '#0f172a', color: '#f8fafc' }}>
            🦵 LUMC Lower-Limb & Foot Joint Deep-Dive
          </option>
        </select>

        {/* Display Layer Buttons */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            gap: '4px',
          }}
        >
          <button
            className={`btn-icon ${displayMode === 'all' ? 'active' : ''}`}
            style={{ width: 'auto', padding: '0 10px', height: '30px', fontSize: '0.75rem', fontWeight: 600 }}
            onClick={() => setDisplayMode('all')}
            title="Full Musculoskeletal View"
          >
            <Layers size={14} />
            Full Anatomy
          </button>

          <button
            className={`btn-icon ${displayMode === 'skeleton' ? 'active' : ''}`}
            style={{ width: 'auto', padding: '0 10px', height: '30px', fontSize: '0.75rem', fontWeight: 600 }}
            onClick={() => setDisplayMode('skeleton')}
            title="Skeletal System Only"
          >
            Skeletal Bones
          </button>

          <button
            className={`btn-icon ${displayMode === 'muscles' ? 'active' : ''}`}
            style={{ width: 'auto', padding: '0 10px', height: '30px', fontSize: '0.75rem', fontWeight: 600 }}
            onClick={() => setDisplayMode('muscles')}
            title="Muscles & Tension Heatmap"
          >
            Muscle Heatmap
          </button>

          <button
            className={`btn-icon ${displayMode === 'xray' ? 'active' : ''}`}
            style={{ width: 'auto', padding: '0 10px', height: '30px', fontSize: '0.75rem', fontWeight: 600 }}
            onClick={() => setDisplayMode('xray')}
            title="Translucent X-Ray Depth View"
          >
            <Sparkles size={14} />
            X-Ray Mode
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* AYOUB PERSONAL CASE JOURNEY TOGGLE BUTTON */}
        <button
          onClick={onToggleAyoub}
          className={`btn ${isAyoubActive ? 'btn-primary pulse-glow' : 'btn-secondary'}`}
          style={{
            height: '36px',
            padding: '0 14px',
            fontSize: '0.825rem',
            fontWeight: 800,
            border: isAyoubActive ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.4)',
            background: isAyoubActive
              ? 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)'
              : 'rgba(14, 165, 233, 0.15)',
            color: '#ffffff',
            boxShadow: isAyoubActive ? '0 0 20px rgba(56, 189, 248, 0.6)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
          title="View Ayoub's 7-Stage Chronological Trauma-to-Compensation Story"
        >
          <Sparkles size={16} color={isAyoubActive ? '#ffffff' : '#38bdf8'} />
          <span>★ Ayoub's Story</span>
        </button>

        {/* GPU & Vertex Count Performance Saver Toggle */}
        <button
          className={`btn-secondary ${isGPUOpen ? 'active' : ''}`}
          style={{
            height: '36px',
            padding: '0 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: isGPUOpen ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            color: vertexRatio <= 0.4 ? '#34d399' : vertexRatio >= 0.9 ? '#f59e0b' : 'var(--text-primary)',
          }}
          onClick={onToggleGPU}
          title="Adjust Vertex Count, Resolution & GPU Power Saving"
        >
          <Cpu size={14} color={vertexRatio <= 0.4 ? '#34d399' : 'var(--accent-cyan)'} />
          <span>{Math.round(vertexRatio * 100)}% Verts</span>
        </button>

        {/* Plumb Line Toggle */}
        <button
          className={`btn-secondary ${showPlumbLine ? 'btn-icon active' : ''}`}
          style={{
            height: '36px',
            padding: '0 12px',
            fontSize: '0.8rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            border: showPlumbLine ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
            color: showPlumbLine ? '#34d399' : 'var(--text-secondary)',
          }}
          onClick={() => setShowPlumbLine(!showPlumbLine)}
          title="Toggle Gravity Plumb Reference Line"
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: showPlumbLine ? '#34d399' : '#64748b',
              boxShadow: showPlumbLine ? '0 0 8px #34d399' : 'none',
            }}
          />
          Plumb Line
        </button>

        {/* Corrective Exercise Prescription Button */}
        <button
          className="btn btn-accent"
          onClick={onOpenExercises}
          style={{ height: '36px', padding: '0 14px', fontSize: '0.825rem' }}
        >
          <Dumbbell size={16} />
          Exercises
        </button>
      </div>
    </header>
  );
}
