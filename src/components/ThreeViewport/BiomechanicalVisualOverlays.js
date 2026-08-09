import * as THREE from 'three';

/**
 * High-Visibility 3D Biomechanical Vectors, Lasers, and Visual Overlay Gizmos
 * Renders real-time visual proof of foot arch drop, tibial torsion, knee valgus, pelvic obliquity, and jaw traction.
 */
export class BiomechanicalVisualOverlays {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'BiomechanicalVisualOverlays';
    this.scene.add(this.root);

    this.visible = true;
    this.gizmos = {};
    this.initGizmos();
  }

  initGizmos() {
    // -----------------------------------------------------------------------
    // 1. RIGHT FOOT MEDIAL ARCH COLLAPSE GUIDE
    // -----------------------------------------------------------------------
    const archGroup = new THREE.Group();
    archGroup.name = 'ArchCollapseGuide';
    this.root.add(archGroup);
    this.gizmos.archGroup = archGroup;

    // Normal Arch Spline (Ideal arch curve - green)
    const normalPoints = [
      new THREE.Vector3(0.09, -0.88, -0.06), // Calcaneus (heel)
      new THREE.Vector3(0.07, -0.84, 0.05),  // Navicular peak (+18mm arch)
      new THREE.Vector3(0.08, -0.88, 0.16),  // 1st Metatarsal head
    ];
    const normalCurve = new THREE.CatmullRomCurve3(normalPoints);
    const normalGeo = new THREE.BufferGeometry().setFromPoints(normalCurve.getPoints(24));
    const normalMat = new THREE.LineDashedMaterial({
      color: 0x10b981,
      dashSize: 0.015,
      gapSize: 0.01,
      linewidth: 3,
    });
    this.normalArchLine = new THREE.Line(normalGeo, normalMat);
    this.normalArchLine.computeLineDistances();
    archGroup.add(this.normalArchLine);

    // Collapsed Arch Spline (Flat drop - red)
    this.collapsedPoints = [
      new THREE.Vector3(0.12, -0.89, -0.06),
      new THREE.Vector3(0.13, -0.89, 0.05), // Collapsed flat to floor
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

    // -----------------------------------------------------------------------
    // 2. RIGHT TIBIAL TORSION ROTATIONAL ARROW
    // -----------------------------------------------------------------------
    const torsionGroup = new THREE.Group();
    torsionGroup.position.set(0.10, -0.62, 0);
    this.root.add(torsionGroup);
    this.gizmos.torsionGroup = torsionGroup;

    // Torus arc arrow circling shin
    const torsionArcGeo = new THREE.TorusGeometry(0.048, 0.004, 8, 24, Math.PI * 1.3);
    const torsionMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.torsionRing = new THREE.Mesh(torsionArcGeo, torsionMat);
    this.torsionRing.rotation.x = Math.PI / 2;
    torsionGroup.add(this.torsionRing);

    // Arrowhead cone
    const arrowHeadGeo = new THREE.ConeGeometry(0.01, 0.02, 8);
    this.torsionArrowHead = new THREE.Mesh(arrowHeadGeo, torsionMat);
    this.torsionArrowHead.position.set(0.045, 0, 0.015);
    this.torsionArrowHead.rotation.set(0, -Math.PI / 4, Math.PI / 2);
    torsionGroup.add(this.torsionArrowHead);

    // -----------------------------------------------------------------------
    // 3. RIGHT KNEE INWARD VALGUS FORCE VECTOR
    // -----------------------------------------------------------------------
    const valgusGroup = new THREE.Group();
    valgusGroup.position.set(0.14, -0.42, 0);
    this.root.add(valgusGroup);
    this.gizmos.valgusGroup = valgusGroup;

    // Inward pointing arrow (Shaft + Cone)
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

    // -----------------------------------------------------------------------
    // 4. PELVIC HORIZON LASER LINE (INTER-ASIS LEVEL GAUGE)
    // -----------------------------------------------------------------------
    const pelvicLaserGroup = new THREE.Group();
    pelvicLaserGroup.name = 'PelvicLaserLevel';
    this.root.add(pelvicLaserGroup);
    this.gizmos.pelvicLaserGroup = pelvicLaserGroup;

    // Horizontal Level Laser Line across hips
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

    // -----------------------------------------------------------------------
    // 5. JAW / MANDIBLE DOWNWARD MYOFASCIAL TRACTION CABLES
    // -----------------------------------------------------------------------
    const jawTractionGroup = new THREE.Group();
    jawTractionGroup.name = 'JawTractionCables';
    this.root.add(jawTractionGroup);
    this.gizmos.jawTractionGroup = jawTractionGroup;

    // 2 Glowing traction lines from clavicle/sternum up to angles of jaw
    this.jawCableMat = new THREE.LineBasicMaterial({
      color: 0xff4b72,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });

    [-1, 1].forEach((side) => {
      const cablePoints = [
        new THREE.Vector3(side * 0.06, 0.50, 0.08), // Clavicle insertion
        new THREE.Vector3(side * 0.035, 0.60, 0.07), // Hyoid pulley
        new THREE.Vector3(side * 0.04, 0.68, 0.04), // Mandible angle
      ];
      const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
      const line = new THREE.Line(cableGeo, this.jawCableMat);
      jawTractionGroup.add(line);
    });
  }

  // =========================================================================
  // UPDATE REAL-TIME GIZMO GEOMETRY & TRACTION VECTORS
  // =========================================================================
  update(params = {}) {
    const {
      pelvisDrop = 0,
      rightFootPronation = 0,
      rightKneeValgus = 0,
      cervicalForwardHead = 0,
    } = params;

    // 1. Pelvic Laser Tilt
    if (this.gizmos.pelvicLaserGroup) {
      this.gizmos.pelvicLaserGroup.rotation.z = pelvisDrop;
      this.gizmos.pelvicLaserGroup.position.y = -pelvisDrop * 0.05;
    }

    // 2. Right Knee Valgus Arrow Position & Intensity
    if (this.gizmos.valgusGroup) {
      this.gizmos.valgusGroup.position.x = 0.12 - rightKneeValgus * 0.15;
      this.gizmos.valgusGroup.scale.set(1 + rightKneeValgus * 2, 1, 1);
      this.gizmos.valgusGroup.visible = Math.abs(rightKneeValgus) > 0.05;
    }

    // 3. Right Tibial Torsion Ring Rotation
    if (this.gizmos.torsionGroup) {
      this.gizmos.torsionGroup.rotation.y = rightFootPronation * 1.2;
      this.gizmos.torsionGroup.visible = Math.abs(rightFootPronation) > 0.08;
    }

    // 4. Medial Arch Drop Spline
    if (this.collapsedArchLine && this.gizmos.archGroup) {
      const dropAmount = Math.max(0, rightFootPronation * 0.04);
      const points = [
        new THREE.Vector3(0.09, -0.88, -0.06),
        new THREE.Vector3(0.07 + dropAmount * 0.8, -0.84 - dropAmount, 0.05), // Dropped & everted
        new THREE.Vector3(0.08 + dropAmount * 0.5, -0.88, 0.16),
      ];
      this.collapsedArchLine.geometry.dispose();
      this.collapsedArchLine.geometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.CatmullRomCurve3(points).getPoints(24)
      );
      this.gizmos.archGroup.visible = Math.abs(rightFootPronation) > 0.05;
    }

    // 5. Jaw Traction Tension Visibility
    if (this.gizmos.jawTractionGroup) {
      this.gizmos.jawTractionGroup.visible = cervicalForwardHead > 0.15;
      this.gizmos.jawTractionGroup.position.z = cervicalForwardHead * 0.12;
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
