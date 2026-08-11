import * as THREE from 'three';

/**
 * Biomechanical Visual Overlays (Calibrated for 1.75m standing human anatomy)
 * Visualizes dynamic kinetic tension vectors, pelvic horizon, and joint alignment.
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

    this.initGizmos();
  }

  initGizmos() {
    // 1. Pelvic Horizon Laser Line (at y = 0.92)
    const pelvicLaserGroup = new THREE.Group();
    pelvicLaserGroup.name = 'PelvicLaserLevel';
    pelvicLaserGroup.position.set(0, 0.92, 0.04);
    this.root.add(pelvicLaserGroup);
    this.gizmos.pelvicLaserGroup = pelvicLaserGroup;

    const laserPoints = [
      new THREE.Vector3(-0.20, 0, 0),
      new THREE.Vector3(0.20, 0, 0),
    ];
    const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
    const laserMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.02,
      gapSize: 0.015,
      linewidth: 2,
      transparent: true,
      opacity: 0.6,
    });
    this.pelvicLaserLine = new THREE.Line(laserGeo, laserMat);
    this.pelvicLaserLine.computeLineDistances();
    pelvicLaserGroup.add(this.pelvicLaserLine);

    // 2. Right Knee Inward Valgus Vector (at y = 0.44)
    const valgusGroup = new THREE.Group();
    valgusGroup.position.set(0.12, 0.44, 0.02);
    this.root.add(valgusGroup);
    this.gizmos.valgusGroup = valgusGroup;

    const shaftGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.08, 6);
    const valgusMat = new THREE.MeshBasicMaterial({ color: 0xff1e56, transparent: true, opacity: 0.75 });
    const shaft = new THREE.Mesh(shaftGeo, valgusMat);
    shaft.rotation.z = Math.PI / 2;
    valgusGroup.add(shaft);

    const valgusHead = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.02, 6), valgusMat);
    valgusHead.rotation.z = -Math.PI / 2;
    valgusHead.position.set(-0.045, 0, 0);
    valgusGroup.add(valgusHead);

    // 3. Right Foot Arch Indicator (at y = 0.03)
    const archGroup = new THREE.Group();
    archGroup.position.set(0.08, 0.03, 0.04);
    this.root.add(archGroup);
    this.gizmos.archGroup = archGroup;

    const archPoints = [
      new THREE.Vector3(0, 0, -0.05),
      new THREE.Vector3(-0.015, 0.018, 0.01),
      new THREE.Vector3(0, 0, 0.07),
    ];
    const archGeo = new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(archPoints).getPoints(16));
    const archMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.7 });
    const archLine = new THREE.Line(archGeo, archMat);
    archGroup.add(archLine);
  }

  update(params = {}, delta = 0.016) {
    if (!this.visible) return;
    this.time += delta;

    // Update pelvic laser roll/tilt
    if (this.gizmos.pelvicLaserGroup) {
      this.gizmos.pelvicLaserGroup.rotation.z = params.pelvisDrop || 0;
      this.gizmos.pelvicLaserGroup.rotation.x = params.pelvisTilt || 0;
    }

    // Update knee valgus vector visibility & length
    if (this.gizmos.valgusGroup) {
      const valgus = Math.abs(params.rightKneeValgus || 0);
      this.gizmos.valgusGroup.visible = valgus > 0.02;
      this.gizmos.valgusGroup.scale.set(1 + valgus * 3, 1, 1);
    }

    // Update arch line collapse
    if (this.gizmos.archGroup) {
      const pronation = params.rightFootPronation || 0;
      this.gizmos.archGroup.rotation.z = pronation * 0.8;
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
