import React from 'react';
import { X, Info, BookOpen, AlertCircle, Compass } from 'lucide-react';
import { ANATOMY_DETAILS } from '../../data/anatomyData';

export default function AnatomyInspector({
  selectedAnatomy,
  onClose,
}) {
  if (!selectedAnatomy) return null;

  const { key, label } = selectedAnatomy;
  const details = ANATOMY_DETAILS[key] || {
    name: label || 'Anatomical Structure',
    type: 'Musculoskeletal Node',
    region: 'Kinetic Chain',
    function: 'Maintains biomechanical posture integrity and transmits ground reaction forces.',
    postureRelevance: 'Contributes to multi-planar static and dynamic balance.',
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        width: '380px',
        maxHeight: '480px',
        overflowY: 'auto',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--accent-cyan-glow)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.25)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span className="badge badge-normal" style={{ marginBottom: '6px', fontSize: '0.7rem' }}>
            {details.type || 'Anatomical Unit'}
          </span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {details.name}
          </h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
            {details.region}
          </div>
        </div>

        <button className="btn-icon" onClick={onClose} style={{ borderRadius: '50%' }}>
          <X size={16} />
        </button>
      </div>

      {/* Origin & Insertion (If available) */}
      {details.origin && (
        <div className="glass-card" style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
            Origin:
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {details.origin}
          </div>

          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
            Insertion:
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {details.insertion}
          </div>
        </div>
      )}

      {/* Biomechanical Function */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          <Compass size={14} color="var(--accent-cyan)" />
          Primary Biomechanical Function
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {details.function}
        </p>
      </div>

      {/* Postural Relevance */}
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
          <AlertCircle size={14} />
          Postural Dysfunctions & Compensations
        </div>
        <p style={{ fontSize: '0.78rem', color: '#fca5a5', lineHeight: 1.45 }}>
          {details.postureRelevance}
        </p>
      </div>
    </div>
  );
}
