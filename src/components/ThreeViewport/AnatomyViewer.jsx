import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { RealisticAnatomyEngine } from './RealisticAnatomyLoader';
import BiomechanicalAnalysisHUD from '../UI/BiomechanicalAnalysisHUD';
import {
  Camera,
  RotateCcw,
  Zap,
  Info,
  Loader2,
  Move3d,
  Disc,
  Footprints,
  Maximize2,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

/**
 * Hyper-Realistic 3D Anatomy Viewport Component with Direct On-Canvas Bone Rotation Controls
 */
export default function AnatomyViewer({
  postureParams,
  onParamChange = null,
  overactiveMuscles = [],
  underactiveMuscles = [],
  displayMode = 'all',
  showPlumbLine = true,
  cameraView = 'front',
  onSelectAnatomy = null,
  modelType = 'full_atlas',
  vertexRatio = 1.0,
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
  const transformControlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hoveredObjectRef = useRef(null);

  // Joint proxy nodes map for TransformControls attachment
  const jointProxiesRef = useRef({});

  const [activeJointKey, setActiveJointKey] = useState('pelvis');
  const [showTransformGizmo, setShowTransformGizmo] = useState(true);
  const [hoveredTag, setHoveredTag] = useState(null);
  const [loadState, setLoadState] = useState({ progress: 0, status: 'Initializing 3D Medical Engine...', ready: false });
  const [showVectors, setShowVectors] = useState(true);

  // Joint definitions for on-canvas bone rotation
  const jointDefinitions = [
    { key: 'pelvis', label: 'Pelvic Girdle (ASIS / Sacrum)', icon: Disc, pos: new THREE.Vector3(0, 0.0, 0) },
    { key: 'right_tibia', label: 'Right Tibia (Shin Torsion)', icon: Disc, pos: new THREE.Vector3(0.08, -0.62, 0.01) },
    { key: 'right_foot', label: 'Right Foot Arch (Subtalar)', icon: Footprints, pos: new THREE.Vector3(0.09, -0.88, 0.05) },
    { key: 'right_femur', label: 'Right Femur & Knee (Valgus)', icon: Disc, pos: new THREE.Vector3(0.10, -0.42, 0) },
    { key: 'lumbar', label: 'Lumbar Spine (L1–L5)', icon: Disc, pos: new THREE.Vector3(0, 0.16, -0.02) },
    { key: 'thoracic', label: 'Thoracic Spine (Kyphosis)', icon: Disc, pos: new THREE.Vector3(0, 0.38, -0.04) },
    { key: 'cervical', label: 'Cervical & Head (FHP)', icon: Disc, pos: new THREE.Vector3(0, 0.65, 0.02) },
    { key: 'mandible', label: 'Mandible (Jaw Retraction)', icon: Disc, pos: new THREE.Vector3(0, 0.68, 0.06) },
    { key: 'left_tibia', label: 'Left Tibia (Shin)', icon: Disc, pos: new THREE.Vector3(-0.08, -0.62, 0.01) },
    { key: 'left_foot', label: 'Left Foot (Arch)', icon: Footprints, pos: new THREE.Vector3(-0.09, -0.88, 0.05) },
  ];

  // Helper to convert rad/deg
  const radToDeg = (r) => Math.round((r || 0) * (180 / Math.PI));
  const degToRad = (d) => d * (Math.PI / 180);

  // ==========================================
  // 1. INITIALIZE THREE.JS, SCENE & TRANSFORM CONTROLS
  // ==========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080d);
    scene.fog = new THREE.FogExp2(0x06080d, 0.05);
    sceneRef.current = scene;

    // CAMERA (Calibrated for full standing human figure)
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.05, 2.7);
    cameraRef.current = camera;

    // RENDERER
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
    controls.target.set(0, 0.0, 0);
    controls.minDistance = 0.5;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.12;
    controlsRef.current = controls;

    // TRANSFORM CONTROLS (Direct On-Canvas Bone Rotation Gizmo)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode('rotate');
    transformControls.size = 0.85;
    transformControls.space = 'local';
    scene.add(transformControls);
    transformControlsRef.current = transformControls;

    // Disable OrbitControls while dragging gizmo
    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });

    // Create Joint Proxy Objects in 3D Scene
    const proxyGroup = new THREE.Group();
    proxyGroup.name = 'JointRotationProxies';
    scene.add(proxyGroup);

    jointDefinitions.forEach((def) => {
      const proxy = new THREE.Group();
      proxy.name = `proxy_${def.key}`;
      proxy.position.copy(def.pos);
      proxyGroup.add(proxy);
      jointProxiesRef.current[def.key] = proxy;
    });

    // Handle TransformControls Change -> map back to Posture Parameters
    transformControls.addEventListener('change', () => {
      const currentAttached = transformControls.object;
      if (!currentAttached || !onParamChange) return;

      const jointKey = currentAttached.name.replace('proxy_', '');
      const rot = currentAttached.rotation;

      if (jointKey === 'pelvis') {
        onParamChange('pelvisTilt', rot.x);
        onParamChange('pelvisDrop', rot.z);
        onParamChange('pelvisRotation', rot.y);
      } else if (jointKey === 'right_foot') {
        onParamChange('rightFootPronation', rot.z);
      } else if (jointKey === 'right_tibia') {
        onParamChange('rightFootPronation', rot.y);
        onParamChange('rightKneeValgus', rot.z);
      } else if (jointKey === 'right_femur') {
        onParamChange('rightKneeValgus', -rot.z);
      } else if (jointKey === 'lumbar') {
        onParamChange('lumbarLordosis', -rot.x);
        onParamChange('spinalLateralBend', rot.z);
      } else if (jointKey === 'thoracic') {
        onParamChange('thoracicKyphosis', rot.x);
        onParamChange('spinalLateralBend', rot.z);
      } else if (jointKey === 'cervical' || jointKey === 'mandible') {
        onParamChange('cervicalForwardHead', Math.max(0, rot.x * 0.1));
      }
    });

    // Attach initial gizmo to pelvis proxy
    if (jointProxiesRef.current.pelvis) {
      transformControls.attach(jointProxiesRef.current.pelvis);
    }

    // LIGHTING
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 1.0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(3.0, 4.0, 3.0);
    keyLight.castShadow = shadowsEnabled;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
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

    // REALISTIC ANATOMY ENGINE INSTANCE
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
      if (hoveredObjectRef.current) {
        const { anatomyKey, labelName } = hoveredObjectRef.current.userData;

        // Auto-select corresponding bone joint for rotation
        if (anatomyKey.includes('tibialis') || anatomyKey.includes('tibia')) {
          handleSelectJoint('right_tibia');
        } else if (anatomyKey.includes('lumbar')) {
          handleSelectJoint('lumbar');
        } else if (anatomyKey.includes('thoracic')) {
          handleSelectJoint('thoracic');
        } else if (anatomyKey.includes('cervical')) {
          handleSelectJoint('cervical');
        } else if (anatomyKey.includes('pelvis') || anatomyKey.includes('gluteus')) {
          handleSelectJoint('pelvis');
        }

        if (onSelectAnatomy) {
          onSelectAnatomy({ key: anatomyKey, label: labelName });
        }
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
      transformControls.dispose();
      engine.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handle active joint selection and attach TransformControls
  const handleSelectJoint = (jointKey) => {
    setActiveJointKey(jointKey);
    const proxy = jointProxiesRef.current[jointKey];
    if (transformControlsRef.current && proxy) {
      transformControlsRef.current.attach(proxy);
      transformControlsRef.current.visible = showTransformGizmo;
    }
  };

  // Direct On-Canvas Rotation Step Buttons (+5 / -5 degrees)
  const handleStepRotate = (axis, deltaDeg) => {
    const deltaRad = degToRad(deltaDeg);
    const proxy = jointProxiesRef.current[activeJointKey];
    if (!proxy || !onParamChange) return;

    if (activeJointKey === 'pelvis') {
      if (axis === 'pitch') onParamChange('pelvisTilt', (postureParams.pelvisTilt || 0) + deltaRad);
      if (axis === 'roll') onParamChange('pelvisDrop', (postureParams.pelvisDrop || 0) + deltaRad);
      if (axis === 'yaw') onParamChange('pelvisRotation', (postureParams.pelvisRotation || 0) + deltaRad);
    } else if (activeJointKey === 'right_foot') {
      if (axis === 'roll') onParamChange('rightFootPronation', (postureParams.rightFootPronation || 0) + deltaRad);
    } else if (activeJointKey === 'right_tibia') {
      if (axis === 'yaw') onParamChange('rightFootPronation', (postureParams.rightFootPronation || 0) + deltaRad);
      if (axis === 'roll') onParamChange('rightKneeValgus', (postureParams.rightKneeValgus || 0) + deltaRad);
    } else if (activeJointKey === 'lumbar') {
      if (axis === 'pitch') onParamChange('lumbarLordosis', (postureParams.lumbarLordosis || 0) + deltaRad);
      if (axis === 'roll') onParamChange('spinalLateralBend', (postureParams.spinalLateralBend || 0) + deltaRad);
    } else if (activeJointKey === 'thoracic') {
      if (axis === 'pitch') onParamChange('thoracicKyphosis', (postureParams.thoracicKyphosis || 0) + deltaRad);
    } else if (activeJointKey === 'cervical' || activeJointKey === 'mandible') {
      if (axis === 'pitch') onParamChange('cervicalForwardHead', Math.max(0, (postureParams.cervicalForwardHead || 0) + deltaDeg * 0.002));
    }
  };

  // Reset selected joint
  const handleResetJoint = () => {
    const proxy = jointProxiesRef.current[activeJointKey];
    if (proxy) proxy.rotation.set(0, 0, 0);

    if (activeJointKey === 'pelvis') {
      onParamChange('pelvisTilt', 0);
      onParamChange('pelvisDrop', 0);
      onParamChange('pelvisRotation', 0);
    } else if (activeJointKey === 'right_foot') {
      onParamChange('rightFootPronation', 0);
    } else if (activeJointKey === 'right_tibia') {
      onParamChange('rightKneeValgus', 0);
      onParamChange('rightFootPronation', 0);
    } else if (activeJointKey === 'lumbar') {
      onParamChange('lumbarLordosis', 0);
      onParamChange('spinalLateralBend', 0);
    } else if (activeJointKey === 'thoracic') {
      onParamChange('thoracicKyphosis', 0);
    } else if (activeJointKey === 'cervical') {
      onParamChange('cervicalForwardHead', 0);
    }
  };

  // Keep proxy rotations in sync with postureParams
  useEffect(() => {
    const proxies = jointProxiesRef.current;
    if (proxies.pelvis) {
      proxies.pelvis.rotation.set(postureParams.pelvisTilt || 0, postureParams.pelvisRotation || 0, postureParams.pelvisDrop || 0);
    }
    if (proxies.right_foot) {
      proxies.right_foot.rotation.set(0, 0, postureParams.rightFootPronation || 0);
    }
    if (proxies.right_tibia) {
      proxies.right_tibia.rotation.set(0, -(postureParams.rightFootPronation || 0), postureParams.rightKneeValgus || 0);
    }
    if (proxies.lumbar) {
      proxies.lumbar.rotation.set(-(postureParams.lumbarLordosis || 0), 0, -(postureParams.spinalLateralBend || 0));
    }
    if (proxies.thoracic) {
      proxies.thoracic.rotation.set(postureParams.thoracicKyphosis || 0, 0, postureParams.spinalLateralBend || 0);
    }
  }, [postureParams]);

  // Toggle gizmo visibility
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.visible = showTransformGizmo;
    }
  }, [showTransformGizmo]);

  // Reactive Model Switching
  useEffect(() => {
    if (engineRef.current && engineRef.current.isReady) {
      engineRef.current.switchModel(modelType);
    }
  }, [modelType]);

  // Reactive Posture Update
  useEffect(() => {
    if (engineRef.current && postureParams) {
      engineRef.current.updatePosture(postureParams);
    }
  }, [postureParams]);

  // Reactive Vertex Decimation
  useEffect(() => {
    if (engineRef.current && engineRef.current.isReady) {
      const stats = engineRef.current.setVertexResolution(vertexRatio);
      if (onStatsUpdate) onStatsUpdate(stats);
    }
  }, [vertexRatio]);

  // Reactive Pixel Ratio
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setPixelRatio(pixelRatioScale);
    }
  }, [pixelRatioScale]);

  // Reactive Display Mode
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDisplayMode(displayMode);
    }
  }, [displayMode]);

  // Camera preset handler
  const setCameraPreset = (viewName) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    if (viewName === 'front') {
      camera.position.set(0, 0.05, 2.7);
      controls.target.set(0, 0.0, 0);
    } else if (viewName === 'side') {
      camera.position.set(2.6, 0.05, 0.2);
      controls.target.set(0, 0.0, 0);
    } else if (viewName === 'pelvis') {
      camera.position.set(0, 0.1, 1.3);
      controls.target.set(0, 0.0, 0);
    } else if (viewName === 'right_knee') {
      camera.position.set(0.25, -0.45, 1.1);
      controls.target.set(0.1, -0.5, 0);
    } else if (viewName === 'right_foot') {
      camera.position.set(0.2, -0.75, 0.7);
      controls.target.set(0.09, -0.85, 0.05);
    } else if (viewName === 'jaw') {
      camera.position.set(0.45, 0.65, 0.8);
      controls.target.set(0, 0.62, 0.04);
    }
    controls.update();
  };

  const handleCaptureScreenshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `BioAlign3D-${activeJointKey}-rotation.png`;
    link.href = dataUrl;
    link.click();
  };

  const activeJointDef = jointDefinitions.find((j) => j.key === activeJointKey) || jointDefinitions[0];

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        outline: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Loading Overlay */}
      {!loadState.ready && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#06080d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
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

      {/* DIRECT ON-CANVAS BONE ROTATION CONTROLLER (Top Center Floating HUD) */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 14px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          background: 'rgba(10, 15, 26, 0.92)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          zIndex: 25,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Move3d size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
            Rotate Bone:
          </span>
        </div>

        {/* Joint Selector Dropdown */}
        <select
          value={activeJointKey}
          onChange={(e) => handleSelectJoint(e.target.value)}
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#f8fafc',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 8px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {jointDefinitions.map((j) => (
            <option key={j.key} value={j.key}>
              {j.label}
            </option>
          ))}
        </select>

        {/* Quick Rotation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Pitch */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '1px 4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f87171', marginRight: '3px' }}>PITCH</span>
            <button onClick={() => handleStepRotate('pitch', -5)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 2px' }} title="Pitch -5°"><Minus size={11} /></button>
            <button onClick={() => handleStepRotate('pitch', 5)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 2px' }} title="Pitch +5°"><Plus size={11} /></button>
          </div>

          {/* Roll */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', padding: '1px 4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#38bdf8', marginRight: '3px' }}>ROLL</span>
            <button onClick={() => handleStepRotate('roll', -5)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0 2px' }} title="Roll -5°"><Minus size={11} /></button>
            <button onClick={() => handleStepRotate('roll', 5)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0 2px' }} title="Roll +5°"><Plus size={11} /></button>
          </div>

          {/* Yaw */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px', padding: '1px 4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24', marginRight: '3px' }}>YAW</span>
            <button onClick={() => handleStepRotate('yaw', -5)} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '0 2px' }} title="Yaw -5°"><Minus size={11} /></button>
            <button onClick={() => handleStepRotate('yaw', 5)} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '0 2px' }} title="Yaw +5°"><Plus size={11} /></button>
          </div>
        </div>

        {/* Reset Joint Button */}
        <button
          onClick={handleResetJoint}
          className="btn-secondary"
          style={{ fontSize: '0.7rem', padding: '3px 8px', height: '22px' }}
          title="Reset this bone to neutral"
        >
          <RotateCcw size={11} />
          Reset
        </button>

        {/* 3D Gizmo Toggle */}
        <button
          onClick={() => setShowTransformGizmo(!showTransformGizmo)}
          className={`btn-secondary ${showTransformGizmo ? 'active' : ''}`}
          style={{ fontSize: '0.7rem', padding: '3px 8px', height: '22px' }}
          title="Toggle 3D Rotation Gizmo on bone"
        >
          {showTransformGizmo ? 'Gizmo ON' : 'Gizmo OFF'}
        </button>
      </div>

      {/* Live Biomechanical Telemetry HUD (Collapsible Pill) */}
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

      {/* Top Right Viewport Controls */}
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

      {/* Quick Camera Angle Bar (Bottom Center-Left) */}
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
        Click any bone or use the top rotation gizmo to articulate joints
      </div>
    </div>
  );
}
