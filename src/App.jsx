import React, { useState } from 'react';
import Header from './components/UI/Header';
import AnatomyViewer from './components/ThreeViewport/AnatomyViewer';
import PostureControlPanel from './components/UI/PostureControlPanel';
import MuscleImbalancePanel from './components/UI/MuscleImbalancePanel';
import CorrectiveExerciseModal from './components/UI/CorrectiveExerciseModal';
import AnatomyInspector from './components/UI/AnatomyInspector';
import AyoubJourneyPlayer from './components/UI/AyoubJourneyPlayer';
import GPUPerformanceControl from './components/UI/GPUPerformanceControl';
import { POSTURE_CONDITIONS } from './data/postureConditions';
import { KineticChainSolver } from './utils/KineticChainSolver';
import { Sliders, Activity, X } from 'lucide-react';

export default function App() {
  const [selectedConditionId, setSelectedConditionId] = useState('neutral');
  const [postureParams, setPostureParams] = useState(POSTURE_CONDITIONS.neutral.parameters);
  const [kineticMode, setKineticMode] = useState('foot_ascending'); // 'foot_ascending' | 'pelvis_rooted' | 'manual'
  const [displayMode, setDisplayMode] = useState('all');
  const [showPlumbLine, setShowPlumbLine] = useState(true);
  const [cameraView, setCameraView] = useState('front');
  const [selectedAnatomy, setSelectedAnatomy] = useState(null);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isAyoubActive, setIsAyoubActive] = useState(false); // Disabled by default

  // Anatomical Model Atlas Selection (Default to LUMC Clinical Skeleton for crisp university anatomy & 60 FPS)
  const [modelType, setModelType] = useState('lumc_skeleton'); // 'lumc_skeleton', 'full_atlas', 'lumc_lower_limb'

  // GPU & Vertex Decimation States (Default to 1.0 for 100% full crisp anatomical detail)
  const [vertexRatio, setVertexRatio] = useState(1.0);
  const [pixelRatioScale, setPixelRatioScale] = useState(1.0);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [isGPUModalOpen, setIsGPUModalOpen] = useState(false);
  const [geometryStats, setGeometryStats] = useState({ totalVertices: 120000, totalTriangles: 240000 });

  // Collapsible drawers (Closed by default for clean distraction-free 3D viewing!)
  const [showDiagnosticsDrawer, setShowDiagnosticsDrawer] = useState(false);
  const [showImbalanceDrawer, setShowImbalanceDrawer] = useState(false);

  const [ayoubStageData, setAyoubStageData] = useState(null);

  const activeCondition = POSTURE_CONDITIONS[selectedConditionId] || POSTURE_CONDITIONS.neutral;

  const activeOveractiveMuscles = isAyoubActive && ayoubStageData?.overactive
    ? ayoubStageData.overactive
    : activeCondition.overactiveMuscles || [];

  const activeUnderactiveMuscles = isAyoubActive && ayoubStageData?.underactive
    ? ayoubStageData.underactive
    : activeCondition.underactiveMuscles || [];

  const handleSelectCondition = (conditionId) => {
    setSelectedConditionId(conditionId);
    setIsAyoubActive(conditionId === 'ayoub_case');
    const cond = POSTURE_CONDITIONS[conditionId];
    if (cond) {
      setPostureParams({ ...cond.parameters });
      if (conditionId === 'anterior_pelvic_tilt' || conditionId === 'upper_crossed') {
        setCameraView('side');
      } else if (conditionId === 'dropped_hip' || conditionId === 'scoliosis_c') {
        setCameraView('back');
      } else if (conditionId === 'pronation_distortion') {
        setCameraView('feet');
      } else {
        setCameraView('front');
      }
    }
  };

  const handleParamChange = (paramKey, value) => {
    setPostureParams((prev) => {
      const updated = { ...prev, [paramKey]: value };

      if (kineticMode === 'foot_ascending' && paramKey === 'rightFootPronation') {
        return KineticChainSolver.solveKineticChain(updated, 'foot_ascending');
      }

      if (kineticMode === 'pelvis_rooted' && (paramKey === 'pelvisDrop' || paramKey === 'pelvisTilt')) {
        return KineticChainSolver.solveKineticChain(updated, 'pelvis_rooted');
      }

      return updated;
    });
  };

  const handleResetPosture = () => {
    setIsAyoubActive(false);
    setSelectedConditionId('neutral');
    setPostureParams({ ...POSTURE_CONDITIONS.neutral.parameters });
    setCameraView('front');
  };

  const handleSelectMuscle = (muscleId) => {
    setSelectedAnatomy({
      key: muscleId,
      label: muscleId.replace(/_/g, ' ').toUpperCase(),
    });
  };

  const handleAyoubStageChange = (stage) => {
    setAyoubStageData(stage);
    if (stage.parameters) {
      setPostureParams({ ...stage.parameters });
    }
    if (stage.cameraPreset) {
      setCameraView(stage.cameraPreset);
    }
  };

  const handleToggleAyoub = () => {
    const nextState = !isAyoubActive;
    setIsAyoubActive(nextState);
    if (nextState) {
      setSelectedConditionId('ayoub_case');
      setPostureParams({ ...POSTURE_CONDITIONS.ayoub_case.parameters });
      setCameraView('front');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top Navigation Header */}
      <Header
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        showPlumbLine={showPlumbLine}
        setShowPlumbLine={setShowPlumbLine}
        onOpenExercises={() => setIsExerciseModalOpen(true)}
        onToggleAyoub={handleToggleAyoub}
        isAyoubActive={isAyoubActive}
        hasActiveProtocol={Boolean(activeCondition.correctiveProtocol)}
        isGPUOpen={isGPUModalOpen}
        onToggleGPU={() => setIsGPUModalOpen(!isGPUModalOpen)}
        vertexRatio={vertexRatio}
        geometryStats={geometryStats}
        modelType={modelType}
        setModelType={setModelType}
      />

      {/* Main Full-Viewport 3D Workspace */}
      <main style={{ display: 'flex', flex: 1, height: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden' }}>
        {/* Full-Screen 3D Anatomy Viewport */}
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <AnatomyViewer
            postureParams={postureParams}
            onParamChange={handleParamChange}
            overactiveMuscles={activeOveractiveMuscles}
            underactiveMuscles={activeUnderactiveMuscles}
            displayMode={displayMode}
            showPlumbLine={showPlumbLine}
            cameraView={cameraView}
            onSelectAnatomy={(item) => setSelectedAnatomy(item)}
            modelType={modelType}
            vertexRatio={vertexRatio}
            pixelRatioScale={pixelRatioScale}
            shadowsEnabled={shadowsEnabled}
            onStatsUpdate={(stats) => setGeometryStats(stats)}
          />

          {/* Floating Anatomy Details Inspector */}
          <AnatomyInspector
            selectedAnatomy={selectedAnatomy}
            onClose={() => setSelectedAnatomy(null)}
          />

          {/* Ayoub's Chronological Animated Journey HUD */}
          <AyoubJourneyPlayer
            isActive={isAyoubActive}
            onClose={() => setIsAyoubActive(false)}
            onStageChange={handleAyoubStageChange}
            onOpenExercises={() => setIsExerciseModalOpen(true)}
          />

          {/* GPU & Vertex Resolution Control Drawer */}
          <GPUPerformanceControl
            isOpen={isGPUModalOpen}
            onClose={() => setIsGPUModalOpen(false)}
            vertexRatio={vertexRatio}
            onVertexRatioChange={setVertexRatio}
            pixelRatioScale={pixelRatioScale}
            onPixelRatioScaleChange={setPixelRatioScale}
            shadowsEnabled={shadowsEnabled}
            onToggleShadows={setShadowsEnabled}
            geometryStats={geometryStats}
          />
        </div>

        {/* Floating Toggle: Left Diagnostics Sliders */}
        <button
          onClick={() => setShowDiagnosticsDrawer(!showDiagnosticsDrawer)}
          className={`btn-secondary ${showDiagnosticsDrawer ? 'active' : ''}`}
          style={{
            position: 'absolute',
            top: '64px',
            left: '16px',
            zIndex: 30,
            fontSize: '0.75rem',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          }}
        >
          <Sliders size={13} color="var(--accent-cyan)" />
          <span>{showDiagnosticsDrawer ? 'Hide Sliders' : 'Kinetic Sliders'}</span>
        </button>

        {/* Floating Toggle: Right Muscle Imbalances */}
        <button
          onClick={() => setShowImbalanceDrawer(!showImbalanceDrawer)}
          className={`btn-secondary ${showImbalanceDrawer ? 'active' : ''}`}
          style={{
            position: 'absolute',
            top: '64px',
            right: '16px',
            zIndex: 30,
            fontSize: '0.75rem',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          }}
        >
          <Activity size={13} color="#f87171" />
          <span>{showImbalanceDrawer ? 'Hide Muscles' : 'Muscle Imbalances'}</span>
        </button>

        {/* Collapsible Left Diagnostics Drawer */}
        {showDiagnosticsDrawer && (
          <div
            style={{
              position: 'absolute',
              top: '110px',
              left: '16px',
              zIndex: 35,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              border: '1px solid var(--border-medium)',
            }}
          >
            <PostureControlPanel
              selectedConditionId={selectedConditionId}
              onSelectCondition={handleSelectCondition}
              postureParams={postureParams}
              onParamChange={handleParamChange}
              onResetPosture={handleResetPosture}
              kineticMode={kineticMode}
              onKineticModeChange={setKineticMode}
            />
          </div>
        )}

        {/* Collapsible Right Muscle Imbalance Drawer */}
        {showImbalanceDrawer && (
          <div
            style={{
              position: 'absolute',
              top: '110px',
              right: '16px',
              zIndex: 35,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              border: '1px solid var(--border-medium)',
            }}
          >
            <MuscleImbalancePanel
              condition={isAyoubActive && ayoubStageData ? {
                ...activeCondition,
                name: ayoubStageData.title,
                kineticChainImpact: ayoubStageData.cascadeMechanism,
                overactiveMuscles: ayoubStageData.overactive,
                underactiveMuscles: ayoubStageData.underactive,
              } : activeCondition}
              postureParams={postureParams}
              onSelectMuscle={handleSelectMuscle}
            />
          </div>
        )}
      </main>

      {/* Corrective Exercise Prescription Modal */}
      {isExerciseModalOpen && (
        <CorrectiveExerciseModal
          protocol={POSTURE_CONDITIONS.ayoub_case.correctiveProtocol}
          conditionName={isAyoubActive ? "Ayoub's Ground-Up Kinetic Chain" : activeCondition.name}
          onClose={() => setIsExerciseModalOpen(false)}
        />
      )}
    </div>
  );
}
