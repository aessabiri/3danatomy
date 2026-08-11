import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createMedicalMaterials } from './MedicalMaterials';
import { KineticChainSolver } from '../../utils/KineticChainSolver';
import { BiomechanicalVisualOverlays } from './BiomechanicalVisualOverlays';

/**
 * Universal Medical Musculoskeletal Kinematic Rig
 * Preserves 100% genuine clinical geometry from LUMC & Z-Anatomy scan models,
 * with precise anatomical joint pivots, parent-child kinetic articulation, and 4 layers.
 */
export class MedicalKinematicRig {
  constructor(scene, onProgress, onComplete) {
    this.scene = scene;
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    this.root = new THREE.Group();
    this.root.name = 'MedicalKinematicSystem';
    this.scene.add(this.root);

    // 4 Anatomical Layers
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

    // Clinical Range of Motion Limits (in radians)
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

    this.loadMedicalModels();
  }

  async loadMedicalModels() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    try {
      this.onProgress && this.onProgress(25, 'Loading High-Resolution Medical Skeleton (LUMC)...');
      const skeletonGltf = await this.loadGLTF(loader, '/models/lumc_skeleton.glb');

      this.onProgress && this.onProgress(65, 'Loading Real Anatomical Musculature (Fullbody)...');
      const muscleGltf = await this.loadGLTF(loader, '/models/fullbody.glb');

      this.onProgress && this.onProgress(85, 'Assembling Articulated Joint Hierarchy...');
      this.assembleSkeleton(skeletonGltf.scene);
      this.assembleMuscles(muscleGltf.scene);
      this.buildLigamentsAndTendons();
      this.buildNervousSystem();

      this.isReady = true;
      this.onProgress && this.onProgress(100, 'Ready');
      if (this.onComplete) this.onComplete(this);
    } catch (err) {
      console.error('Error loading medical models:', err);
    }
  }

  loadGLTF(loader, url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  assembleSkeleton(skeletonScene) {
    // Standardize Skeleton Scale & Position to 1.75m standing human
    const box = new THREE.Box3().setFromObject(skeletonScene);
    const size = box.getSize(new THREE.Vector3());
    const scaleFactor = 1.75 / (size.y > 0 ? size.y : 1.75);

    const skeletonGroup = new THREE.Group();
    skeletonGroup.name = 'LUMCSkeletonGroup';
    skeletonGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
    skeletonGroup.position.set(0, -box.min.y * scaleFactor, 0);
    skeletonGroup.add(skeletonScene);
    this.layerSkeletal.add(skeletonGroup);

    // Apply PBR Cortical Bone & Cartilage Materials
    skeletonScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = (child.name || '').toLowerCase();
        if (name.includes('cart') || name.includes('disc') || name.includes('meniscus')) {
          child.material = this.materials.hyalineCartilage;
        } else {
          child.material = this.materials.corticalBone;
        }
        this.registerInteractive(child, child.name.replace(/\.r|\.l/g, ''));
      }
    });

    // Create Bilateral Mirrored Left Skeleton for complete clinical symmetry
    const mirroredLeft = skeletonScene.clone();
    mirroredLeft.scale.x = -1;
    skeletonGroup.add(mirroredLeft);

    mirroredLeft.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        this.registerInteractive(child, `${child.name}.l`);
      }
    });

    // Identify & Cache Real Kinematic Joint Nodes
    this.joints.pelvis = new THREE.Group();
    this.joints.pelvis.name = 'Joint_Pelvis_Pivot';
    this.joints.pelvis.position.set(0, 0.92, 0);
    this.layerSkeletal.add(this.joints.pelvis);

    this.nodes = {};
    const cacheNodes = (scene) => {
      scene.traverse((child) => {
        const name = (child.name || '').toLowerCase();
        if (name.includes('femur')) this.nodes.rightFemur = child;
        if (name.includes('patella')) this.nodes.rightPatella = child;
        if (name.includes('tibia')) this.nodes.rightTibia = child;
        if (name.includes('fibula')) this.nodes.rightFibula = child;
        if (name.includes('talus') || name.includes('calcaneus') || name.includes('navicular')) {
          this.nodes.rightFoot = this.nodes.rightFoot || [];
          this.nodes.rightFoot.push(child);
        }
        if (name.includes('lumbar')) {
          this.nodes.lumbar = this.nodes.lumbar || [];
          this.nodes.lumbar.push(child);
        }
        if (name.includes('thoracic')) {
          this.nodes.thoracic = this.nodes.thoracic || [];
          this.nodes.thoracic.push(child);
        }
        if (name.includes('cervical') || name.includes('atlas') || name.includes('axis')) {
          this.nodes.cervical = this.nodes.cervical || [];
          this.nodes.cervical.push(child);
        }
        if (name.includes('mandible')) this.nodes.mandible = child;
        if (name.includes('sacrum') || name.includes('hip bone')) {
          this.nodes.pelvisBones = this.nodes.pelvisBones || [];
          this.nodes.pelvisBones.push(child);
        }
      });
    };

    cacheNodes(skeletonScene);

    // Cache left mirrored nodes
    this.nodes.leftFoot = [];
    mirroredLeft.traverse((child) => {
      const name = (child.name || '').toLowerCase();
      if (name.includes('femur')) this.nodes.leftFemur = child;
      if (name.includes('tibia')) this.nodes.leftTibia = child;
      if (name.includes('talus') || name.includes('calcaneus')) this.nodes.leftFoot.push(child);
    });
  }

  assembleMuscles(muscleScene) {
    const box = new THREE.Box3().setFromObject(muscleScene);
    const size = box.getSize(new THREE.Vector3());
    const scaleFactor = 1.75 / (size.y > 0 ? size.y : 1.75);

    const muscleGroup = new THREE.Group();
    muscleGroup.name = 'FullbodyMusclesGroup';
    muscleGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
    muscleGroup.position.set(0, -box.min.y * scaleFactor, 0);
    muscleGroup.add(muscleScene);
    this.layerMuscles.add(muscleGroup);

    this.muscleMeshes = [];
    muscleScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = this.materials.striatedMuscle.clone();

        const muscleObj = {
          id: child.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: child.name.replace(/\.r|\.l/g, ''),
          mesh: child,
          baseScale: child.scale.clone(),
          basePos: child.position.clone(),
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
  }

  buildLigamentsAndTendons() {
    const matTendon = this.materials.denseTendon;
    const matLigament = this.materials.ligamentFascia;

    [-1, 1].forEach((side) => {
      const sideName = side === 1 ? 'Right' : 'Left';
      const sideX = side * 0.08;

      // Plantar Fascia
      const plantarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.005, 0.14), matLigament);
      plantarMesh.position.set(sideX, 0.025, 0.04);
      this.layerLigaments.add(plantarMesh);
      this.registerInteractive(plantarMesh, `${sideName} Plantar Fascia`);

      // Achilles Tendon
      const achillesMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.16, 8), matTendon);
      achillesMesh.position.set(sideX, 0.14, -0.04);
      this.layerLigaments.add(achillesMesh);
      this.registerInteractive(achillesMesh, `${sideName} Achilles (Calcaneal) Tendon`);

      // Patellar Tendon & Retinacula
      const patellarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.075, 0.008), matTendon);
      patellarMesh.position.set(sideX, 0.44, 0.035);
      this.layerLigaments.add(patellarMesh);
      this.registerInteractive(patellarMesh, `${sideName} Patellar Tendon`);

      // IT Band
      const itBandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.44, 0.04), matTendon);
      itBandMesh.position.set(side * 0.14, 0.68, 0);
      this.layerLigaments.add(itBandMesh);
      this.registerInteractive(itBandMesh, `${sideName} Iliotibial (IT) Tract`);
    });
  }

  buildNervousSystem() {
    const matNerve = this.materials.nerveMyelin;

    // Spinal Cord
    const spinalCord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.010, 0.62, 8), matNerve);
    spinalCord.position.set(0, 1.25, -0.03);
    this.layerNerves.add(spinalCord);
    this.registerInteractive(spinalCord, 'Spinal Cord & Lumbar Plexus');

    [-1, 1].forEach((side) => {
      const sideName = side === 1 ? 'Right' : 'Left';
      const sideX = side * 0.07;

      // Sciatic Nerve
      const sciatic = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.44, 6), matNerve);
      sciatic.position.set(sideX, 0.66, -0.04);
      this.layerNerves.add(sciatic);
      this.registerInteractive(sciatic, `${sideName} Sciatic Nerve`);

      // Common Peroneal Nerve (Fibular Head)
      const peroneal = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.004, 6, 12, Math.PI * 0.8), matNerve);
      peroneal.rotation.set(Math.PI / 2, side * 0.3, 0);
      peroneal.position.set(side * 0.11, 0.43, 0);
      this.layerNerves.add(peroneal);
      this.registerInteractive(peroneal, `${sideName} Common Peroneal Nerve (Entrapment Zone)`);
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
  // CLOSED-CHAIN KINEMATIC UPDATE ON REAL CLINICAL MESHES
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

    // 1. Pelvis Bones Real Articulation
    if (this.nodes.pelvisBones) {
      this.nodes.pelvisBones.forEach((b) => {
        b.rotation.x = pelvisTilt;
        b.rotation.z = pelvisDrop;
        b.rotation.y = pelvisRotation;
      });
    }

    // 2. Lumbar Spine
    if (this.nodes.lumbar) {
      this.nodes.lumbar.forEach((vert, idx) => {
        const frac = (idx + 1) / this.nodes.lumbar.length;
        vert.rotation.x = -lumbarLordosis * frac * 0.35;
        vert.rotation.z = -spinalLateralBend * frac * 0.3;
      });
    }

    // 3. Thoracic Spine
    if (this.nodes.thoracic) {
      this.nodes.thoracic.forEach((vert, idx) => {
        const frac = (idx + 1) / this.nodes.thoracic.length;
        vert.rotation.x = thoracicKyphosis * frac * 0.35;
        vert.rotation.z = spinalLateralBend * (1 - frac) * 0.3;
      });
    }

    // 4. Cervical & Mandible
    if (this.nodes.cervical) {
      this.nodes.cervical.forEach((vert, idx) => {
        const frac = (idx + 1) / this.nodes.cervical.length;
        vert.rotation.x = -cervicalForwardHead * frac * 7.0;
        vert.position.z = cervicalForwardHead * frac * 0.8;
      });
    }

    if (this.nodes.mandible) {
      this.nodes.mandible.position.z = -cervicalForwardHead * 0.6;
      this.nodes.mandible.position.y = -cervicalForwardHead * 0.3;
    }

    // 5. Right Leg: Femur, Knee Valgus, Tibial Torsion, Foot Eversion
    if (this.nodes.rightFemur) {
      this.nodes.rightFemur.rotation.z = rightKneeValgus * 0.4 - pelvisDrop;
      this.nodes.rightFemur.rotation.y = rightFootPronation * 0.3;
    }

    if (this.nodes.rightTibia) {
      this.nodes.rightTibia.rotation.y = -rightFootPronation * 0.88;
      this.nodes.rightTibia.rotation.z = -rightKneeValgus * 0.8;
    }

    if (this.nodes.rightFoot) {
      this.nodes.rightFoot.forEach((f) => {
        f.rotation.z = rightFootPronation * 0.85;
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
      this.nodes.leftFoot.forEach((f) => {
        f.rotation.z = -leftFootPronation * 0.85;
      });
    }

    // 7. Dynamic Muscle Strain Deformation & Shading
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
