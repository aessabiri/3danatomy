import * as THREE from 'three';

/**
 * Hyper-Realistic Medical PBR Shader & Material Engine for Human Anatomy
 * Simulates micro-porous cortical bone, wet fascial epimysium sheaths, striated myofibrils, and cartilage discs.
 */

// Generate procedural micro-textures for cortical bone & striated muscle fibers
function generateAnatomicalTextures() {
  // 1. Cortical Bone Osteon Micro-Canal Texture (512x512)
  const boneCanvas = document.createElement('canvas');
  boneCanvas.width = 512;
  boneCanvas.height = 512;
  const bCtx = boneCanvas.getContext('2d');
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  // Micro Haversian osteon grooves and mineral porosity
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 6 + Math.random() * 20;
    const alpha = 0.06 + Math.random() * 0.12;
    bCtx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    bCtx.lineWidth = 1;
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + (Math.random() - 0.5) * 1.5, y + len);
    bCtx.stroke();
  }
  const boneBumpMap = new THREE.CanvasTexture(boneCanvas);
  boneBumpMap.wrapS = THREE.RepeatWrapping;
  boneBumpMap.wrapT = THREE.RepeatWrapping;
  boneBumpMap.repeat.set(3, 8);

  // 2. Striated Muscle Fiber Texture (512x512)
  const muscleCanvas = document.createElement('canvas');
  muscleCanvas.width = 512;
  muscleCanvas.height = 512;
  const mCtx = muscleCanvas.getContext('2d');
  mCtx.fillStyle = '#808080';
  mCtx.fillRect(0, 0, 512, 512);

  // Longitudinal myofibril striations with fascicle bundling
  for (let y = 0; y < 512; y += 2) {
    const intensity = Math.sin(y * 0.35) * 0.22 + (Math.random() - 0.5) * 0.18;
    mCtx.fillStyle = intensity > 0
      ? `rgba(255,255,255,${Math.abs(intensity)})`
      : `rgba(0,0,0,${Math.abs(intensity)})`;
    mCtx.fillRect(0, y, 512, 2);
  }
  const muscleBumpMap = new THREE.CanvasTexture(muscleCanvas);
  muscleBumpMap.wrapS = THREE.RepeatWrapping;
  muscleBumpMap.wrapT = THREE.RepeatWrapping;
  muscleBumpMap.repeat.set(2, 16);

  return { boneBumpMap, muscleBumpMap };
}

export function createMedicalMaterials() {
  const { boneBumpMap, muscleBumpMap } = generateAnatomicalTextures();

  // 1. CORTICAL BONE (Hyper-realistic osteon micro-porosity + periosteal wet sheen)
  const corticalBone = new THREE.MeshPhysicalMaterial({
    name: 'CorticalBoneMaterial',
    color: new THREE.Color(0xf6f3eb), // Natural calcified ivory
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.35, // Periosteum moisture
    clearcoatRoughness: 0.28,
    sheen: 0.5, // Micro-fibrous bone porosity
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(0xffeedb),
    bumpMap: boneBumpMap,
    bumpScale: 0.008,
  });

  // 2. STRIATED MUSCLE (Deep vascular myoglobin + glistening epimysium fascia sheath)
  const striatedMuscle = new THREE.MeshPhysicalMaterial({
    name: 'StriatedMuscleMaterial',
    color: new THREE.Color(0x991b1b), // Rich anatomical crimson
    roughness: 0.46,
    metalness: 0.02,
    clearcoat: 0.85, // Wet fascial epimysium sheen
    clearcoatRoughness: 0.16,
    sheen: 0.65,
    sheenColor: new THREE.Color(0xef4444),
    sheenRoughness: 0.3,
    bumpMap: muscleBumpMap,
    bumpScale: 0.012,
  });

  // 3. TENSION HEATMAP: HYPERTONIC / SHORTENED MUSCLE (Glowing Crimson / Spasm)
  const muscleTight = new THREE.MeshPhysicalMaterial({
    name: 'MuscleTightMaterial',
    color: new THREE.Color(0xff1e56),
    emissive: new THREE.Color(0x990b2b),
    emissiveIntensity: 0.5,
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    bumpMap: muscleBumpMap,
    bumpScale: 0.015,
  });

  // 4. TENSION HEATMAP: INHIBITED / WEAK MUSCLE (Cool Cyan / Deactivated)
  const muscleWeak = new THREE.MeshPhysicalMaterial({
    name: 'MuscleWeakMaterial',
    color: new THREE.Color(0x06b6d4),
    emissive: new THREE.Color(0x083344),
    emissiveIntensity: 0.45,
    roughness: 0.5,
    metalness: 0.02,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    bumpMap: muscleBumpMap,
    bumpScale: 0.012,
  });

  // 5. HYALINE CARTILAGE & INTERVERTEBRAL DISCS (Optical light transmission)
  const hyalineCartilage = new THREE.MeshPhysicalMaterial({
    name: 'HyalineCartilageMaterial',
    color: new THREE.Color(0xbae6fd),
    roughness: 0.15,
    metalness: 0.0,
    transmission: 0.75,
    thickness: 1.4,
    ior: 1.42,
    attenuationColor: new THREE.Color(0x0284c7),
    attenuationDistance: 0.5,
    transparent: true,
    opacity: 0.88,
  });

  // 6. TENDONS & APONEUROSES (Dense pearlescent collagen)
  const denseTendon = new THREE.MeshPhysicalMaterial({
    name: 'DenseTendonMaterial',
    color: new THREE.Color(0xfefce8),
    roughness: 0.22,
    metalness: 0.06,
    clearcoat: 0.9,
    clearcoatRoughness: 0.15,
    sheen: 0.55,
    sheenColor: new THREE.Color(0xffffff),
    bumpMap: muscleBumpMap,
    bumpScale: 0.006,
  });

  // 7. DIAGNOSTIC VOLUMETRIC X-RAY MATERIAL (Inverted Fresnel glow)
  const xrayBone = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x38bdf8) },
      uRimPower: { value: 2.2 },
      uOpacity: { value: 0.85 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uRimPower;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = 1.0 - abs(dot(viewDir, normal));
        float rim = pow(fresnel, uRimPower);
        gl_FragColor = vec4(uColor + vec3(rim * 0.7), (rim + 0.18) * uOpacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const xrayMuscle = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xa855f7) },
      uRimPower: { value: 2.8 },
      uOpacity: { value: 0.5 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uRimPower;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = 1.0 - abs(dot(viewDir, normal));
        float rim = pow(fresnel, uRimPower);
        gl_FragColor = vec4(uColor + vec3(rim * 0.5), (rim + 0.08) * uOpacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  return {
    corticalBone,
    striatedMuscle,
    muscleTight,
    muscleWeak,
    hyalineCartilage,
    denseTendon,
    xrayBone,
    xrayMuscle,
  };
}
