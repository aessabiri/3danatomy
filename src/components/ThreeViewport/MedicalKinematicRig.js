import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createMedicalMaterials } from './MedicalMaterials';
import { KineticChainSolver } from '../../utils/KineticChainSolver';
import { BiomechanicalVisualOverlays } from './BiomechanicalVisualOverlays';

/**
 * Universal Medical Musculoskeletal Kinematic Rig
 * Integrates LUMC Clinical Scans with exact midline sagittal alignment (x = 0).
 */
export class MedicalKinematicRig {
  constructor(scene, onProgress, onComplete) {
    this.scene = scene;
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    this.root = new THREE.Group();
    this.root.name = 'MedicalKinematicSystem';
    this.scene.add(this.root);

    this.layerSkeletal = new THREE.Group();
    this.layerSkeletal.name = 'Layer_Skeletal';
    this.root.add(this.layerSkeletal);

    this.layerLigaments = new THREE.Group();
    this.layerLigaments.name = 'Layer_Ligaments';
    this.root.add(this.layerLigaments);

    this.layerMuscles = new THREE.Group();
    this.layerMuscles.name = 'Layer_Muscles';
    this.root.add(this.layerMuscles);

    this.layerNerves = new THREE.Group();
    this.layerNerves.name = 'Layer_Nerves';
    this.root.add(this.layerNerves);

    this.materials = createMedicalMaterials();
    this.overlays = new BiomechanicalVisualOverlays(this.scene);

    this.joints = {};
    this.nodes = {};
    this.interactiveObjects = [];
    this.muscleMeshes = [];
    this.hiddenMuscles = new Set();
    this.isReady = false;

    this.layerVisibility = {
      skeleton: true,
      ligaments: true,
      muscles: true,
      nerves: true,
    };

    this.romLimits = {
      pelvisTilt: { min: -0.44, max: 0.35 },        // -25° to +20°
      pelvisDrop: { min: -0.26, max: 0.26 },        // -15° to +15°
      pelvisRotation: { min: -0.35, max: 0.35 },    // -20° to +20°
      rightFootPronation: { min: -0.26, max: 0.52 },// -15° to +30°
      leftFootPronation: { min: -0.26, max: 0.52 },
      rightKneeValgus: { min: -0.09, max: 0.44 },   // -5° to +25°
      leftKneeValgus: { min: -0.09, max: 0.44 },
      lumbarLordosis: { min: -0.26, max: 0.61 },    // -15° to +35°
      thoracicKyphosis: { min: 0.0, max: 0.78 },    // 0° to +45°
      spinalLateralBend: { min: -0.35, max: 0.35 }, // -20° to +20°
      cervicalForwardHead: { min: 0.0, max: 0.055 },// 0 to 55mm
    };

    this.loadMedicalAtlas();
  }

  async loadMedicalAtlas() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    try {
      this.onProgress && this.onProgress(20, 'Loading LUMC Clinical Skeleton Scan...');
      const skeletonGltf = await this.loadGLTF(loader, '/models/lumc_skeleton.glb');

      this.onProgress && this.onProgress(50, 'Loading Full-Body Striated Musculature...');
      const muscleGltf = await this.loadGLTF(loader, '/models/fullbody.glb');

      this.onProgress && this.onProgress(75, 'Loading LUMC Tendons, Ligaments & Nerves...');
      const lowerLimbGltf = await this.loadGLTF(loader, '/models/lumc_lower_limb.glb');

      this.onProgress && this.onProgress(90, 'Aligning Anatomy Along Midline...');
      this.assembleClinicalAtlas(skeletonGltf.scene, muscleGltf.scene, lowerLimbGltf.scene);

      this.isReady = true;
      this.onProgress && this.onProgress(100, 'Ready');
      if (this.onComplete) this.onComplete(this);
    } catch (err) {
      console.error('Error loading medical atlas:', err);
    }
  }

  loadGLTF(loader, url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  assembleClinicalAtlas(skeletonScene, muscleScene, lowerLimbScene) {
    // 1. SKELETON LAYER (LUMC Scan)
    skeletonScene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = (child.name || '').toLowerCase();
        if (name.includes('cart') || name.includes('disc') || name.includes('meniscus')) {
          child.material = this.materials.hyalineCartilage;
        } else {
          child.material = this.materials.corticalBone;
        }
        this.registerInteractive(child, child.name.replace(/\.r|\.l|\.g/g, ''));
      }
    });

    // Bilateral mirrored limbs for skeleton (all lateral bones ending with .r)
    const mirroredSkelLimbs = new THREE.Group();
    mirroredSkelLimbs.name = 'MirroredLeftSkeleton';
    mirroredSkelLimbs.scale.x = -1;

    skeletonScene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const rawName = child.name || '';
        if (rawName.endsWith('.r') || rawName.endsWith('.r.') || rawName.toLowerCase().includes('right')) {
          const clone = new THREE.Mesh(child.geometry, child.material);
          clone.position.copy(child.position);
          clone.rotation.copy(child.rotation);
          clone.scale.copy(child.scale);
          clone.castShadow = true;
          clone.receiveShadow = true;
          mirroredSkelLimbs.add(clone);
          this.registerInteractive(clone, `${rawName.replace(/\.r|\.l/g, '')}.l`);
        }
      }
    });

    const skeletonContainer = new THREE.Group();
    skeletonContainer.name = 'SkeletonContainer';
    skeletonContainer.add(skeletonScene);
    skeletonContainer.add(mirroredSkelLimbs);

    const skelBox = new THREE.Box3().setFromObject(skeletonContainer);
    const skelSize = skelBox.getSize(new THREE.Vector3());
    const skelScale = 1.75 / (skelSize.y > 0 ? skelSize.y : 1.75);

    // Keep midline aligned on sagittal plane (x = 0, z = 0)
    skeletonContainer.scale.set(skelScale, skelScale, skelScale);
    skeletonContainer.position.set(0, -skelBox.min.y * skelScale, 0);
    this.layerSkeletal.add(skeletonContainer);

    // 2. MUSCLE LAYER (Fullbody Striated Musculature)
    this.muscleMeshes = [];
    muscleScene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = this.materials.striatedMuscle.clone();

        const muscleObj = {
          id: child.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: child.name.replace(/\.r|\.l|\.g/g, ''),
          mesh: child,
          baseScale: child.scale.clone(),
        };

        child.userData = {
          isInteractive: true,
          isMuscle: true,
          muscleId: muscleObj.id,
          labelName: muscleObj.name,
        };

        this.interactiveObjects.push(child);
        this.muscleMeshes.push(muscleObj);
      }
    });

    const musBox = new THREE.Box3().setFromObject(muscleScene);
    const musSize = musBox.getSize(new THREE.Vector3());
    const musScale = 1.75 / (musSize.y > 0 ? musSize.y : 1.75);

    const muscleContainer = new THREE.Group();
    muscleContainer.name = 'MuscleContainer';
    muscleContainer.add(muscleScene);
    muscleContainer.scale.set(musScale, musScale, musScale);
    muscleContainer.position.set(0, -musBox.min.y * musScale, 0);
    this.layerMuscles.add(muscleContainer);

    // 3. TENDONS, LIGAMENTS & NERVES FROM LUMC LOWER LIMB SCAN
    const tendonGroup = new THREE.Group();
    tendonGroup.name = 'LUMCTendonsAndLigaments';

    const nerveGroup = new THREE.Group();
    nerveGroup.name = 'LUMCNerves';

    lowerLimbScene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const name = (child.name || '').toLowerCase();

        // Tendons & Ligaments & Retinacula
        if (
          name.includes('ligament') ||
          name.includes('tendon') ||
          name.includes('retinacul') ||
          name.includes('sheath') ||
          name.includes('fascia') ||
          name.includes('bursa')
        ) {
          const mat = name.includes('bursa')
            ? this.materials.hyalineCartilage
            : this.materials.denseTendon;
          const mesh = new THREE.Mesh(child.geometry, mat);
          mesh.position.copy(child.position);
          mesh.rotation.copy(child.rotation);
          mesh.scale.copy(child.scale);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          tendonGroup.add(mesh);
          this.registerInteractive(mesh, child.name.replace(/\.r|\.l/g, ''));
        }

        // Nerves & Plexuses
        if (name.includes('nerve') || name.includes('plexus')) {
          const mesh = new THREE.Mesh(child.geometry, this.materials.nerveMyelin);
          mesh.position.copy(child.position);
          mesh.rotation.copy(child.rotation);
          mesh.scale.copy(child.scale);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          nerveGroup.add(mesh);
          this.registerInteractive(mesh, child.name.replace(/\.r|\.l/g, ''));
        }
      }
    });

    // Bilateral Mirroring for Left Tendons and Nerves
    const mirroredTendons = tendonGroup.clone();
    mirroredTendons.scale.x = -1;
    tendonGroup.add(mirroredTendons);

    const mirroredNerves = nerveGroup.clone();
    mirroredNerves.scale.x = -1;
    nerveGroup.add(mirroredNerves);

    tendonGroup.scale.set(skelScale, skelScale, skelScale);
    tendonGroup.position.set(0, -skelBox.min.y * skelScale, 0);
    this.layerLigaments.add(tendonGroup);

    nerveGroup.scale.set(skelScale, skelScale, skelScale);
    nerveGroup.position.set(0, -skelBox.min.y * skelScale, 0);
    this.layerNerves.add(nerveGroup);

    // Spinal Cord
    const spinalCord = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.62, 12), this.materials.nerveMyelin);
    spinalCord.position.set(0, 1.25, -0.03);
    this.layerNerves.add(spinalCord);
    this.registerInteractive(spinalCord, 'Spinal Cord & Conus Medullaris');

    // 4. Cache Kinematic Nodes
    this.nodes = {
      pelvis: [],
      lumbar: [],
      thoracic: [],
      cervical: [],
      rightFoot: [],
      leftFoot: [],
    };

    skeletonScene.traverse((child) => {
      const name = (child.name || '').toLowerCase();
      if (name.includes('sacrum') || name.includes('hip bone')) this.nodes.pelvis.push(child);
      if (name.includes('lumbar')) this.nodes.lumbar.push(child);
      if (name.includes('thoracic') || name.includes('rib')) this.nodes.thoracic.push(child);
      if (name.includes('cervical') || name.includes('atlas') || name.includes('axis')) this.nodes.cervical.push(child);
      if (name.includes('mandible')) this.nodes.mandible = child;
      if (name.includes('femur.r') || name.includes('femur')) this.nodes.rightFemur = child;
      if (name.includes('tibia.r') || name.includes('tibia')) this.nodes.rightTibia = child;
      if (name.includes('talus') || name.includes('calcaneus') || name.includes('navicular')) this.nodes.rightFoot.push(child);
    });

    mirroredSkelLimbs.traverse((child) => {
      const name = (child.name || '').toLowerCase();
      if (name.includes('femur')) this.nodes.leftFemur = child;
      if (name.includes('tibia')) this.nodes.leftTibia = child;
      if (name.includes('talus') || name.includes('calcaneus')) this.nodes.leftFoot.push(child);
    });
  }

  registerInteractive(mesh, labelName) {
    mesh.userData = {
      isInteractive: true,
      labelName,
      ...mesh.userData,
    };
    this.interactiveObjects.push(mesh);
  }

  // =========================================================================
  // CLOSED-CHAIN KINEMATIC UPDATE
  // =========================================================================
  updatePosture(params = {}) {
    if (!this.isReady) return;

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val || 0));

    const pelvisTilt = clamp(params.pelvisTilt, this.romLimits.pelvisTilt.min, this.romLimits.pelvisTilt.max);
    const pelvisDrop = clamp(params.pelvisDrop, this.romLimits.pelvisDrop.min, this.romLimits.pelvisDrop.max);
    const pelvisRotation = clamp(params.pelvisRotation, this.romLimits.pelvisRotation.min, this.romLimits.pelvisRotation.max);
    const lumbarLordosis = clamp(params.lumbarLordosis, this.romLimits.lumbarLordosis.min, this.romLimits.lumbarLordosis.max);
    const thoracicKyphosis = clamp(params.thoracicKyphosis, this.romLimits.thoracicKyphosis.min, this.romLimits.thoracicKyphosis.max);
    const spinalLateralBend = clamp(params.spinalLateralBend, this.romLimits.spinalLateralBend.min, this.romLimits.spinalLateralBend.max);
    const cervicalForwardHead = clamp(params.cervicalForwardHead, this.romLimits.cervicalForwardHead.min, this.romLimits.cervicalForwardHead.max);
    const rightKneeValgus = clamp(params.rightKneeValgus, this.romLimits.rightKneeValgus.min, this.romLimits.rightKneeValgus.max);
    const leftKneeValgus = clamp(params.leftKneeValgus, this.romLimits.leftKneeValgus.min, this.romLimits.leftKneeValgus.max);
    const rightFootPronation = clamp(params.rightFootPronation, this.romLimits.rightFootPronation.min, this.romLimits.rightFootPronation.max);
    const leftFootPronation = clamp(params.leftFootPronation, this.romLimits.leftFootPronation.min, this.romLimits.leftFootPronation.max);

    // 1. Pelvis
    if (this.nodes.pelvis) {
      this.nodes.pelvis.forEach((node) => {
        node.rotation.x = pelvisTilt;
        node.rotation.z = pelvisDrop;
        node.rotation.y = pelvisRotation;
      });
    }

    // 2. Lumbar Spine
    if (this.nodes.lumbar) {
      this.nodes.lumbar.forEach((node, idx) => {
        const frac = (idx + 1) / this.nodes.lumbar.length;
        node.rotation.x = -lumbarLordosis * frac * 0.35;
        node.rotation.z = -spinalLateralBend * frac * 0.35;
      });
    }

    // 3. Thoracic Spine & Ribcage
    if (this.nodes.thoracic) {
      this.nodes.thoracic.forEach((node, idx) => {
        const frac = (idx + 1) / this.nodes.thoracic.length;
        node.rotation.x = thoracicKyphosis * frac * 0.35;
        node.rotation.z = spinalLateralBend * (1 - frac) * 0.3;
      });
    }

    // 4. Cervical & Cranium
    if (this.nodes.cervical) {
      this.nodes.cervical.forEach((node, idx) => {
        const frac = (idx + 1) / this.nodes.cervical.length;
        node.rotation.x = -cervicalForwardHead * frac * 5.0;
        node.position.z = cervicalForwardHead * frac * 0.6;
      });
    }

    if (this.nodes.mandible) {
      this.nodes.mandible.position.z = -cervicalForwardHead * 0.6;
      this.nodes.mandible.position.y = -cervicalForwardHead * 0.3;
    }

    // 5. Right Leg
    if (this.nodes.rightFemur) {
      this.nodes.rightFemur.rotation.z = rightKneeValgus * 0.4 - pelvisDrop;
      this.nodes.rightFemur.rotation.y = rightFootPronation * 0.3;
    }

    if (this.nodes.rightTibia) {
      this.nodes.rightTibia.rotation.y = -rightFootPronation * 0.88;
      this.nodes.rightTibia.rotation.z = -rightKneeValgus * 0.8;
    }

    if (this.nodes.rightFoot) {
      this.nodes.rightFoot.forEach((node) => {
        node.rotation.z = rightFootPronation * 0.85;
      });
    }

    // 6. Left Leg
    if (this.nodes.leftFemur) {
      this.nodes.leftFemur.rotation.z = -leftKneeValgus * 0.4 - pelvisDrop;
      this.nodes.leftFemur.rotation.y = -leftFootPronation * 0.3;
    }

    if (this.nodes.leftTibia) {
      this.nodes.leftTibia.rotation.y = leftFootPronation * 0.88;
      this.nodes.leftTibia.rotation.z = leftKneeValgus * 0.8;
    }

    if (this.nodes.leftFoot) {
      this.nodes.leftFoot.forEach((node) => {
        node.rotation.z = -leftFootPronation * 0.85;
      });
    }

    // 7. Dynamic Muscle Strain Shading
    const { registry } = KineticChainSolver.calculateMuscleStrains({
      pelvisTilt,
      pelvisDrop,
      lumbarLordosis,
      thoracicKyphosis,
      spinalLateralBend,
      cervicalForwardHead,
      rightKneeValgus,
      leftKneeValgus,
      rightFootPronation,
      leftFootPronation,
    });

    const strainMap = new Map(registry.map((m) => [m.id, m]));

    this.muscleMeshes.forEach((m) => {
      if (this.hiddenMuscles.has(m.id)) {
        m.mesh.visible = false;
        return;
      }

      m.mesh.visible = this.layerVisibility.muscles;

      let matched = null;
      for (let [k, val] of strainMap) {
        if (m.id.includes(k) || k.includes(m.id)) {
          matched = val;
          break;
        }
      }

      if (matched) {
        const sf = matched.stretchFactor;
        m.mesh.scale.y = m.baseScale.y * sf;
        m.mesh.scale.x = m.baseScale.x / Math.sqrt(Math.max(0.4, sf));
        m.mesh.scale.z = m.baseScale.z / Math.sqrt(Math.max(0.4, sf));

        if (matched.state === 'tight') {
          m.mesh.material = this.materials.muscleTight;
        } else if (matched.state === 'weak') {
          m.mesh.material = this.materials.muscleWeak;
        } else {
          m.mesh.material = this.materials.striatedMuscle;
        }
      }
    });

    if (this.overlays) {
      this.overlays.update({
        pelvisDrop,
        pelvisTilt,
        rightFootPronation,
        rightKneeValgus,
        cervicalForwardHead,
        thoracicKyphosis,
      });
    }
  }

  setLayerVisibility(layerKey, isVisible) {
    if (this.layerVisibility[layerKey] !== undefined) {
      this.layerVisibility[layerKey] = isVisible;
    }

    if (layerKey === 'skeleton') this.layerSkeletal.visible = isVisible;
    if (layerKey === 'ligaments') this.layerLigaments.visible = isVisible;
    if (layerKey === 'muscles') {
      this.layerMuscles.visible = isVisible;
      this.muscleMeshes.forEach((m) => {
        m.mesh.visible = isVisible && !this.hiddenMuscles.has(m.id);
      });
    }
    if (layerKey === 'nerves') this.layerNerves.visible = isVisible;
  }

  hideMuscle(muscleId) {
    this.hiddenMuscles.add(muscleId);
    const m = this.muscleMeshes.find((item) => item.id === muscleId);
    if (m) m.mesh.visible = false;
  }

  restoreAllMuscles() {
    this.hiddenMuscles.clear();
    this.muscleMeshes.forEach((m) => {
      m.mesh.visible = this.layerVisibility.muscles;
    });
  }

  dispose() {
    this.scene.remove(this.root);
    if (this.overlays) this.overlays.dispose();
    Object.values(this.materials).forEach((mat) => mat.dispose());
  }
}
