import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RealisticAnatomyEngine } from './RealisticAnatomyLoader';
import BiomechanicalAnalysisHUD from '../UI/BiomechanicalAnalysisHUD';
import { Camera, Maximize2, RotateCcw, Eye, Layers, Zap, Info, Loader2, Sparkles } from 'lucide-react';

/**
 * Hyper-Realistic 3D Anatomy Viewport Component
 */
export default function AnatomyViewer({
  postureParams,
  overactiveMuscles = [],
  underactiveMuscles = [],
  displayMode = 'all',
  showPlumbLine = true,
  cameraView = 'front',
  onSelectAnatomy = null,
  modelType = 'full_atlas',
  vertexRatio = 0.5,
  pixelRatioScale = 1.0,
  shadowsEnabled = true,
  onStatsUpdate = null,
}) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hoveredObjectRef = useRef(null);

  const [hoveredTag, setHoveredTag] = useState(null);
  const [loadState, setLoadState] = useState({ progress: 0, status: 'Initializing 3D Medical Engine...', ready: false });
  const [showVectors, setShowVectors] = useState(true);

  // ==========================================
  // 1. INITIALIZE THREE.JS & REALISTIC ANATOMY
  // ==========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080d);
    scene.fog = new THREE.FogExp2(0x06080d, 0.05);
    sceneRef.current = scene;

    // CAMERA (Calibrated for full human standing figure)
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.05, 2.7);
    cameraRef.current = camera;

    // RENDERER (PBR Studio Pipeline)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatioScale);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ORBIT CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.0, 0); // Focus at center of gravity
    controls.minDistance = 0.5;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.12;
    controlsRef.current = controls;

    // MEDICAL STUDIO LIGHTING RIG
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 1.0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(3.0, 4.0, 3.0);
    keyLight.castShadow = shadowsEnabled;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    fillLight.position.set(-3.0, 2.0, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    rimLight.position.set(0, 3.0, -3.5);
    scene.add(rimLight);

    const frontFill = new THREE.DirectionalLight(0xffffff, 0.5);
    frontFill.position.set(0, 0.5, 3.0);
    scene.add(frontFill);

    // GROUND REFERENCE GRID
    const grid = new THREE.GridHelper(6, 20, 0x0284c7, 0x1e293b);
    grid.position.y = -0.95;
    scene.add(grid);

    // GROUND SHADOW RECEIVER
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.ShadowMaterial({ opacity: 0.45 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.95;
    shadowPlane.receiveShadow = shadowsEnabled;
    scene.add(shadowPlane);

    // INSTANTIATE REALISTIC ANATOMY ENGINE
    const engine = new RealisticAnatomyEngine(
      scene,
      (progress, status) => {
        setLoadState({ progress, status, ready: false });
      },
      () => {
        setLoadState({ progress: 100, status: 'Ready', ready: true });
        const stats = engine.setVertexResolution(vertexRatio);
        if (onStatsUpdate) onStatsUpdate(stats);
      },
      modelType
    );
    engineRef.current = engine;

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // RAYCASTING FOR INTERACTIVITY
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
      if (!engine.isReady || !engine.interactiveObjects.length) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(engine.interactiveObjects, false);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        hoveredObjectRef.current = target;
        setHoveredTag({
          name: target.userData.labelName || 'Anatomical Structure',
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 15,
        });
        document.body.style.cursor = 'pointer';
      } else {
        hoveredObjectRef.current = null;
        setHoveredTag(null);
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = () => {
      if (!engine.isReady) return;
      if (hoveredObjectRef.current && onSelectAnatomy) {
        const { anatomyKey, labelName } = hoveredObjectRef.current.userData;
        onSelectAnatomy({
          key: anatomyKey,
          label: labelName,
        });
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // ANIMATION LOOP
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (engine.overlays && engine.cachedPostureParams) {
        engine.overlays.update(engine.cachedPostureParams, delta);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      engine.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ==========================================
  // 2. REACTIVE UPDATES: POSTURE KINEMATICS & MODEL SWITCHING
  // ==========================================
  useEffect(() => {
    if (engineRef.current && engineRef.current.isReady) {
      engineRef.current.switchModel(modelType);
    }
  }, [modelType]);

  useEffect(() => {
    if (engineRef.current && postureParams) {
      engineRef.current.updatePosture(postureParams);
    }
  }, [postureParams]);

  // ==========================================
  // 3. REACTIVE UPDATES: VERTEX RESOLUTION & GPU SCALING
  // ==========================================
  useEffect(() => {
    if (engineRef.current && engineRef.current.isReady) {
      const stats = engineRef.current.setVertexResolution(vertexRatio);
      if (onStatsUpdate) onStatsUpdate(stats);
    }
  }, [vertexRatio]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setPixelRatio(pixelRatioScale);
    }
  }, [pixelRatioScale]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = shadowsEnabled;
    }
  }, [shadowsEnabled]);

  // ==========================================
  // 4. REACTIVE UPDATES: MUSCLE HEATMAP
  // ==========================================
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateMuscleHeatmap(overactiveMuscles, underactiveMuscles);
    }
  }, [overactiveMuscles, underactiveMuscles]);

  // ==========================================
  // 5. REACTIVE UPDATES: DISPLAY MODE
  // ==========================================
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDisplayMode(displayMode);
      engineRef.current.updateMuscleHeatmap(overactiveMuscles, underactiveMuscles);
    }
  }, [displayMode, overactiveMuscles, underactiveMuscles]);

  // ==========================================
  // 6. REACTIVE UPDATES: PLUMB LINE & 3D VECTORS
  // ==========================================
  useEffect(() => {
    if (engineRef.current && engineRef.current.plumbLineGroup) {
      engineRef.current.plumbLineGroup.visible = showPlumbLine;
    }
  }, [showPlumbLine]);

  useEffect(() => {
    if (engineRef.current && engineRef.current.overlays) {
      engineRef.current.overlays.setVisible(showVectors);
    }
  }, [showVectors]);

  // ==========================================
  // 6. CAMERA PRESETS & POSITIONING
  // ==========================================
  const setCameraPreset = useCallback((preset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    switch (preset) {
      case 'front':
        cam.position.set(0, 0.05, 2.7);
        ctrl.target.set(0, 0.0, 0);
        break;
      case 'side':
        cam.position.set(2.7, 0.05, 0);
        ctrl.target.set(0, 0.0, 0);
        break;
      case 'back':
        cam.position.set(0, 0.05, -2.7);
        ctrl.target.set(0, 0.0, 0);
        break;
      case 'pelvis':
        cam.position.set(0.5, 0.02, 1.15);
        ctrl.target.set(0, 0.0, 0);
        break;
      case 'spine':
        cam.position.set(1.2, 0.25, 0.85);
        ctrl.target.set(0, 0.25, 0);
        break;
      case 'feet':
        cam.position.set(0.5, -0.65, 0.9);
        ctrl.target.set(0, -0.75, 0);
        break;
      case 'left_knee':
        cam.position.set(-0.45, -0.38, 0.85);
        ctrl.target.set(-0.12, -0.42, 0);
        break;
      case 'left_foot':
        cam.position.set(-0.35, -0.75, 0.75);
        ctrl.target.set(-0.12, -0.85, 0.05);
        break;
      case 'right_foot':
        cam.position.set(0.35, -0.75, 0.75);
        ctrl.target.set(0.12, -0.85, 0.05);
        break;
      case 'right_knee':
        cam.position.set(0.45, -0.38, 0.85);
        ctrl.target.set(0.12, -0.42, 0);
        break;
      case 'jaw':
        cam.position.set(0.32, 0.72, 0.62);
        ctrl.target.set(0, 0.68, 0.04);
        break;
      default:
        cam.position.set(0, 0.05, 2.7);
        ctrl.target.set(0, 0.0, 0);
    }
    ctrl.update();
  }, []);

  useEffect(() => {
    if (cameraView) {
      setCameraPreset(cameraView);
    }
  }, [cameraView, setCameraPreset]);

  // Capture High-Res Screenshot
  const handleCaptureScreenshot = () => {
    if (!rendererRef.current) return;
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `BioAlign-Realistic-Anatomy-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Three.js Canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Live Biomechanical Telemetry HUD (Upper Left) */}
      <BiomechanicalAnalysisHUD
        postureParams={postureParams}
        onToggleVectors={() => setShowVectors(!showVectors)}
        showVectors={showVectors}
      />

      {/* Loading Progress Overlay */}
      {!loadState.ready && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(6, 8, 13, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 0 30px rgba(56, 189, 248, 0.5)',
            }}
          >
            <Loader2 size={28} color="#ffffff" className="spin-slow" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
            Loading Realistic Human Musculoskeletal System
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '14px' }}>
            {loadState.status}
          </p>
          <div
            style={{
              width: '240px',
              height: '6px',
              backgroundColor: '#1e293b',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${loadState.progress}%`,
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 10px #38bdf8',
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', marginTop: '6px' }}>
            {loadState.progress}%
          </span>
        </div>
      )}

      {/* Floating 3D Hover Tag */}
      {hoveredTag && (
        <div
          className="annotation-tag"
          style={{
            left: `${hoveredTag.x}px`,
            top: `${hoveredTag.y}px`,
          }}
        >
          <span style={{ color: 'var(--accent-cyan)' }}>✦</span> {hoveredTag.name}
        </div>
      )}

      {/* Viewport Control Bar Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 20,
        }}
      >
        <button
          className="btn-icon"
          title="Reset Camera Target"
          onClick={() => setCameraPreset('front')}
        >
          <RotateCcw size={16} />
        </button>

        <button
          className="btn-icon"
          title="Capture High-Res Screenshot"
          onClick={handleCaptureScreenshot}
        >
          <Camera size={16} />
        </button>
      </div>

      {/* Quick Camera Angle Bar (Bottom Left of Canvas) */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 20,
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
          VIEW:
        </span>
        <button
          className={`btn-icon ${cameraView === 'front' ? 'active' : ''}`}
          style={{ height: '28px', width: 'auto', padding: '0 8px', fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => setCameraPreset('front')}
        >
          Front
        </button>
        <button
          className={`btn-icon ${cameraView === 'side' ? 'active' : ''}`}
          style={{ height: '28px', width: 'auto', padding: '0 8px', fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => setCameraPreset('side')}
        >
          Side (Sagittal)
        </button>
        <button
          className={`btn-icon ${cameraView === 'pelvis' ? 'active' : ''}`}
          style={{ height: '28px', width: 'auto', padding: '0 8px', fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => setCameraPreset('pelvis')}
        >
          Pelvis
        </button>
        <button
          className={`btn-icon ${cameraView === 'right_knee' ? 'active' : ''}`}
          style={{ height: '28px', width: 'auto', padding: '0 8px', fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => setCameraPreset('right_knee')}
        >
          R Knee & Shin
        </button>
        <button
          className={`btn-icon ${cameraView === 'right_foot' ? 'active' : ''}`}
          style={{ height: '28px', width: 'auto', padding: '0 8px', fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => setCameraPreset('right_foot')}
        >
          R Foot Arch
        </button>
        <button
          className={`btn-icon ${cameraView === 'jaw' ? 'active' : ''}`}
          style={{ height: '28px', width: 'auto', padding: '0 8px', fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => setCameraPreset('jaw')}
        >
          Jaw & Neck
        </button>
      </div>

      {/* Live Biomechanical Telemetry HUD (Collapsible Pill) */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 20 }}>
        <BiomechanicalAnalysisHUD
          postureParams={postureParams}
          showVectors={showVectors}
          onToggleVectors={() => {
            const next = !showVectors;
            setShowVectors(next);
            if (engineRef.current && engineRef.current.overlays) {
              engineRef.current.overlays.setVisible(next);
            }
          }}
        />
      </div>

      {/* Anatomy Interaction Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '56px',
          left: '16px',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          zIndex: 15,
        }}
      >
        <Info size={13} color="var(--accent-cyan)" />
        Click any bone or muscle to inspect biomechanics
      </div>
    </div>
  );
}
