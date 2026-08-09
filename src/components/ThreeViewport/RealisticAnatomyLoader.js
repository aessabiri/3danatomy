import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createMedicalMaterials } from './MedicalMaterials';
import { BiomechanicalVisualOverlays } from './BiomechanicalVisualOverlays';
import { GeometryOptimizer } from '../../utils/GeometryOptimizer';

/**
 * Universal Musculoskeletal 3D Kinematics Engine
 * Supports Z-Anatomy Full Atlas, LUMC Clinical Skeleton (3.2MB) with Complete Left/Right Mirroring,
 * and LUMC Lower-Limb & Foot Joint Deep-Dive.
 */
export class RealisticAnatomyEngine {
  constructor(scene, onProgress, onComplete, modelType = 'full_atlas') {
    this.scene = scene;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.modelType = modelType;

    this.root = new THREE.Group();
    this.root.name = 'RealisticMusculoskeletalSystem';
    this.scene.add(this.root);

    // Anatomical Materials
    this.materials = createMedicalMaterials();

    // Biomechanical Visual Vector & Laser Overlay System
    this.overlays = new BiomechanicalVisualOverlays(this.scene);

    // Geometry Optimizer for Vertex Decimation & Integrated GPU Acceleration
    this.optimizer = new GeometryOptimizer();
    this.currentVertexRatio = 1.0;

    // Lifecycle state & parameter cache
    this.isReady = false;
    this.cachedPostureParams = null;
    this.cachedOveractiveList = [];
    this.cachedUnderactiveList = [];

    // Anatomical Nodes & Meshes
    this.nodes = {};
    this.boneMeshes = [];
    this.muscleMeshes = [];
    this.interactiveObjects = [];

    this.displayMode = 'all';
    this.showVectors = true;
    this.loadModels();
  }

  // =========================================================================
  // 1. ASYNC MODEL LOADING BY SOURCE TYPE
  // =========================================================================
  async loadModels() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    try {
      this.isReady = false;
      while (this.root.children.length > 0) {
        this.root.remove(this.root.children[0]);
      }
      this.nodes = {};
      this.boneMeshes = [];
      this.muscleMeshes = [];
      this.interactiveObjects = [];
      this.optimizer.dispose();

      if (this.modelType === 'lumc_skeleton') {
        this.onProgress && this.onProgress(30, 'Loading LUMC Clinical Skeleton (3.2MB)...');
        const gltf = await this.loadGLTF(loader, '/models/lumc_skeleton.glb');
        this.assembleLUMCSkeleton(gltf.scene);
      } else if (this.modelType === 'lumc_lower_limb') {
        this.onProgress && this.onProgress(30, 'Loading LUMC Lower-Limb & Foot Joint Deep-Dive...');
        const gltf = await this.loadGLTF(loader, '/models/lumc_lower_limb.glb');
        this.assembleLUMCLowerLimb(gltf.scene);
      } else {
        this.onProgress && this.onProgress(20, 'Loading Full Skeleton...');
        const skeletonGltf = await this.loadGLTF(loader, '/models/skeleton.glb');

        this.onProgress && this.onProgress(60, 'Loading Muscular System...');
        const fullbodyGltf = await this.loadGLTF(loader, '/models/fullbody.glb');

        this.assembleFullAtlas(skeletonGltf.scene, fullbodyGltf.scene);
      }

      this.isReady = true;

      if (this.cachedPostureParams) {
        this.updatePosture(this.cachedPostureParams);
      }
      if (this.cachedOveractiveList.length || this.cachedUnderactiveList.length) {
        this.updateMuscleHeatmap(this.cachedOveractiveList, this.cachedUnderactiveList);
      }
      this.setDisplayMode(this.displayMode);

      this.onProgress && this.onProgress(100, 'Ready');
      if (this.onComplete) this.onComplete(this);
    } catch (err) {
      console.error('Error loading anatomical model assets:', err);
    }
  }

  loadGLTF(loader, url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  // =========================================================================
  // 2A. ASSEMBLE FULL ATLAS (Z-ANATOMY SKELETON + MUSCLES)
  // =========================================================================
  assembleFullAtlas(skeletonScene, fullbodyScene) {
    const humanGroup = new THREE.Group();
    humanGroup.name = 'HumanAnatomyGroup';
    humanGroup.add(skeletonScene);
    humanGroup.add(fullbodyScene);
    this.root.add(humanGroup);
    this.humanGroup = humanGroup;

    skeletonScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = child.name.toLowerCase();
        if (name.includes('cartilage') || name.includes('disc') || name.includes('meniscus')) {
          child.material = this.materials.hyalineCartilage;
        } else {
          child.material = this.materials.corticalBone;
        }
        let key = this.categorizeAnatomyKey(child.name);
        this.boneMeshes.push(child);
        this.optimizer.registerMesh(child); // Tracks UUID across left/right shared geometries
        this.registerInteractive(child, key, child.name.replace(/\.g|\.r|\.l/g, ''));
      }
    });

    fullbodyScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = this.materials.striatedMuscle.clone();
        let key = this.categorizeAnatomyKey(child.name);
        this.muscleMeshes.push({
          id: child.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: child.name.replace(/\.g|\.r|\.l/g, ''),
          mesh: child,
        });
        this.optimizer.registerMesh(child);
        this.registerInteractive(child, key, child.name.replace(/\.g|\.r|\.l/g, ''));
      }
    });

    this.normalizeModelScale(humanGroup, 1.75, -0.92);
    this.cacheKinematicNodesFullAtlas(skeletonScene, fullbodyScene);
    this.buildPlumbLines();
  }

  // =========================================================================
  // 2B. ASSEMBLE LUMC CLINICAL SKELETON WITH COMPLETE LEFT/RIGHT SYMMETRY
  // =========================================================================
  assembleLUMCSkeleton(skeletonScene) {
    const humanGroup = new THREE.Group();
    humanGroup.name = 'LUMCSkeletonGroup';
    humanGroup.add(skeletonScene);
    this.root.add(humanGroup);
    this.humanGroup = humanGroup;

    // SKELETAL MIRRORING: Clone right limb & ribcage groups to generate full bilateral anatomy
    const mirrorGroup = (rightGroupName, leftGroupName) => {
      const rightGroup = skeletonScene.getObjectByName(rightGroupName);
      if (rightGroup) {
        const leftGroup = rightGroup.clone(true);
        leftGroup.name = leftGroupName;
        leftGroup.scale.x = -leftGroup.scale.x; // Mirror across sagittal plane

        leftGroup.traverse((child) => {
          if (child.name) {
            child.name = child.name.replace(/\.r$/g, '.l').replace(/\.r\./g, '.l.').replace(/_right/g, '_left');
          }
          if (child.isMesh) {
            // Clone geometry to ensure independent normal winding
            child.geometry = child.geometry.clone();
          }
        });
        skeletonScene.add(leftGroup);
      }
    };

    mirrorGroup('Bones_right', 'Bones_left');
    mirrorGroup('Cartilages_right', 'Cartilages_left');

    skeletonScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = child.name.toLowerCase();
        if (name.includes('cart') || name.includes('disc') || name.includes('meniscus')) {
          child.material = this.materials.hyalineCartilage;
        } else {
          child.material = this.materials.corticalBone;
        }
        let key = this.categorizeAnatomyKey(child.name);
        this.boneMeshes.push(child);
        this.optimizer.registerMesh(child);
        this.registerInteractive(child, key, child.name.replace(/\.r|\.l/g, ''));
      }
    });

    this.normalizeModelScale(humanGroup, 1.75, -0.92);
    this.cacheKinematicNodesLUMCSkeleton(skeletonScene);
    this.buildPlumbLines();
  }

  // =========================================================================
  // 2C. ASSEMBLE LUMC LOWER-LIMB & FOOT JOINT DEEP-DIVE
  // =========================================================================
  assembleLUMCLowerLimb(limbScene) {
    const limbGroup = new THREE.Group();
    limbGroup.name = 'LUMCLowerLimbGroup';
    limbGroup.add(limbScene);
    this.root.add(limbGroup);
    this.humanGroup = limbGroup;

    limbScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const name = child.name.toLowerCase();

        if (name.includes('muscle') || name.includes('interossei') || name.includes('hallucis') || name.includes('digiti')) {
          child.material = this.materials.striatedMuscle.clone();
          this.muscleMeshes.push({
            id: child.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: child.name.replace(/\.r|\.l/g, ''),
            mesh: child,
          });
        } else if (name.includes('ligament') || name.includes('tract') || name.includes('tendon') || name.includes('retinaculum')) {
          child.material = this.materials.hyalineCartilage.clone();
        } else if (name.includes('cart') || name.includes('meniscus') || name.includes('fat pad') || name.includes('bursa')) {
          child.material = this.materials.hyalineCartilage;
        } else {
          child.material = this.materials.corticalBone;
          this.boneMeshes.push(child);
        }

        let key = this.categorizeAnatomyKey(child.name);
        this.optimizer.registerMesh(child);
        this.registerInteractive(child, key, child.name.replace(/\.r|\.l/g, ''));
      }
    });

    this.normalizeModelScale(limbGroup, 1.0, -0.92);
    this.cacheKinematicNodesLUMCLowerLimb(limbScene);
    this.buildPlumbLines();
  }

  normalizeModelScale(group, targetHeight, targetYOffset) {
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const currentHeight = size.y > 0 ? size.y : 1.75;
    const scaleFactor = targetHeight / currentHeight;

    group.scale.set(scaleFactor, scaleFactor, scaleFactor);
    group.position.x = -center.x * scaleFactor;
    group.position.z = -center.z * scaleFactor;
    group.position.y = -box.min.y * scaleFactor + targetYOffset;
  }

  categorizeAnatomyKey(rawName) {
    const name = (rawName || '').toLowerCase();
    if (name.includes('lumbar')) return 'spine_lumbar';
    if (name.includes('thoracic') || name.includes('rib') || name.includes('sternum')) return 'spine_thoracic';
    if (name.includes('cervical') || name.includes('cranium') || name.includes('mandible') || name.includes('atlas') || name.includes('axis')) return 'spine_cervical';
    if (name.includes('tibia') || name.includes('calcaneus') || name.includes('foot') || name.includes('talus') || name.includes('navicular')) return 'tibialis_posterior';
    if (name.includes('gluteus medius')) return 'gluteus_medius';
    if (name.includes('gluteus maximus')) return 'gluteus_maximus';
    if (name.includes('quadratus lumborum')) return 'quadratus_lumborum';
    if (name.includes('psoas') || name.includes('iliopsoas')) return 'iliopsoas';
    return 'pelvis';
  }

  // =========================================================================
  // 3. CACHE KINEMATIC NODES
  // =========================================================================
  cacheKinematicNodesFullAtlas(skeletonScene, fullbodyScene) {
    const reg = (key, obj) => {
      if (!obj) return;
      this.nodes[key] = { obj, basePos: obj.position.clone(), baseQuat: obj.quaternion.clone(), baseScale: obj.scale.clone() };
    };

    reg('skelHead', skeletonScene.getObjectByName('Cranium.g'));
    reg('skelFace', skeletonScene.getObjectByName('Extracranial bones of head.g'));
    reg('skelMandible', skeletonScene.getObjectByName('Mandible'));
    reg('skelCervical', skeletonScene.getObjectByName('Cervical vertebrae.g'));
    reg('skelThoracic', skeletonScene.getObjectByName('Thoracic vertebrae.g'));
    reg('skelRibs', skeletonScene.getObjectByName('Thoracic skeleton.g'));
    reg('skelLumbar', skeletonScene.getObjectByName('Lumbar vertebrae.g'));
    reg('skelUpperLimbs', skeletonScene.getObjectByName('Bones of upper limb.g'));
    reg('skelPelvis', skeletonScene.getObjectByName('Bones of pelvic girdle.g'));
    reg('skelLowerLimbs', skeletonScene.getObjectByName('Bones of free part of lower limb.g'));
    reg('skelFeet', skeletonScene.getObjectByName('Bones of foot.g'));

    // Right Limbs
    reg('skelRightTibia', skeletonScene.getObjectByName('Tibia.r'));
    reg('skelRightFibula', skeletonScene.getObjectByName('Fibula.r'));
    reg('skelRightFemur', skeletonScene.getObjectByName('Femur.r'));
    reg('skelRightPatella', skeletonScene.getObjectByName('Patella.r'));
    reg('skelRightTalus', skeletonScene.getObjectByName('Talus.r'));
    reg('skelRightCalcaneus', skeletonScene.getObjectByName('Calcaneus.r'));
    reg('skelRightNavicular', skeletonScene.getObjectByName('Medial cuneiform bone.r'));

    // Left Limbs
    reg('skelLeftTibia', skeletonScene.getObjectByName('Tibia.l'));
    reg('skelLeftFibula', skeletonScene.getObjectByName('Fibula.l'));
    reg('skelLeftFemur', skeletonScene.getObjectByName('Femur.l'));
    reg('skelLeftPatella', skeletonScene.getObjectByName('Patella.l'));
    reg('skelLeftTalus', skeletonScene.getObjectByName('Talus.l'));
    reg('skelLeftCalcaneus', skeletonScene.getObjectByName('Calcaneus.l'));
    reg('skelLeftNavicular', skeletonScene.getObjectByName('Medial cuneiform bone.l'));

    reg('muscDorsal', fullbodyScene.getObjectByName('Dorsal part of muscular system.g'));
    reg('muscThorax', fullbodyScene.getObjectByName('Thoracic part of muscular system.g'));
    reg('muscAbs', fullbodyScene.getObjectByName('Abdominal part of muscular system.g'));
    reg('muscUpperLimbs', fullbodyScene.getObjectByName('Muscular system of upper limb.g'));
    reg('muscLowerLimbs', fullbodyScene.getObjectByName('Muscular system of lower limb.g'));
    reg('muscGlutes', fullbodyScene.getObjectByName('Superficial gluteal muscles.g'));
  }

  cacheKinematicNodesLUMCSkeleton(scene) {
    const reg = (key, obj) => {
      if (!obj) return;
      this.nodes[key] = { obj, basePos: obj.position.clone(), baseQuat: obj.quaternion.clone(), baseScale: obj.scale.clone() };
    };

    // Mandible & Head
    reg('skelMandible', scene.getObjectByName('Mandible bone'));
    reg('skelHead', scene.getObjectByName('Occipital bone') || scene.getObjectByName('Frontal bone'));

    // Pelvis & Spine
    reg('skelPelvisRight', scene.getObjectByName('Hip bone.r'));
    reg('skelPelvisLeft', scene.getObjectByName('Hip bone.l'));
    reg('skelSacrum', scene.getObjectByName('Sacrum'));
    reg('skelLumbar', scene.getObjectByName('Lumbar vertebrae (L3)') || scene.getObjectByName('Lumbar vertebrae (L1)'));
    reg('skelThoracic', scene.getObjectByName('Thoracic vertebrae (T6)') || scene.getObjectByName('Thoracic vertebrae (T1)'));
    reg('skelCervical', scene.getObjectByName('Cervical vertebrae (C5)') || scene.getObjectByName('Atlas (C1)'));

    // Right Limbs
    reg('skelRightFemur', scene.getObjectByName('Femur.r'));
    reg('skelRightTibia', scene.getObjectByName('Tibia.r'));
    reg('skelRightFibula', scene.getObjectByName('Fibula.r'));
    reg('skelRightPatella', scene.getObjectByName('Patella.r'));
    reg('skelRightTalus', scene.getObjectByName('Talus.r'));
    reg('skelRightCalcaneus', scene.getObjectByName('Calcaneus.r'));
    reg('skelRightNavicular', scene.getObjectByName('Navicular bone.r') || scene.getObjectByName('Medial cuneiform bone.r'));
    reg('skelRightFoot', scene.getObjectByName('First metatarsal bone.r') || scene.getObjectByName('Calcaneus.r'));

    // Left Limbs (Mirrored)
    reg('skelLeftFemur', scene.getObjectByName('Femur.l'));
    reg('skelLeftTibia', scene.getObjectByName('Tibia.l'));
    reg('skelLeftFibula', scene.getObjectByName('Fibula.l'));
    reg('skelLeftPatella', scene.getObjectByName('Patella.l'));
    reg('skelLeftTalus', scene.getObjectByName('Talus.l'));
    reg('skelLeftCalcaneus', scene.getObjectByName('Calcaneus.l'));
    reg('skelLeftNavicular', scene.getObjectByName('Navicular bone.l') || scene.getObjectByName('Medial cuneiform bone.l'));
    reg('skelLeftFoot', scene.getObjectByName('First metatarsal bone.l') || scene.getObjectByName('Calcaneus.l'));
  }

  cacheKinematicNodesLUMCLowerLimb(scene) {
    const reg = (key, obj) => {
      if (!obj) return;
      this.nodes[key] = { obj, basePos: obj.position.clone(), baseQuat: obj.quaternion.clone(), baseScale: obj.scale.clone() };
    };

    reg('skelPelvis', scene.getObjectByName('Art cart of hip bone pubis.r') || scene.getObjectByName('Plexus lumbaris.r'));
    reg('skelRightFemur', scene.getObjectByName('Art cart of femur head.r') || scene.getObjectByName('Ligament of head of femur.r'));
    reg('skelRightTibia', scene.getObjectByName('Art cart of tibia proximal end.r') || scene.getObjectByName('Anterior tibial artery.r'));
    reg('skelRightPatella', scene.getObjectByName('Art cart of patella.r') || scene.getObjectByName('Quadriceps common tendon and patellar ligament.r'));
    reg('skelRightTalus', scene.getObjectByName('Art cart of talus.r ​') || scene.getObjectByName('Talonavicular ligament.r'));
    reg('skelRightCalcaneus', scene.getObjectByName('Art cart of calcaneus.r') || scene.getObjectByName('Plantar calcaneonavicular ligament.r'));
    reg('skelRightNavicular', scene.getObjectByName('Art cart of navicular bone.r') || scene.getObjectByName('Plantar calcaneonavicular ligament.r'));
  }

  // =========================================================================
  // 4. PLUMB LINE SYSTEM
  // =========================================================================
  buildPlumbLines() {
    this.plumbLineGroup = new THREE.Group();
    this.plumbLineGroup.name = 'PlumbLineSystem';
    this.root.add(this.plumbLineGroup);

    const points = [new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0, -0.95, 0)];
    const plumbGeo = new THREE.BufferGeometry().setFromPoints(points);
    const plumbMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2, transparent: true, opacity: 0.85 });
    this.plumbLine = new THREE.Line(plumbGeo, plumbMat);
    this.plumbLineGroup.add(this.plumbLine);

    const markerGeo = new THREE.RingGeometry(0.035, 0.045, 24);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });

    const heights = [0.75, 0.45, 0.0, -0.45, -0.88];
    heights.forEach((y) => {
      const ring = new THREE.Mesh(markerGeo, markerMat);
      ring.position.set(0, y, 0);
      ring.rotation.y = Math.PI / 2;
      this.plumbLineGroup.add(ring);
    });
  }

  // =========================================================================
  // 5. INTERACTIVE RAYCAST REGISTRATION
  // =========================================================================
  registerInteractive(mesh, anatomyKey, labelName) {
    mesh.userData = { isInteractive: true, anatomyKey, labelName };
    this.interactiveObjects.push(mesh);
  }

  // =========================================================================
  // 6. TRUE 3D WORLD-SPACE KINEMATICS (BILATERAL SYMMETRIC SUPPORT)
  // =========================================================================
  updatePosture(params = {}) {
    this.cachedPostureParams = params;
    if (!this.isReady) return;

    const {
      pelvisTilt = 0,
      pelvisDrop = 0,
      pelvisRotation = 0,
      lumbarLordosis = 0,
      thoracicKyphosis = 0,
      spinalLateralBend = 0,
      cervicalForwardHead = 0,
      leftKneeValgus = 0,
      rightKneeValgus = 0,
      leftFootPronation = 0,
      rightFootPronation = 0,
      leftShoulderProtraction = 0,
      rightShoulderProtraction = 0,
    } = params;

    const applyWorldTransform = (nodeKey, { pitch = 0, yaw = 0, roll = 0 }, posOffset = null) => {
      const n = this.nodes[nodeKey];
      if (!n || !n.obj) return;
      n.obj.quaternion.copy(n.baseQuat);
      if (pitch) n.obj.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), pitch);
      if (yaw) n.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), yaw);
      if (roll) n.obj.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), roll);

      n.obj.position.copy(n.basePos);
      if (posOffset) {
        n.obj.position.x += posOffset[0];
        n.obj.position.y += posOffset[1];
        n.obj.position.z += posOffset[2];
      }
    };

    // 1. PELVIS TILT & DROPPED HIP (Full Atlas & LUMC Skeleton)
    applyWorldTransform('skelPelvis', { pitch: pelvisTilt * 1.2, yaw: pelvisRotation * 0.8, roll: pelvisDrop * 1.5 }, [0, -Math.abs(pelvisDrop) * 2.0, 0]);
    applyWorldTransform('muscGlutes', { pitch: pelvisTilt * 1.2, yaw: pelvisRotation * 0.8, roll: pelvisDrop * 1.5 }, [0, -Math.abs(pelvisDrop) * 2.0, 0]);

    // LUMC Specific Pelvis Nodes
    applyWorldTransform('skelPelvisRight', { pitch: pelvisTilt * 1.2, yaw: pelvisRotation * 0.8, roll: pelvisDrop * 1.5 }, [0, -pelvisDrop * 2.5, 0]);
    applyWorldTransform('skelPelvisLeft', { pitch: pelvisTilt * 1.2, yaw: pelvisRotation * 0.8, roll: pelvisDrop * 1.5 }, [0, pelvisDrop * 2.5, 0]);
    applyWorldTransform('skelSacrum', { pitch: pelvisTilt * 1.2, yaw: pelvisRotation * 0.8, roll: pelvisDrop * 0.8 });

    // 2. LUMBAR SPINE
    applyWorldTransform('skelLumbar', { pitch: -lumbarLordosis * 1.2, yaw: -pelvisRotation * 0.5, roll: -spinalLateralBend * 1.2 });
    applyWorldTransform('muscAbs', { pitch: -lumbarLordosis * 0.8, yaw: -pelvisRotation * 0.3, roll: -spinalLateralBend * 0.8 });

    // 3. THORACIC SPINE KYPHOSIS
    applyWorldTransform('skelThoracic', { pitch: thoracicKyphosis * 1.4, yaw: 0, roll: spinalLateralBend * 0.8 });
    applyWorldTransform('skelRibs', { pitch: thoracicKyphosis * 1.2, yaw: 0, roll: spinalLateralBend * 0.6 });
    applyWorldTransform('muscThorax', { pitch: thoracicKyphosis * 1.2, yaw: 0, roll: spinalLateralBend * 0.6 });
    applyWorldTransform('muscDorsal', { pitch: thoracicKyphosis * 1.3, yaw: 0, roll: spinalLateralBend * 0.8 });

    // 4. CERVICAL & FORWARD HEAD
    applyWorldTransform('skelCervical', { pitch: -cervicalForwardHead * 1.1, yaw: 0, roll: 0 }, [0, 0, cervicalForwardHead * 18]);
    applyWorldTransform('skelHead', { pitch: cervicalForwardHead * 0.6, yaw: 0, roll: 0 }, [0, -cervicalForwardHead * 2, cervicalForwardHead * 22]);
    applyWorldTransform('skelFace', { pitch: cervicalForwardHead * 0.6, yaw: 0, roll: 0 }, [0, -cervicalForwardHead * 2, cervicalForwardHead * 22]);

    // 5. MANDIBLE (JAW RETRACTION)
    if (cervicalForwardHead > 0.05) {
      applyWorldTransform('skelMandible', { pitch: cervicalForwardHead * 0.4, yaw: 0, roll: 0 }, [0, -cervicalForwardHead * 8.0, -cervicalForwardHead * 9.0 + cervicalForwardHead * 22]);
    } else {
      applyWorldTransform('skelMandible', { pitch: 0, yaw: 0, roll: 0 });
    }

    // 6. SHOULDERS
    applyWorldTransform('skelUpperLimbs', { pitch: (rightShoulderProtraction + leftShoulderProtraction) * 0.6, yaw: (rightShoulderProtraction - leftShoulderProtraction) * 0.5, roll: 0 });
    applyWorldTransform('muscUpperLimbs', { pitch: (rightShoulderProtraction + leftShoulderProtraction) * 0.6, yaw: (rightShoulderProtraction - leftShoulderProtraction) * 0.5, roll: 0 });

    // 7. RIGHT TIBIAL TORSION & RIGHT KNEE VALGUS
    applyWorldTransform('skelRightTibia', { pitch: 0, yaw: -rightFootPronation * 1.5, roll: rightKneeValgus * 1.2 }, [-rightKneeValgus * 1.2, 0, 0]);
    applyWorldTransform('skelRightFibula', { pitch: 0, yaw: -rightFootPronation * 1.5, roll: rightKneeValgus * 1.2 }, [-rightKneeValgus * 1.2, 0, 0]);
    applyWorldTransform('skelRightFemur', { pitch: 0, yaw: rightFootPronation * 0.6, roll: -rightKneeValgus * 1.0 });

    // 8. RIGHT FOOT ARCH DROP (PES PLANUS)
    applyWorldTransform('skelRightTalus', { pitch: 0, yaw: -rightFootPronation * 1.6, roll: rightFootPronation * 1.4 }, [rightFootPronation * 0.8, -rightFootPronation * 1.2, 0]);
    applyWorldTransform('skelRightCalcaneus', { pitch: 0, yaw: -rightFootPronation * 1.6, roll: rightFootPronation * 1.4 }, [rightFootPronation * 0.8, -rightFootPronation * 1.2, 0]);
    applyWorldTransform('skelRightNavicular', { pitch: 0, yaw: -rightFootPronation * 1.4, roll: rightFootPronation * 1.5 }, [rightFootPronation * 1.2, -rightFootPronation * 2.8, 0]);
    applyWorldTransform('skelRightFoot', { pitch: 0, yaw: -rightFootPronation * 1.4, roll: rightFootPronation * 1.2 });

    // 9. LEFT KNEE & LEFT FOOT
    applyWorldTransform('skelLeftTibia', { pitch: 0, yaw: leftFootPronation * 1.5, roll: -leftKneeValgus * 1.2 }, [leftKneeValgus * 1.2, 0, 0]);
    applyWorldTransform('skelLeftFibula', { pitch: 0, yaw: leftFootPronation * 1.5, roll: -leftKneeValgus * 1.2 }, [leftKneeValgus * 1.2, 0, 0]);
    applyWorldTransform('skelLeftFemur', { pitch: 0, yaw: -leftFootPronation * 0.6, roll: leftKneeValgus * 1.0 });
    applyWorldTransform('skelLeftTalus', { pitch: 0, yaw: leftFootPronation * 1.6, roll: -leftFootPronation * 1.4 }, [-leftFootPronation * 0.8, -leftFootPronation * 1.2, 0]);
    applyWorldTransform('skelLeftCalcaneus', { pitch: 0, yaw: leftFootPronation * 1.6, roll: -leftFootPronation * 1.4 }, [-leftFootPronation * 0.8, -leftFootPronation * 1.2, 0]);
    applyWorldTransform('skelLeftNavicular', { pitch: 0, yaw: leftFootPronation * 1.4, roll: -leftFootPronation * 1.5 }, [-leftFootPronation * 1.2, -leftFootPronation * 2.8, 0]);
    applyWorldTransform('skelLeftFoot', { pitch: 0, yaw: leftFootPronation * 1.4, roll: -leftFootPronation * 1.2 });

    applyWorldTransform('skelFeet', { pitch: 0, yaw: -rightFootPronation * 0.8, roll: rightFootPronation * 0.6 });

    if (this.overlays) {
      this.overlays.update(params);
    }
  }

  // =========================================================================
  // 7. MUSCLE HEATMAP
  // =========================================================================
  updateMuscleHeatmap(overactiveList = [], underactiveList = []) {
    this.cachedOveractiveList = overactiveList;
    this.cachedUnderactiveList = underactiveList;
    if (!this.isReady) return;

    const tightMap = new Set(overactiveList.map((m) => m.id.toLowerCase().replace(/[^a-z0-9]/g, '')));
    const weakMap = new Set(underactiveList.map((m) => m.id.toLowerCase().replace(/[^a-z0-9]/g, '')));

    this.muscleMeshes.forEach((item) => {
      const cleanId = item.id.replace(/[^a-z0-9]/g, '');
      let isTight = false;
      let isWeak = false;

      for (let tId of tightMap) {
        if (cleanId.includes(tId) || tId.includes(cleanId) || item.name.toLowerCase().includes(tId)) {
          isTight = true;
          break;
        }
      }
      if (!isTight) {
        for (let wId of weakMap) {
          if (cleanId.includes(wId) || wId.includes(cleanId) || item.name.toLowerCase().includes(wId)) {
            isWeak = true;
            break;
          }
        }
      }

      if (this.displayMode === 'xray') {
        item.mesh.material = this.materials.xrayMuscle;
      } else if (isTight) {
        item.mesh.material = this.materials.muscleTight;
      } else if (isWeak) {
        item.mesh.material = this.materials.muscleWeak;
      } else {
        item.mesh.material = this.materials.striatedMuscle;
      }
    });
  }

  // =========================================================================
  // 8. DISPLAY MODE
  // =========================================================================
  setDisplayMode(mode) {
    this.displayMode = mode;
    if (!this.isReady) return;

    const showBones = mode === 'all' || mode === 'skeleton' || mode === 'xray';
    const showMuscles = mode === 'all' || mode === 'muscles' || mode === 'xray';
    const isXray = mode === 'xray';

    this.boneMeshes.forEach((bone) => {
      bone.visible = showBones;
      if (isXray) {
        bone.material = this.materials.xrayBone;
      } else {
        const name = bone.name.toLowerCase();
        if (name.includes('cart') || name.includes('disc') || name.includes('meniscus')) {
          bone.material = this.materials.hyalineCartilage;
        } else {
          bone.material = this.materials.corticalBone;
        }
      }
    });

    this.muscleMeshes.forEach((item) => {
      item.mesh.visible = showMuscles;
      if (isXray) {
        item.mesh.material = this.materials.xrayMuscle;
      } else {
        item.mesh.material = this.materials.striatedMuscle;
      }
    });
  }

  // =========================================================================
  // 9. DYNAMIC MODEL SWITCHER & VERTEX DECIMATION
  // =========================================================================
  async switchModel(modelType) {
    if (this.modelType === modelType) return;
    this.modelType = modelType;
    await this.loadModels();
  }

  setVertexResolution(ratio) {
    this.currentVertexRatio = ratio;
    if (!this.optimizer || !this.isReady) return { totalVertices: 0, totalTriangles: 0 };
    return this.optimizer.applyVertexResolution(ratio);
  }

  getGeometryStats() {
    if (!this.optimizer || !this.isReady) return { totalVertices: 0, totalTriangles: 0 };
    return this.optimizer.getStats();
  }

  // =========================================================================
  // 10. DISPOSAL
  // =========================================================================
  dispose() {
    this.scene.remove(this.root);
    if (this.overlays) this.overlays.dispose();
    if (this.optimizer) this.optimizer.dispose();
    Object.values(this.materials).forEach((mat) => mat.dispose());
  }
}
