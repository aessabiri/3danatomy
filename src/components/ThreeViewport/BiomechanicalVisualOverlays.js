import * as THREE from 'three';

/**
 * High-Visibility 3D Biomechanical Vectors, Lasers, Dynamic Tension Cables & Kinetic Cascade Wavefronts
 * Visualizes dynamic muscle strain, closed kinetic chain propagation, arch collapse, tibial torque, knee valgus, pelvic obliquity, and jaw traction.
 */
export class BiomechanicalVisualOverlays {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'BiomechanicalVisualOverlays';
    this.scene.add(this.root);

    this.visible = true;
    this.time = 0;
    this.gizmos = {};
    this.dynamicCables = [];

    this.initGizmos();
    this.initDynamicMyofascialCables();
    this.initKineticWavefrontPulse();
  }

  // =========================================================================
  // 1. GIZMOS (ARCH, TIBIAL TORQUE, KNEE VALGUS, PELVIC LASER, JAW TRACTION)
  // =========================================================================
  initGizmos() {
    // A. RIGHT FOOT MEDIAL ARCH COLLAPSE GUIDE
    const archGroup = new THREE.Group();
    archGroup.name = 'ArchCollapseGuide';
    this.root.add(archGroup);
    this.gizmos.archGroup = archGroup;

    // Normal Arch Reference Spline (Green dashed)
    const normalPoints = [
      new THREE.Vector3(0.09, -0.88, -0.06), // Calcaneus (heel)
      new THREE.Vector3(0.07, -0.84, 0.05),  // Navicular peak (+18mm arch)
      new THREE.Vector3(0.08, -0.88, 0.16),  // 1st Metatarsal head
    ];
    const normalGeo = new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(normalPoints).getPoints(24));
    const normalMat = new THREE.LineDashedMaterial({
      color: 0x10b981,
      dashSize: 0.015,
      gapSize: 0.01,
      linewidth: 3,
    });
    this.normalArchLine = new THREE.Line(normalGeo, normalMat);
    this.normalArchLine.computeLineDistances();
    archGroup.add(this.normalArchLine);

    // Collapsed Arch Dynamic Spline (Red/Amber)
    this.collapsedPoints = [
      new THREE.Vector3(0.12, -0.89, -0.06),
      new THREE.Vector3(0.13, -0.89, 0.05),
      new THREE.Vector3(0.14, -0.89, 0.16),
    ];
    this.collapsedArchGeo = new THREE.BufferGeometry().setFromPoints(
      new THREE.CatmullRomCurve3(this.collapsedPoints).getPoints(24)
    );
    this.collapsedArchMat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      linewidth: 4,
    });
    this.collapsedArchLine = new THREE.Line(this.collapsedArchGeo, this.collapsedArchMat);
    archGroup.add(this.collapsedArchLine);

    // B. RIGHT TIBIAL TORSION ROTATIONAL ARROW
    const torsionGroup = new THREE.Group();
    torsionGroup.position.set(0.10, -0.62, 0);
    this.root.add(torsionGroup);
    this.gizmos.torsionGroup = torsionGroup;

    const torsionArcGeo = new THREE.TorusGeometry(0.048, 0.004, 8, 24, Math.PI * 1.3);
    const torsionMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.torsionRing = new THREE.Mesh(torsionArcGeo, torsionMat);
    this.torsionRing.rotation.x = Math.PI / 2;
    torsionGroup.add(this.torsionRing);

    const arrowHeadGeo = new THREE.ConeGeometry(0.01, 0.02, 8);
    this.torsionArrowHead = new THREE.Mesh(arrowHeadGeo, torsionMat);
    this.torsionArrowHead.position.set(0.045, 0, 0.015);
    this.torsionArrowHead.rotation.set(0, -Math.PI / 4, Math.PI / 2);
    torsionGroup.add(this.torsionArrowHead);

    // C. RIGHT KNEE INWARD VALGUS FORCE VECTOR
    const valgusGroup = new THREE.Group();
    valgusGroup.position.set(0.14, -0.42, 0);
    this.root.add(valgusGroup);
    this.gizmos.valgusGroup = valgusGroup;

    const shaftGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.12, 8);
    const valgusMat = new THREE.MeshBasicMaterial({ color: 0xff1e56 });
    const shaft = new THREE.Mesh(shaftGeo, valgusMat);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(-0.06, 0, 0);
    valgusGroup.add(shaft);

    const valgusHead = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.028, 8), valgusMat);
    valgusHead.rotation.z = -Math.PI / 2;
    valgusHead.position.set(-0.12, 0, 0);
    valgusGroup.add(valgusHead);

    // D. PELVIC HORIZON LASER LINE (INTER-ASIS LEVEL GAUGE)
    const pelvicLaserGroup = new THREE.Group();
    pelvicLaserGroup.name = 'PelvicLaserLevel';
    this.root.add(pelvicLaserGroup);
    this.gizmos.pelvicLaserGroup = pelvicLaserGroup;

    const laserPoints = [
      new THREE.Vector3(-0.24, 0.02, 0.08),
      new THREE.Vector3(0.24, 0.02, 0.08),
    ];
    this.pelvicLaserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
    this.pelvicLaserMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    this.pelvicLaserLine = new THREE.Line(this.pelvicLaserGeo, this.pelvicLaserMat);
    pelvicLaserGroup.add(this.pelvicLaserLine);

    // E. JAW / MANDIBLE DOWNWARD MYOFASCIAL TRACTION CABLES
    const jawTractionGroup = new THREE.Group();
    jawTractionGroup.name = 'JawTractionCables';
    this.root.add(jawTractionGroup);
    this.gizmos.jawTractionGroup = jawTractionGroup;

    this.jawCableMat = new THREE.LineBasicMaterial({
      color: 0xff4b72,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });

    [-1, 1].forEach((side) => {
      const cablePoints = [
        new THREE.Vector3(side * 0.06, 0.50, 0.08), // Clavicle/sternum origin
        new THREE.Vector3(side * 0.035, 0.60, 0.07), // Hyoid pulley
        new THREE.Vector3(side * 0.04, 0.68, 0.04), // Mandible insertion
      ];
      const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
      const line = new THREE.Line(cableGeo, this.jawCableMat);
      jawTractionGroup.add(line);
    });
  }

  // =========================================================================
  // 2. DYNAMIC MYOFASCIAL TENSION CABLES (ORIGIN -> INSERTION FORCE LINES)
  // =========================================================================
  initDynamicMyofascialCables() {
    const cablesGroup = new THREE.Group();
    cablesGroup.name = 'MyofascialTensionCables';
    this.root.add(cablesGroup);
    this.gizmos.cablesGroup = cablesGroup;

    // Definitions of dynamic anatomical force lines that stretch/shorten with joint articulation
    this.cableDefs = [
      {
        id: 'r_plantar_fascia',
        name: 'Right Plantar Fascia & Tibialis Post.',
        origin: new THREE.Vector3(0.09, -0.89, -0.06), // Calcaneus
        insertion: new THREE.Vector3(0.07, -0.85, 0.06), // Navicular / 1st Metatarsal
        colorTight: 0xff1e56,
        colorWeak: 0xf59e0b,
      },
      {
        id: 'r_it_band',
        name: 'Right IT Band & TFL Tract',
        origin: new THREE.Vector3(0.13, 0.02, 0.01), // Iliac crest
        insertion: new THREE.Vector3(0.12, -0.44, 0.02), // Gerdy's tubercle / Lateral tibia
        colorTight: 0xff1e56,
        colorWeak: 0x06b6d4,
      },
      {
        id: 'r_glute_med',
        name: 'Right Gluteus Medius Tension Line',
        origin: new THREE.Vector3(0.13, 0.04, -0.02), // Iliac wing
        insertion: new THREE.Vector3(0.15, -0.06, 0.0), // Greater trochanter
        colorTight: 0xff1e56,
        colorWeak: 0xf59e0b,
      },
      {
        id: 'r_ql',
        name: 'Right Quadratus Lumborum (QL)',
        origin: new THREE.Vector3(0.08, 0.04, -0.04), // Iliac crest posterior
        insertion: new THREE.Vector3(0.05, 0.20, -0.03), // 12th rib / L1-L4
        colorTight: 0xff1e56,
        colorWeak: 0x06b6d4,
      },
      {
        id: 'anterior_hyoid_jaw',
        name: 'Anterior Neck Platysma / Hyoid',
        origin: new THREE.Vector3(0.0, 0.50, 0.08), // Sternum
        insertion: new THREE.Vector3(0.0, 0.67, 0.05), // Mandibular symphysis
        colorTight: 0xff1e56,
        colorWeak: 0xf59e0b,
      },
    ];

    this.cableMeshes = this.cableDefs.map((def) => {
      const geo = new THREE.BufferGeometry().setFromPoints([def.origin, def.insertion]);
      const mat = new THREE.LineDashedMaterial({
        color: def.colorTight,
        dashSize: 0.02,
        gapSize: 0.012,
        linewidth: 3,
        transparent: true,
        opacity: 0.85,
      });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      cablesGroup.add(line);

      return {
        def,
        line,
        mat,
      };
    });
  }

  // =========================================================================
  // 3. KINETIC WAVEFRONT PROPAGATION PULSE
  // =========================================================================
  initKineticWavefrontPulse() {
    const waveGroup = new THREE.Group();
    waveGroup.name = 'KineticWavefront';
    this.root.add(waveGroup);
    this.gizmos.waveGroup = waveGroup;

    // Glowing rings positioned along the ascending kinetic chain
    const ringGeo = new THREE.RingGeometry(0.05, 0.065, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    // Positions from Right Foot -> Tibia -> Knee -> Pelvis -> Lumbar -> Thoracic -> Mandible
    this.waveNodes = [
      { name: 'Foot Arch', pos: new THREE.Vector3(0.09, -0.88, 0.05), rot: [Math.PI / 2, 0, 0] },
      { name: 'Tibial Shin', pos: new THREE.Vector3(0.08, -0.62, 0.01), rot: [Math.PI / 2, 0, 0] },
      { name: 'Knee Joint', pos: new THREE.Vector3(0.09, -0.44, 0.01), rot: [Math.PI / 2, 0, 0] },
      { name: 'Pelvis ASIS', pos: new THREE.Vector3(0.0, 0.0, 0.05), rot: [0, 0, 0] },
      { name: 'Lumbar Spine', pos: new THREE.Vector3(0.0, 0.16, -0.02), rot: [0, 0, 0] },
      { name: 'Thoracic Curve', pos: new THREE.Vector3(0.0, 0.38, -0.04), rot: [0, 0, 0] },
      { name: 'Cervical / Jaw', pos: new THREE.Vector3(0.0, 0.68, 0.05), rot: [0, 0, 0] },
    ];

    this.waveRings = this.waveNodes.map((node, i) => {
      const ring = new THREE.Mesh(ringGeo, ringMat.clone());
      ring.position.copy(node.pos);
      ring.rotation.set(...node.rot);
      ring.scale.setScalar(0.8);
      waveGroup.add(ring);
      return { ring, basePos: node.pos.clone(), index: i };
    });
  }

  // =========================================================================
  // 4. REAL-TIME UPDATE OF VECTORS, TENSION CABLES, & KINETIC WAVE
  // =========================================================================
  update(params = {}, delta = 0.016) {
    this.time += delta;

    const {
      pelvisDrop = 0,
      pelvisTilt = 0,
      rightFootPronation = 0,
      rightKneeValgus = 0,
      cervicalForwardHead = 0,
      thoracicKyphosis = 0,
    } = params;

    // 1. Pelvic Laser Tilt
    if (this.gizmos.pelvicLaserGroup) {
      this.gizmos.pelvicLaserGroup.rotation.z = pelvisDrop;
      this.gizmos.pelvicLaserGroup.position.y = -pelvisDrop * 0.05;
      this.gizmos.pelvicLaserGroup.visible = Math.abs(pelvisDrop) > 0.01 || Math.abs(pelvisTilt) > 0.01;
    }

    // 2. Right Knee Valgus Arrow
    if (this.gizmos.valgusGroup) {
      this.gizmos.valgusGroup.position.x = 0.14 - rightKneeValgus * 0.18;
      this.gizmos.valgusGroup.position.y = -0.42 - Math.abs(pelvisDrop) * 0.04;
      this.gizmos.valgusGroup.scale.set(1 + rightKneeValgus * 2.5, 1, 1);
      this.gizmos.valgusGroup.visible = Math.abs(rightKneeValgus) > 0.03;
    }

    // 3. Right Tibial Torsion Ring
    if (this.gizmos.torsionGroup) {
      this.gizmos.torsionGroup.rotation.y = rightFootPronation * 1.4;
      this.gizmos.torsionGroup.visible = Math.abs(rightFootPronation) > 0.04;
    }

    // 4. Medial Arch Drop Spline
    if (this.collapsedArchLine && this.gizmos.archGroup) {
      const dropAmount = Math.max(0, rightFootPronation * 0.045);
      const points = [
        new THREE.Vector3(0.09, -0.88, -0.06),
        new THREE.Vector3(0.07 + dropAmount * 0.9, -0.84 - dropAmount * 1.2, 0.05),
        new THREE.Vector3(0.08 + dropAmount * 0.5, -0.88, 0.16),
      ];
      this.collapsedArchLine.geometry.dispose();
      this.collapsedArchLine.geometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.CatmullRomCurve3(points).getPoints(24)
      );
      this.gizmos.archGroup.visible = Math.abs(rightFootPronation) > 0.03;
    }

    // 5. Jaw Traction Tension Lines
    if (this.gizmos.jawTractionGroup) {
      this.gizmos.jawTractionGroup.visible = cervicalForwardHead > 0.08;
      this.gizmos.jawTractionGroup.position.z = cervicalForwardHead * 0.15;
      this.gizmos.jawTractionGroup.position.y = -cervicalForwardHead * 0.03;
    }

    // 6. Dynamic Myofascial Tension Cables Origin/Insertion Updates
    if (this.cableMeshes && this.gizmos.cablesGroup) {
      this.cableMeshes.forEach(({ def, line, mat }) => {
        let orig = def.origin.clone();
        let ins = def.insertion.clone();

        if (def.id === 'r_plantar_fascia') {
          ins.x += rightFootPronation * 0.04;
          ins.y -= rightFootPronation * 0.05;
          mat.color.setHex(rightFootPronation > 0.1 ? def.colorWeak : 0x10b981);
        } else if (def.id === 'r_it_band') {
          orig.y -= pelvisDrop * 0.08;
          ins.x -= rightKneeValgus * 0.06;
          mat.color.setHex(rightKneeValgus > 0.1 ? def.colorTight : 0x38bdf8);
        } else if (def.id === 'r_glute_med') {
          orig.y -= pelvisDrop * 0.08;
          mat.color.setHex(pelvisDrop > 0.05 ? def.colorWeak : 0x10b981);
        } else if (def.id === 'r_ql') {
          orig.y -= pelvisDrop * 0.08;
          mat.color.setHex(pelvisDrop > 0.05 ? def.colorTight : 0x38bdf8);
        } else if (def.id === 'anterior_hyoid_jaw') {
          ins.z += cervicalForwardHead * 0.18;
          ins.y -= cervicalForwardHead * 0.04;
          mat.color.setHex(cervicalForwardHead > 0.1 ? def.colorTight : 0x38bdf8);
        }

        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints([orig, ins]);
        line.computeLineDistances();
      });
    }

    // 7. Kinetic Wavefront Propagation Pulse Animation
    if (this.waveRings && this.gizmos.waveGroup) {
      const hasKineticActivity = Math.abs(rightFootPronation) > 0.04 || Math.abs(pelvisDrop) > 0.02 || Math.abs(pelvisTilt) > 0.02;
      this.gizmos.waveGroup.visible = hasKineticActivity;

      if (hasKineticActivity) {
        this.waveRings.forEach(({ ring, index }) => {
          // Traveling wave upwards from index 0 to 6
          const wavePhase = (this.time * 2.5 - index * 0.5) % (Math.PI * 2);
          const intensity = Math.max(0, Math.sin(wavePhase));

          ring.scale.setScalar(0.7 + intensity * 0.6);
          ring.material.opacity = 0.2 + intensity * 0.75;
          ring.material.color.setHex(intensity > 0.6 ? 0x38bdf8 : 0x0284c7);
        });
      }
    }
  }

  setVisible(visible) {
    this.visible = visible;
    this.root.visible = visible;
  }

  dispose() {
    this.scene.remove(this.root);
  }
}
