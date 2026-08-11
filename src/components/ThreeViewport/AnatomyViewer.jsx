import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { MedicalKinematicRig } from './MedicalKinematicRig';
import {
  RotateCcw,
  Camera,
  Layers,
  Zap,
  Footprints,
  Disc,
  Eye,
  EyeOff,
  Move3d,
  Plus,
  Minus,
  Info,
  Activity,
  Loader2,
} from 'lucide-react';

/**
 * Pure Full-Screen Medical Musculoskeletal Simulation Viewport
 * Powered by real clinical 3D medical assets (LUMC & Z-Anatomy),
 * 4 Anatomical Layers, Direct 3D Canvas Bone Rotation, and Closed-Chain Kinematic Reactions.
 */
export default function AnatomyViewer({
  postureParams,
  onParamChange,
  kineticMode = 'foot_ascending',
  onKineticModeChange,
}) {
  const containerRef = useRef(null);
  const rigRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const transformControlsRef = useRef(null);
  const animationFrameRef = useRef(null);

  const jointProxiesRef = useRef({});

  const [activeJointKey, setActiveJointKey] = useState('pelvis');
  const [showGizmo, setShowGizmo] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [hoveredTag, setHoveredTag] = useState(null);
  const [loadProgress, setLoadProgress] = useState({ progress: 0, status: 'Initializing Clinical Engine...', ready: false });

  // 4 Anatomical Layers
  const [layers, setLayers] = useState({
    skeleton: true,
    ligaments: true,
    muscles: true,
    nerves: true,
  });

  const radToDeg = (r) => Math.round((r || 0) * (180 / Math.PI));
  const degToRad = (d) => d * (Math.PI / 180);

  const jointDefinitions = [
    { key: 'pelvis', label: 'Pelvic Girdle (Sacrum & Ilium)', pos: new THREE.Vector3(0, 0.923, -0.050) },
    { key: 'right_femur', label: 'Right Hip & Femur (Thigh)', pos: new THREE.Vector3(-0.065, 0.875, -0.015) },
    { key: 'right_tibia', label: 'Right Knee & Tibia (Shin Torsion)', pos: new THREE.Vector3(-0.076, 0.434, -0.020) },
    { key: 'right_foot', label: 'Right Foot Arch (Subtalar Joint)', pos: new THREE.Vector3(-0.076, 0.080, -0.035) },
    { key: 'lumbar', label: 'Lumbar Spine (L1–L5 Vertebrae)', pos: new THREE.Vector3(0, 1.043, -0.029) },
    { key: 'thoracic', label: 'Thoracic Spine & Ribs (Kyphosis)', pos: new THREE.Vector3(0, 1.28, -0.040) },
    { key: 'cervical', label: 'Cervical Spine & Head (FHP)', pos: new THREE.Vector3(0, 1.50, -0.030) },
    { key: 'mandible', label: 'Mandible (TMJ Joint)', pos: new THREE.Vector3(0, 1.541, 0.015) },
    { key: 'left_femur', label: 'Left Hip & Femur', pos: new THREE.Vector3(0.065, 0.875, -0.015) },
    { key: 'left_tibia', label: 'Left Knee & Shin', pos: new THREE.Vector3(0.076, 0.434, -0.020) },
    { key: 'left_foot', label: 'Left Foot (Arch)', pos: new THREE.Vector3(0.076, 0.080, -0.035) },
  ];

  // =========================================================================
  // 1. INITIALIZE THREE.JS & MEDICAL KINEMATIC RIG
  // =========================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080d);
    scene.fog = new THREE.FogExp2(0x06080d, 0.035);
    sceneRef.current = scene;

    // 2. Camera (Full standing clinical posture framing)
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.90, 3.6);
    cameraRef.current = camera;

    // 3. High-Performance PBR Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.90, 0);
    controls.minDistance = 0.4;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.12;
    controlsRef.current = controls;

    // 5. Studio Medical Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 1.1);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(3.0, 4.5, 3.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    fillLight.position.set(-3.0, 2.5, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.5);
    rimLight.position.set(0, 3.5, -3.5);
    scene.add(rimLight);

    // Ground Grid & Soft Shadow
    const grid = new THREE.GridHelper(6, 24, 0x0284c7, 0x1e293b);
    grid.position.y = -0.05;
    scene.add(grid);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.ShadowMaterial({ opacity: 0.35 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.05;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 6. Medical Kinematic Rig Instance
    const rig = new MedicalKinematicRig(
      scene,
      (progress, status) => {
        setLoadProgress({ progress, status, ready: false });
      },
      () => {
        setLoadProgress({ progress: 100, status: 'Ready', ready: true });
      }
    );
    rigRef.current = rig;

    // 7. TransformControls (Direct Bone Rotation Gizmo)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode('rotate');
    transformControls.size = 0.85;
    transformControls.space = 'local';
    scene.add(transformControls);
    transformControlsRef.current = transformControls;

    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });

    // Create Joint Proxy Nodes for Gizmo Attachment
    const proxyGroup = new THREE.Group();
    proxyGroup.name = 'JointGizmoProxies';
    scene.add(proxyGroup);

    jointDefinitions.forEach((def) => {
      const proxy = new THREE.Group();
      proxy.name = `proxy_${def.key}`;
      proxy.position.copy(def.pos);
      proxyGroup.add(proxy);
      jointProxiesRef.current[def.key] = proxy;
    });

    transformControls.addEventListener('change', () => {
      const attached = transformControls.object;
      if (!attached || !onParamChange) return;

      const jointKey = attached.name.replace('proxy_', '');
      const rot = attached.rotation;

      if (jointKey === 'pelvis') {
        onParamChange('pelvisTilt', rot.x);
        onParamChange('pelvisDrop', rot.z);
        onParamChange('pelvisRotation', rot.y);
      } else if (jointKey === 'right_foot') {
        onParamChange('rightFootPronation', rot.z);
      } else if (jointKey === 'right_tibia') {
        onParamChange('rightFootPronation', -rot.y);
        onParamChange('rightKneeValgus', -rot.z);
      } else if (jointKey === 'right_femur') {
        onParamChange('rightKneeValgus', -rot.z);
      } else if (jointKey === 'lumbar') {
        onParamChange('lumbarLordosis', -rot.x);
        onParamChange('spinalLateralBend', -rot.z);
      } else if (jointKey === 'thoracic') {
        onParamChange('thoracicKyphosis', rot.x);
        onParamChange('spinalLateralBend', rot.z);
      } else if (jointKey === 'cervical' || jointKey === 'mandible') {
        onParamChange('cervicalForwardHead', Math.max(0, -rot.x * 0.02));
      }
    });

    if (jointProxiesRef.current.pelvis) {
      transformControls.attach(jointProxiesRef.current.pelvis);
    }

    // 8. Resize Observer
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

    // 9. Raycasting (Interactive Bone & Muscle Selection & Peeling)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
      if (!rig.interactiveObjects.length) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(rig.interactiveObjects, false);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        setHoveredTag({
          name: target.userData.labelName || 'Anatomical Structure',
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 15,
        });
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredTag(null);
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = () => {
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(rig.interactiveObjects, false);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        const u = target.userData;

        if (u.isMuscle) {
          setSelectedMuscle({
            id: u.muscleId,
            name: u.labelName,
          });
        }

        const raw = (u.labelName || '').toLowerCase();
        if (raw.includes('tibia') || raw.includes('fibula')) {
          handleSelectJoint('right_tibia');
        } else if (raw.includes('foot') || raw.includes('calcaneus') || raw.includes('talus')) {
          handleSelectJoint('right_foot');
        } else if (raw.includes('femur') || raw.includes('patella')) {
          handleSelectJoint('right_femur');
        } else if (raw.includes('lumbar')) {
          handleSelectJoint('lumbar');
        } else if (raw.includes('thoracic') || raw.includes('rib')) {
          handleSelectJoint('thoracic');
        } else if (raw.includes('cervical') || raw.includes('cranium') || raw.includes('skull')) {
          handleSelectJoint('cervical');
        } else if (raw.includes('mandible') || raw.includes('jaw')) {
          handleSelectJoint('mandible');
        } else if (raw.includes('pelvis') || raw.includes('sacrum') || raw.includes('hip')) {
          handleSelectJoint('pelvis');
        }
      } else {
        setSelectedMuscle(null);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // 10. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (rig.overlays && postureParams) {
        rig.overlays.update(postureParams, delta);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      transformControls.dispose();
      rig.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Posture with Medical Rig
  useEffect(() => {
    if (rigRef.current && rigRef.current.isReady && postureParams) {
      rigRef.current.updatePosture(postureParams);
    }
  }, [postureParams, loadProgress.ready]);

  // Sync TransformControls Proxies with current angles
  useEffect(() => {
    const p = jointProxiesRef.current;
    if (p.pelvis) {
      p.pelvis.rotation.set(postureParams.pelvisTilt || 0, postureParams.pelvisRotation || 0, postureParams.pelvisDrop || 0);
    }
    if (p.right_foot) {
      p.right_foot.rotation.set(0, 0, postureParams.rightFootPronation || 0);
    }
    if (p.right_tibia) {
      p.right_tibia.rotation.set(0, -(postureParams.rightFootPronation || 0), -(postureParams.rightKneeValgus || 0));
    }
    if (p.lumbar) {
      p.lumbar.rotation.set(-(postureParams.lumbarLordosis || 0), 0, -(postureParams.spinalLateralBend || 0));
    }
    if (p.thoracic) {
      p.thoracic.rotation.set(postureParams.thoracicKyphosis || 0, 0, postureParams.spinalLateralBend || 0);
    }
    if (p.cervical) {
      p.cervical.rotation.set(-((postureParams.cervicalForwardHead || 0) * 45), 0, 0);
    }
  }, [postureParams]);

  const handleSelectJoint = (jointKey) => {
    setActiveJointKey(jointKey);
    const proxy = jointProxiesRef.current[jointKey];
    if (transformControlsRef.current && proxy) {
      transformControlsRef.current.attach(proxy);
      transformControlsRef.current.visible = showGizmo;
    }
  };

  const handleStepRotate = (axis, deltaDeg) => {
    const deltaRad = degToRad(deltaDeg);
    if (!onParamChange) return;

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

  const handleResetJoint = () => {
    if (!onParamChange) return;
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

  const handleToggleLayer = (layerKey) => {
    const nextState = !layers[layerKey];
    setLayers((prev) => ({ ...prev, [layerKey]: nextState }));
    if (rigRef.current) {
      rigRef.current.setLayerVisibility(layerKey, nextState);
    }
  };

  const handleHideMuscle = (muscleId) => {
    if (rigRef.current) {
      rigRef.current.hideMuscle(muscleId);
      setSelectedMuscle(null);
    }
  };

  const handleRestoreAllMuscles = () => {
    if (rigRef.current) {
      rigRef.current.restoreAllMuscles();
      setSelectedMuscle(null);
    }
  };

  const setCameraPreset = (viewName) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    if (viewName === 'front') {
      camera.position.set(0, 0.90, 3.6);
      controls.target.set(0, 0.90, 0);
    } else if (viewName === 'side') {
      camera.position.set(3.2, 0.90, 0.2);
      controls.target.set(0, 0.90, 0);
    } else if (viewName === 'pelvis') {
      camera.position.set(0, 0.92, 1.3);
      controls.target.set(0, 0.92, 0);
    } else if (viewName === 'right_knee') {
      camera.position.set(0.25, 0.45, 1.1);
      controls.target.set(-0.076, 0.434, 0);
    } else if (viewName === 'right_foot') {
      camera.position.set(0.2, 0.15, 0.8);
      controls.target.set(-0.076, 0.08, 0);
    } else if (viewName === 'spine') {
      camera.position.set(0, 1.25, 1.4);
      controls.target.set(0, 1.25, 0);
    }
    controls.update();
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        outline: 'none',
        overflow: 'hidden',
        background: '#06080d',
      }}
    >
      {/* Loading Screen for Clinical Assets */}
      {!loadProgress.ready && (
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
            Loading Clinical Medical Musculoskeletal System
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '14px' }}>
            {loadProgress.status}
          </p>
          <div style={{ width: '240px', height: '6px', backgroundColor: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${loadProgress.progress}%`,
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 10px #38bdf8',
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>
        </div>
      )}

      {/* Hover Annotation */}
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

      {/* TOP FLOATING MINIMALIST TOOLBAR: 4 LAYERS & KINETIC DRIVERS */}
      <header
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          background: 'rgba(10, 15, 26, 0.92)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px', borderRight: '1px solid var(--border-medium)' }}>
          <Activity size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
            BioAlign<span style={{ color: 'var(--accent-cyan)' }}>3D</span>
          </span>
        </div>

        {/* 4 Anatomical Layers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => handleToggleLayer('skeleton')}
            className={`btn-secondary ${layers.skeleton ? 'active' : ''}`}
            style={{ fontSize: '0.725rem', padding: '4px 8px', height: '26px' }}
          >
            🦴 Skeleton
          </button>
          <button
            onClick={() => handleToggleLayer('ligaments')}
            className={`btn-secondary ${layers.ligaments ? 'active' : ''}`}
            style={{ fontSize: '0.725rem', padding: '4px 8px', height: '26px' }}
          >
            🔗 Tendons
          </button>
          <button
            onClick={() => handleToggleLayer('muscles')}
            className={`btn-secondary ${layers.muscles ? 'active' : ''}`}
            style={{ fontSize: '0.725rem', padding: '4px 8px', height: '26px' }}
          >
            💪 Muscles
          </button>
          <button
            onClick={() => handleToggleLayer('nerves')}
            className={`btn-secondary ${layers.nerves ? 'active' : ''}`}
            style={{ fontSize: '0.725rem', padding: '4px 8px', height: '26px' }}
          >
            ⚡ Nerves
          </button>
        </div>

        {/* Kinetic Chain Coupling Modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '8px', borderLeft: '1px solid var(--border-medium)' }}>
          <button
            onClick={() => onKineticModeChange && onKineticModeChange('foot_ascending')}
            className={`btn-secondary ${kineticMode === 'foot_ascending' ? 'active' : ''}`}
            style={{ fontSize: '0.725rem', padding: '4px 8px', height: '26px' }}
            title="Ground-up cascade: Foot arch eversion drives tibial internal rotation, knee valgus, and pelvic drop"
          >
            <Footprints size={12} />
            Foot Driver
          </button>
          <button
            onClick={() => onKineticModeChange && onKineticModeChange('pelvis_rooted')}
            className={`btn-secondary ${kineticMode === 'pelvis_rooted' ? 'active' : ''}`}
            style={{ fontSize: '0.725rem', padding: '4px 8px', height: '26px' }}
            title="Core cascade: Pelvis drop & tilt command lower limb valgus and spinal curvature"
          >
            <Disc size={12} />
            Pelvis Driver
          </button>
          <button
            onClick={() => onKineticModeChange && onKineticModeChange('manual')}
            className={`btn-secondary ${kineticMode === 'manual' ? 'active' : ''}`}
            style={{ fontSize: '0.725rem', padding: '4px 8px', height: '26px' }}
            title="Decoupled free joint isolation"
          >
            <Move3d size={12} />
            Free Joint
          </button>
        </div>
      </header>

      {/* DIRECT ON-CANVAS BONE ROTATION CONTROLLER (Bottom Center Floating HUD) */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          background: 'rgba(10, 15, 26, 0.92)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
          zIndex: 25,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Move3d size={15} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
            Rotate Joint:
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

        {/* Pitch, Roll, Yaw Step Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '1px 4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f87171', marginRight: '3px' }}>PITCH</span>
            <button onClick={() => handleStepRotate('pitch', -5)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 2px' }} title="Pitch -5°"><Minus size={11} /></button>
            <button onClick={() => handleStepRotate('pitch', 5)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 2px' }} title="Pitch +5°"><Plus size={11} /></button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', padding: '1px 4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#38bdf8', marginRight: '3px' }}>ROLL</span>
            <button onClick={() => handleStepRotate('roll', -5)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0 2px' }} title="Roll -5°"><Minus size={11} /></button>
            <button onClick={() => handleStepRotate('roll', 5)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0 2px' }} title="Roll +5°"><Plus size={11} /></button>
          </div>

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

        {/* Gizmo Toggle */}
        <button
          onClick={() => {
            const next = !showGizmo;
            setShowGizmo(next);
            if (transformControlsRef.current) transformControlsRef.current.visible = next;
          }}
          className={`btn-secondary ${showGizmo ? 'active' : ''}`}
          style={{ fontSize: '0.7rem', padding: '3px 8px', height: '22px' }}
        >
          {showGizmo ? '3D Gizmo ON' : '3D Gizmo OFF'}
        </button>
      </div>

      {/* SELECTED MUSCLE PEEL / HIDE ACTION CARD */}
      {selectedMuscle && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: '70px',
            right: '20px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid #ef4444',
            background: 'rgba(15, 23, 42, 0.95)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
            zIndex: 35,
            width: '260px',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {selectedMuscle.name}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Peel this muscle layer to inspect underlying deep muscles, ligaments, and nerves.
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleHideMuscle(selectedMuscle.id)}
              className="btn-secondary active"
              style={{ fontSize: '0.7rem', padding: '4px 8px', flex: 1, color: '#f87171' }}
            >
              <EyeOff size={12} />
              Hide (Peel)
            </button>
            <button
              onClick={handleRestoreAllMuscles}
              className="btn-secondary"
              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
            >
              Restore All
            </button>
          </div>
        </div>
      )}

      {/* Camera View Switcher (Bottom Left) */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 20,
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '2px' }}>
          VIEW:
        </span>
        <button className="btn-icon" style={{ padding: '0 6px', fontSize: '0.7rem', width: 'auto' }} onClick={() => setCameraPreset('front')}>Front</button>
        <button className="btn-icon" style={{ padding: '0 6px', fontSize: '0.7rem', width: 'auto' }} onClick={() => setCameraPreset('side')}>Side</button>
        <button className="btn-icon" style={{ padding: '0 6px', fontSize: '0.7rem', width: 'auto' }} onClick={() => setCameraPreset('pelvis')}>Pelvis</button>
        <button className="btn-icon" style={{ padding: '0 6px', fontSize: '0.7rem', width: 'auto' }} onClick={() => setCameraPreset('right_knee')}>Knee</button>
        <button className="btn-icon" style={{ padding: '0 6px', fontSize: '0.7rem', width: 'auto' }} onClick={() => setCameraPreset('right_foot')}>Foot</button>
        <button className="btn-icon" style={{ padding: '0 6px', fontSize: '0.7rem', width: 'auto' }} onClick={() => setCameraPreset('spine')}>Spine</button>
      </div>

      {/* Interaction Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '20px',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.725rem',
          color: 'var(--text-secondary)',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          zIndex: 15,
        }}
      >
        <Info size={12} color="var(--accent-cyan)" />
        Click any medical bone or muscle in 3D to rotate or peel
      </div>
    </div>
  );
}
