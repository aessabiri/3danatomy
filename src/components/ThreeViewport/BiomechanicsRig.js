import * as THREE from 'three';
import { KineticChainSolver } from '../../utils/KineticChainSolver';

/**
 * Procedural Interconnected Biomechanical Musculoskeletal Rig
 * High-precision anatomical skeleton and muscle network with dynamic kinematic closed-chain deformation.
 */
export class BiomechanicsRig {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'MusculoskeletalRig';
    this.scene.add(this.root);

    // Anatomical nodes map for kinematics & raycast picking
    this.joints = {};
    this.bones = [];
    this.muscles = [];
    this.fascialLines = [];
    this.interactiveObjects = [];

    // Materials
    this.materials = this.initMaterials();

    // Build the anatomical structure
    this.buildSkeleton();
    this.buildMuscles();
    this.buildPlumbLines();

    // Default neutral state cache
    this.currentMode = 'all';
  }

  initMaterials() {
    return {
      bone: new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.35,
        metalness: 0.08,
        name: 'BoneMaterial',
      }),
      boneJoint: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.25,
        metalness: 0.15,
      }),
      cartilage: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.8,
      }),
      muscleNormal: new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.55,
        metalness: 0.05,
        transparent: true,
        opacity: 0.9,
      }),
      muscleTight: new THREE.MeshStandardMaterial({
        color: 0xff1e56,
        roughness: 0.4,
        emissive: 0x880828,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.95,
      }),
      muscleWeak: new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.6,
        emissive: 0x083344,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.9,
      }),
      tendon: new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        roughness: 0.3,
        metalness: 0.05,
      }),
      xrayBone: new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        transmission: 0.7,
        thickness: 1.2,
        emissive: 0x0369a1,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.85,
      }),
      xrayMuscle: new THREE.MeshPhysicalMaterial({
        color: 0xa855f7,
        roughness: 0.2,
        transmission: 0.85,
        thickness: 0.8,
        emissive: 0x581c87,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.45,
      }),
      plumbLine: new THREE.LineBasicMaterial({
        color: 0x10b981,
        linewidth: 2,
        transparent: true,
        opacity: 0.8,
      }),
      laserGuide: new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.05,
        gapSize: 0.03,
        transparent: true,
        opacity: 0.6,
      }),
    };
  }

  // =========================================================================
  // SKELETON BUILDER
  // =========================================================================
  buildSkeleton() {
    const mat = this.materials.bone;
    const jointMat = this.materials.boneJoint;
    const discMat = this.materials.cartilage;

    // --- BASE ROOT PIVOT (Pelvis Center) ---
    const pelvisPivot = new THREE.Group();
    pelvisPivot.position.set(0, 0.92, 0);
    this.root.add(pelvisPivot);
    this.joints.pelvis = pelvisPivot;

    // Pelvic Girdle
    const pelvisGroup = new THREE.Group();
    pelvisPivot.add(pelvisGroup);

    // Sacrum / Coccyx
    const sacrumGeo = new THREE.ConeGeometry(0.065, 0.14, 8);
    const sacrumMesh = new THREE.Mesh(sacrumGeo, mat);
    sacrumMesh.rotation.x = Math.PI;
    sacrumMesh.position.set(0, 0.02, -0.02);
    sacrumMesh.castShadow = true;
    pelvisGroup.add(sacrumMesh);
    this.registerInteractive(sacrumMesh, 'pelvis', 'Sacrum & Coccyx');

    // Left & Right Iliac Wings
    [-1, 1].forEach((side) => {
      const iliumGeo = new THREE.TorusGeometry(0.09, 0.028, 8, 16, Math.PI * 0.9);
      const iliumMesh = new THREE.Mesh(iliumGeo, mat);
      iliumMesh.rotation.set(0.2, side * 0.3, side * 0.8);
      iliumMesh.position.set(side * 0.1, 0.03, 0);
      iliumMesh.castShadow = true;
      pelvisGroup.add(iliumMesh);
      this.registerInteractive(iliumMesh, 'pelvis', side === 1 ? 'Right Ilium & ASIS' : 'Left Ilium & ASIS');

      const ischiumGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.12, 8);
      const ischiumMesh = new THREE.Mesh(ischiumGeo, mat);
      ischiumMesh.rotation.set(0.6, 0, side * 0.4);
      ischiumMesh.position.set(side * 0.06, -0.08, 0.01);
      ischiumMesh.castShadow = true;
      pelvisGroup.add(ischiumMesh);
    });

    // --- VERTEBRAL COLUMN (Spine) ---
    // Lumbar (L5 -> L1)
    this.joints.lumbar = [];
    let currentSpineParent = pelvisPivot;
    for (let i = 0; i < 5; i++) {
      const vertNode = new THREE.Group();
      vertNode.position.set(0, i === 0 ? 0.08 : 0.045, 0);
      currentSpineParent.add(vertNode);
      this.joints.lumbar.push(vertNode);

      const vertMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.036 - i * 0.002, 0.038 - i * 0.002, 0.035, 12), mat);
      vertMesh.castShadow = true;
      vertNode.add(vertMesh);
      this.registerInteractive(vertMesh, 'spine_lumbar', `Lumbar Vertebra L${5 - i}`);

      const spinous = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.018, 0.04), mat);
      spinous.position.set(0, 0, -0.035);
      spinous.rotation.x = -0.3;
      vertNode.add(spinous);

      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.037, 0.01, 12), discMat);
      disc.position.set(0, -0.02, 0);
      vertNode.add(disc);

      currentSpineParent = vertNode;
    }

    // Thoracic Spine (T12 -> T1) & Ribcage
    this.joints.thoracic = [];
    for (let i = 0; i < 10; i++) {
      const vertNode = new THREE.Group();
      vertNode.position.set(0, 0.038, 0);
      currentSpineParent.add(vertNode);
      this.joints.thoracic.push(vertNode);

      const vertMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.03, 10), mat);
      vertMesh.castShadow = true;
      vertNode.add(vertMesh);
      this.registerInteractive(vertMesh, 'spine_thoracic', `Thoracic Vertebra T${12 - i}`);

      if (i >= 1 && i <= 8) {
        [-1, 1].forEach((side) => {
          const ribCurve = new THREE.TorusGeometry(0.11 + Math.sin((i / 8) * Math.PI) * 0.06, 0.012, 6, 16, Math.PI * 0.85);
          const ribMesh = new THREE.Mesh(ribCurve, mat);
          ribMesh.rotation.set(Math.PI / 2 + 0.15, side * 0.1, side * (Math.PI / 2));
          ribMesh.position.set(side * 0.02, 0, 0.01);
          ribMesh.scale.set(1, 0.8, 0.7);
          vertNode.add(ribMesh);
        });
      }

      currentSpineParent = vertNode;
    }

    // Sternum (Chest bone)
    const sternumMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.02), mat);
    sternumMesh.position.set(0, 0.15, 0.14);
    this.joints.thoracic[5].add(sternumMesh);
    this.registerInteractive(sternumMesh, 'spine_thoracic', 'Sternum & Costal Cartilages');

    // Cervical Spine (C7 -> C1) & Head
    this.joints.cervical = [];
    for (let i = 0; i < 5; i++) {
      const vertNode = new THREE.Group();
      vertNode.position.set(0, 0.032, 0);
      currentSpineParent.add(vertNode);
      this.joints.cervical.push(vertNode);

      const vertMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.025, 8), mat);
      vertMesh.castShadow = true;
      vertNode.add(vertMesh);
      this.registerInteractive(vertMesh, 'spine_cervical', `Cervical Vertebra C${7 - i}`);

      currentSpineParent = vertNode;
    }

    // Head / Skull Group
    const headNode = new THREE.Group();
    headNode.position.set(0, 0.06, 0.02);
    currentSpineParent.add(headNode);
    this.joints.head = headNode;

    const skullMesh = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 16), mat);
    skullMesh.scale.set(0.9, 1.1, 1.05);
    skullMesh.position.set(0, 0.06, 0);
    skullMesh.castShadow = true;
    headNode.add(skullMesh);
    this.registerInteractive(skullMesh, 'spine_cervical', 'Cranium & Suboccipital Region');

    // Mandible (Jaw)
    const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.09), mat);
    jawMesh.position.set(0, -0.02, 0.03);
    headNode.add(jawMesh);
    this.joints.mandible = jawMesh;

    // --- SHOULDER GIRDLES & ARMS ---
    this.joints.shoulders = {};
    const topThoracic = this.joints.thoracic[this.joints.thoracic.length - 1];

    [-1, 1].forEach((side) => {
      const sideKey = side === 1 ? 'right' : 'left';
      const shoulderNode = new THREE.Group();
      shoulderNode.position.set(side * 0.18, 0.02, 0);
      topThoracic.add(shoulderNode);
      this.joints.shoulders[sideKey] = shoulderNode;

      const clavicleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8), mat);
      clavicleMesh.rotation.z = side * 1.4;
      clavicleMesh.position.set(side * -0.07, 0.01, 0.05);
      shoulderNode.add(clavicleMesh);
      this.registerInteractive(clavicleMesh, 'spine_thoracic', `${sideKey.toUpperCase()} Clavicle`);

      const scapulaMesh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.12, 0.08), mat);
      scapulaMesh.position.set(side * -0.03, -0.04, -0.07);
      scapulaMesh.rotation.y = side * 0.3;
      shoulderNode.add(scapulaMesh);
      this.registerInteractive(scapulaMesh, 'spine_thoracic', `${sideKey.toUpperCase()} Scapula`);

      const armNode = new THREE.Group();
      armNode.position.set(0, -0.02, 0);
      shoulderNode.add(armNode);

      const humerusMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.32, 10), mat);
      humerusMesh.position.set(0, -0.16, 0);
      humerusMesh.castShadow = true;
      armNode.add(humerusMesh);

      const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), jointMat);
      elbowMesh.position.set(0, -0.32, 0);
      armNode.add(elbowMesh);

      const forearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.28, 8), mat);
      forearmMesh.position.set(0, -0.47, 0.02);
      forearmMesh.castShadow = true;
      armNode.add(forearmMesh);
    });

    // --- LOWER EXTREMITIES ---
    this.joints.hips = {};
    this.joints.knees = {};
    this.joints.ankles = {};
    this.joints.feet = {};

    [-1, 1].forEach((side) => {
      const sideKey = side === 1 ? 'right' : 'left';

      const hipNode = new THREE.Group();
      hipNode.position.set(side * 0.11, -0.05, 0);
      pelvisPivot.add(hipNode);
      this.joints.hips[sideKey] = hipNode;

      const femHead = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), jointMat);
      hipNode.add(femHead);

      const femurGroup = new THREE.Group();
      hipNode.add(femurGroup);

      const femurMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.44, 12), mat);
      femurMesh.position.set(0, -0.22, 0);
      femurMesh.castShadow = true;
      femurGroup.add(femurMesh);
      this.registerInteractive(femurMesh, 'pelvis', `${sideKey.toUpperCase()} Femur (Thigh Bone)`);

      const kneeNode = new THREE.Group();
      kneeNode.position.set(0, -0.44, 0);
      femurGroup.add(kneeNode);
      this.joints.knees[sideKey] = kneeNode;

      const condyleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), jointMat);
      kneeNode.add(condyleMesh);

      const patellaMesh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.02), mat);
      patellaMesh.position.set(0, 0.01, 0.04);
      kneeNode.add(patellaMesh);
      this.registerInteractive(patellaMesh, 'pelvis', `${sideKey.toUpperCase()} Patella (Knee Cap)`);

      const shinGroup = new THREE.Group();
      kneeNode.add(shinGroup);

      const tibiaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.42, 12), mat);
      tibiaMesh.position.set(0, -0.21, 0);
      tibiaMesh.castShadow = true;
      shinGroup.add(tibiaMesh);
      this.registerInteractive(tibiaMesh, 'tibialis_posterior', `${sideKey.toUpperCase()} Tibia (Shin Bone)`);

      const fibulaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.40, 6), mat);
      fibulaMesh.position.set(side * 0.035, -0.21, -0.01);
      shinGroup.add(fibulaMesh);

      const ankleNode = new THREE.Group();
      ankleNode.position.set(0, -0.42, 0);
      shinGroup.add(ankleNode);
      this.joints.ankles[sideKey] = ankleNode;

      const ankleJointMesh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), jointMat);
      ankleNode.add(ankleJointMesh);

      const footGroup = new THREE.Group();
      ankleNode.add(footGroup);
      this.joints.feet[sideKey] = footGroup;

      const heelMesh = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.08), mat);
      heelMesh.position.set(0, -0.02, -0.04);
      heelMesh.castShadow = true;
      footGroup.add(heelMesh);

      const archMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.035, 0.16), mat);
      archMesh.position.set(side * 0.005, -0.025, 0.06);
      archMesh.rotation.x = -0.1;
      archMesh.castShadow = true;
      footGroup.add(archMesh);
      this.registerInteractive(archMesh, 'tibialis_posterior', `${sideKey.toUpperCase()} Foot & Medial Arch`);

      const toesMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.05), mat);
      toesMesh.position.set(side * 0.005, -0.035, 0.16);
      footGroup.add(toesMesh);
    });
  }

  // =========================================================================
  // MUSCLE SYSTEM BUILDER
  // =========================================================================
  buildMuscles() {
    this.muscles = [];

    const createMuscle = (id, name, parentNode, pos, scale, rot = [0, 0, 0], detailsKey = id) => {
      const geo = new THREE.CapsuleGeometry(0.035, 0.16, 6, 12);
      const mesh = new THREE.Mesh(geo, this.materials.muscleNormal);
      mesh.position.set(...pos);
      mesh.scale.set(...scale);
      mesh.rotation.set(...rot);
      mesh.castShadow = true;
      parentNode.add(mesh);

      const muscleObj = {
        id,
        name,
        mesh,
        baseScale: new THREE.Vector3(...scale),
        basePos: new THREE.Vector3(...pos),
        tensionState: 'normal',
      };

      this.muscles.push(muscleObj);
      this.registerInteractive(mesh, detailsKey, name);
      return muscleObj;
    };

    // Hip Flexors
    createMuscle('iliopsoas_left', 'Left Iliopsoas (Hip Flexor)', this.joints.pelvis, [-0.06, 0.04, 0.04], [0.7, 1.2, 0.7], [0.4, 0, -0.2], 'iliopsoas');
    createMuscle('iliopsoas_right', 'Right Iliopsoas (Hip Flexor)', this.joints.pelvis, [0.06, 0.04, 0.04], [0.7, 1.2, 0.7], [0.4, 0, 0.2], 'iliopsoas');

    [-1, 1].forEach((side) => {
      const sideName = side === 1 ? 'Right' : 'Left';
      const sideKey = side === 1 ? 'right' : 'left';

      createMuscle(`gluteus_maximus_${sideKey}`, `${sideName} Gluteus Maximus`, this.joints.pelvis, [side * 0.11, -0.04, -0.06], [1.3, 1.4, 1.1], [-0.3, side * 0.2, side * 0.4], 'gluteus_maximus');
      createMuscle(`gluteus_medius_${sideKey}`, `${sideName} Gluteus Medius`, this.joints.pelvis, [side * 0.14, 0.02, -0.01], [0.8, 1.1, 0.8], [0, 0, side * 0.3], 'gluteus_medius');
      createMuscle(`quadratus_lumborum_${sideKey}`, `${sideName} Quadratus Lumborum (QL)`, this.joints.lumbar[1], [side * 0.06, 0.04, -0.04], [0.65, 0.9, 0.65], [0, 0, side * 0.15], 'quadratus_lumborum');
      createMuscle(`rectus_femoris_${sideKey}`, `${sideName} Rectus Femoris (Quad)`, this.joints.hips[sideKey], [0, -0.22, 0.04], [1.1, 1.8, 0.9], [0.05, 0, 0], 'pelvis');
      createMuscle(`hamstrings_${sideKey}`, `${sideName} Hamstring Complex`, this.joints.hips[sideKey], [0, -0.22, -0.04], [1.0, 1.8, 0.9], [-0.05, 0, 0], 'pelvis');
      createMuscle(`gastrocnemius_${sideKey}`, `${sideName} Gastrocnemius / Soleus (Calf)`, this.joints.knees[sideKey], [0, -0.18, -0.03], [1.1, 1.5, 1.0], [-0.05, 0, 0], 'tibialis_posterior');
      createMuscle(`tibialis_anterior_${sideKey}`, `${sideName} Tibialis Anterior`, this.joints.knees[sideKey], [side * -0.01, -0.18, 0.03], [0.7, 1.4, 0.7], [0.05, 0, 0], 'tibialis_posterior');
    });

    createMuscle('rectus_abdominis', 'Rectus Abdominis (Six-Pack Core)', this.joints.pelvis, [0, 0.22, 0.07], [1.3, 2.0, 0.5], [0, 0, 0], 'pelvis');

    [-1, 1].forEach((side) => {
      createMuscle(`erector_spinae_${side === 1 ? 'right' : 'left'}`, `${side === 1 ? 'Right' : 'Left'} Erector Spinae`, this.joints.pelvis, [side * 0.04, 0.24, -0.05], [0.7, 2.2, 0.6], [0, 0, 0], 'spine_lumbar');
      createMuscle(`pectoralis_${side === 1 ? 'right' : 'left'}`, `${side === 1 ? 'Right' : 'Left'} Pectoralis Major/Minor`, this.joints.thoracic[5], [side * 0.08, 0.06, 0.12], [1.1, 1.0, 0.7], [0.2, side * 0.3, side * -0.4], 'pectoralis_minor');
      createMuscle(`trapezius_${side === 1 ? 'right' : 'left'}`, `${side === 1 ? 'Right' : 'Left'} Trapezius & Rhomboids`, this.joints.thoracic[7], [side * 0.07, 0.04, -0.06], [1.0, 1.4, 0.6], [-0.2, side * -0.2, side * 0.3], 'spine_thoracic');
      createMuscle(`scm_${side === 1 ? 'right' : 'left'}`, `${side === 1 ? 'Right' : 'Left'} Sternocleidomastoid (SCM)`, this.joints.cervical[2], [side * 0.035, 0.04, 0.03], [0.45, 0.9, 0.45], [0.2, side * 0.3, side * -0.3], 'spine_cervical');
    });
  }

  // =========================================================================
  // PLUMB LINE & REFERENCE
  // =========================================================================
  buildPlumbLines() {
    this.plumbLineGroup = new THREE.Group();
    this.plumbLineGroup.name = 'PlumbLineSystem';
    this.root.add(this.plumbLineGroup);

    const points = [new THREE.Vector3(0, 1.9, 0), new THREE.Vector3(0, 0, 0)];
    const plumbGeo = new THREE.BufferGeometry().setFromPoints(points);
    this.plumbLine = new THREE.Line(plumbGeo, this.materials.plumbLine);
    this.plumbLineGroup.add(this.plumbLine);

    this.plumbMarkers = [];
    const markerGeo = new THREE.RingGeometry(0.04, 0.05, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });

    const heights = [1.75, 1.45, 0.92, 0.48, 0.06];
    heights.forEach((y) => {
      const ring = new THREE.Mesh(markerGeo, markerMat);
      ring.position.set(0, y, 0);
      ring.rotation.y = Math.PI / 2;
      this.plumbLineGroup.add(ring);
      this.plumbMarkers.push(ring);
    });
  }

  registerInteractive(mesh, anatomyKey, labelName) {
    mesh.userData = { isInteractive: true, anatomyKey, labelName };
    this.interactiveObjects.push(mesh);
  }

  // =========================================================================
  // DYNAMIC POSTURE & MUSCLE REACTION UPDATE
  // =========================================================================
  updatePosture(params = {}) {
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

    // 1. Pelvis Orientation
    if (this.joints.pelvis) {
      this.joints.pelvis.rotation.x = pelvisTilt;
      this.joints.pelvis.rotation.z = pelvisDrop;
      this.joints.pelvis.rotation.y = pelvisRotation;
      this.joints.pelvis.position.y = 0.92 - Math.abs(pelvisDrop) * 0.05;
    }

    // 2. Lumbar Vertebrae Curvature
    const lumbarCount = this.joints.lumbar.length;
    this.joints.lumbar.forEach((vert, idx) => {
      const fraction = (idx + 1) / lumbarCount;
      vert.rotation.x = lumbarLordosis * fraction * 0.4;
      vert.rotation.z = spinalLateralBend * fraction * 0.35;
      vert.rotation.y = -pelvisRotation * fraction * 0.3;
    });

    // 3. Thoracic Vertebrae Curvature
    const thoracicCount = this.joints.thoracic.length;
    this.joints.thoracic.forEach((vert, idx) => {
      const fraction = (idx + 1) / thoracicCount;
      vert.rotation.x = -thoracicKyphosis * fraction * 0.35;
      vert.rotation.z = -spinalLateralBend * (1 - fraction) * 0.4;
    });

    // 4. Cervical Spine & Forward Head
    const cervicalCount = this.joints.cervical.length;
    this.joints.cervical.forEach((vert, idx) => {
      const fraction = (idx + 1) / cervicalCount;
      vert.rotation.x = cervicalForwardHead * fraction * 0.35;
      vert.position.z = cervicalForwardHead * fraction * 0.04;
    });

    if (this.joints.head) {
      this.joints.head.rotation.x = -cervicalForwardHead * 0.25;
    }

    if (this.joints.mandible) {
      this.joints.mandible.position.z = 0.03 - cervicalForwardHead * 0.05;
      this.joints.mandible.position.y = -0.02 - cervicalForwardHead * 0.03;
    }

    // 5. Shoulder Protraction
    if (this.joints.shoulders) {
      if (this.joints.shoulders.left) {
        this.joints.shoulders.left.rotation.y = -leftShoulderProtraction;
        this.joints.shoulders.left.position.y = 0.02 + leftShoulderProtraction * 0.04;
      }
      if (this.joints.shoulders.right) {
        this.joints.shoulders.right.rotation.y = rightShoulderProtraction;
        this.joints.shoulders.right.position.y = 0.02 + rightShoulderProtraction * 0.04;
      }
    }

    // 6. Knees & Foot Kinematics
    if (this.joints.hips.left && this.joints.knees.left) {
      this.joints.hips.left.rotation.z = -leftKneeValgus * 0.5 - pelvisDrop;
      this.joints.knees.left.rotation.z = leftKneeValgus * 0.8;
      this.joints.ankles.left.rotation.z = leftFootPronation * 0.6;
      this.joints.feet.left.rotation.y = leftFootPronation * 0.5;
    }

    if (this.joints.hips.right && this.joints.knees.right) {
      this.joints.hips.right.rotation.z = rightKneeValgus * 0.5 - pelvisDrop;
      this.joints.knees.right.rotation.z = -rightKneeValgus * 0.8;
      this.joints.ankles.right.rotation.z = -rightFootPronation * 0.6;
      this.joints.feet.right.rotation.y = -rightFootPronation * 0.5;
    }

    // 7. Dynamic Muscle Mesh Stretching & Bulging
    const { registry, overactive, underactive } = KineticChainSolver.calculateMuscleStrains(params);
    const strainMap = new Map(registry.map((m) => [m.id, m]));

    this.muscles.forEach((m) => {
      let matchedEntry = null;
      for (let [k, val] of strainMap) {
        if (m.id.includes(k) || k.includes(m.id)) {
          matchedEntry = val;
          break;
        }
      }

      if (matchedEntry) {
        const sf = matchedEntry.stretchFactor;
        // Dynamic deformation: stretched muscles lengthen (Y) and thin (X,Z); contracted muscles shorten and bulge
        m.mesh.scale.y = m.baseScale.y * sf;
        m.mesh.scale.x = m.baseScale.x / Math.sqrt(Math.max(0.5, sf));
        m.mesh.scale.z = m.baseScale.z / Math.sqrt(Math.max(0.5, sf));

        if (matchedEntry.state === 'tight') {
          m.mesh.material = this.materials.muscleTight;
        } else if (matchedEntry.state === 'weak') {
          m.mesh.material = this.materials.muscleWeak;
        } else {
          m.mesh.material = this.materials.muscleNormal;
        }
      }
    });
  }

  // =========================================================================
  // VIEW MODES
  // =========================================================================
  setDisplayMode(mode) {
    this.currentMode = mode;
    const showBones = mode === 'all' || mode === 'skeleton' || mode === 'xray';
    const showMuscles = mode === 'all' || mode === 'muscles' || mode === 'xray';
    const isXray = mode === 'xray';

    this.root.traverse((child) => {
      if (child.isMesh && child.userData && child.userData.anatomyKey) {
        const isMuscle = child.userData.anatomyKey.includes('muscle') ||
          child.userData.labelName?.includes('Gluteus') ||
          child.userData.labelName?.includes('Iliopsoas') ||
          child.userData.labelName?.includes('Trapezius') ||
          child.userData.labelName?.includes('Pectoralis') ||
          child.userData.labelName?.includes('Erector') ||
          child.userData.labelName?.includes('Abdominis') ||
          child.userData.labelName?.includes('Femoris') ||
          child.userData.labelName?.includes('Gastrocnemius') ||
          child.userData.labelName?.includes('Tibialis') ||
          child.userData.labelName?.includes('Hamstring') ||
          child.userData.labelName?.includes('SCM') ||
          child.userData.labelName?.includes('QL');

        if (isMuscle) {
          child.visible = showMuscles;
          if (isXray) child.material = this.materials.xrayMuscle;
        } else {
          child.visible = showBones;
          if (isXray) child.material = this.materials.xrayBone;
          else child.material = this.materials.bone;
        }
      }
    });
  }

  dispose() {
    this.scene.remove(this.root);
    Object.values(this.materials).forEach((mat) => mat.dispose());
  }
}
