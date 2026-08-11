import React, { useState, useCallback } from 'react';
import AnatomyViewer from './components/ThreeViewport/AnatomyViewer';
import { POSTURE_CONDITIONS } from './data/postureConditions';
import { KineticChainSolver } from './utils/KineticChainSolver';

/**
 * BioAlign3D - Hyper-Realistic Musculoskeletal Simulation
 * Full-screen canvas with closed-chain kinetic physics engine
 */
export default function App() {
  const [postureParams, setPostureParams] = useState(POSTURE_CONDITIONS.neutral.parameters);
  const [kineticMode, setKineticMode] = useState('foot_ascending'); // 'foot_ascending' | 'pelvis_rooted' | 'manual'

  // Handle Parameter Changes & Closed-Chain Kinetic Propagation
  const handleParamChange = useCallback((key, value) => {
    setPostureParams((prev) => {
      const updated = { ...prev, [key]: value };

      if (kineticMode !== 'manual') {
        const solved = KineticChainSolver.solveKineticChain(updated, kineticMode);
        return { ...updated, ...solved };
      }

      return updated;
    });
  }, [kineticMode]);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#06080d' }}>
      <AnatomyViewer
        postureParams={postureParams}
        onParamChange={handleParamChange}
        kineticMode={kineticMode}
        onKineticModeChange={setKineticMode}
      />
    </main>
  );
}
