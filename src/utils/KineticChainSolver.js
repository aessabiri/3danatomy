/**
 * Universal Biomechanical Kinetic Chain & Muscle Strain Solver
 * Computes closed and open kinematic chain propagation and dynamic muscle length-tension strain.
 */

export class KineticChainSolver {
  /**
   * Solves closed-chain biomechanical propagation from a primary driver.
   * @param {Object} inputParams - Current or target posture parameters
   * @param {string} driverMode - 'foot_ascending' | 'pelvis_rooted' | 'manual'
   * @returns {Object} Fully articulated posture parameters
   */
  static solveKineticChain(inputParams = {}, driverMode = 'foot_ascending') {
    const p = { ...inputParams };

    if (driverMode === 'foot_ascending') {
      // PRIMARY DRIVER: Right Foot Overpronation / Medial Arch Collapse
      const rFoot = p.rightFootPronation || 0;
      const lFoot = p.leftFootPronation || 0;

      // 1. Tibial Internal Torsion (Axial Shin Twist)
      const rTibia = rFoot * 0.92;
      const lTibia = lFoot * 0.92;

      // 2. Dynamic Knee Valgus (Inward Medial Knee Collapse)
      const rValgus = rFoot * 0.85;
      const lValgus = lFoot * 0.85;

      // 3. Functional Leg Shortening & Pelvic Obliquity (Dropped Hip)
      // Functional shortening from valgus angle + arch collapse
      const functionalShortening = Math.sin(rValgus) * 0.35 + rFoot * 0.025 - (Math.sin(lValgus) * 0.35 + lFoot * 0.025);
      const pelvicDrop = functionalShortening * 0.55;

      // 4. Anterior Pelvic Tilt (APT Pitch) & Pelvic Rotation (Yaw)
      const pelvicTilt = -(pelvicDrop * 0.65 + (rFoot + lFoot) * 0.25);
      const pelvicRotation = (rFoot - lFoot) * 0.45;

      // 5. Lumbar Spine Compensatory Lateral Bend & Hyperlordosis
      const spinalLateralBend = -pelvicDrop * 1.15;
      const lumbarLordosis = -pelvicTilt * 0.95;

      // 6. Thoracic Spine Compensatory Hyperkyphosis & Rotation
      const thoracicKyphosis = -pelvicTilt * 0.80 + Math.abs(pelvicDrop) * 0.25;

      // 7. Cervical Spine Forward Head Posture (FHP) & Chin Retraction
      const cervicalForwardHead = thoracicKyphosis * 0.042 + Math.abs(pelvicDrop) * 0.015;

      // 8. Shoulder Protraction / Internal Rotation
      const rightShoulderProtraction = thoracicKyphosis * 0.65 + pelvicDrop * 0.35;
      const leftShoulderProtraction = thoracicKyphosis * 0.65 - pelvicDrop * 0.20;

      return {
        ...p,
        rightFootPronation: rFoot,
        leftFootPronation: lFoot,
        rightKneeValgus: rValgus,
        leftKneeValgus: lValgus,
        pelvisDrop: pelvicDrop,
        pelvisTilt: pelvicTilt,
        pelvisRotation: pelvicRotation,
        lumbarLordosis: lumbarLordosis,
        spinalLateralBend: spinalLateralBend,
        thoracicKyphosis: thoracicKyphosis,
        cervicalForwardHead: cervicalForwardHead,
        rightShoulderProtraction: Math.max(0, rightShoulderProtraction),
        leftShoulderProtraction: Math.max(0, leftShoulderProtraction),
        _driver: 'foot_ascending',
      };
    }

    if (driverMode === 'pelvis_rooted') {
      // PRIMARY DRIVER: Pelvic Obliquity (Lateral Drop) & Anterior Tilt
      const pDrop = p.pelvisDrop || 0;
      const pTilt = p.pelvisTilt || 0; // Negative = Anterior Tilt

      // 1. Lower Limb Dynamic Response to Accommodate Pelvic Drop
      const rValgus = pDrop > 0 ? pDrop * 0.95 : 0;
      const lValgus = pDrop < 0 ? -pDrop * 0.95 : 0;

      const rFoot = pDrop > 0 ? pDrop * 1.10 : 0;
      const lFoot = pDrop < 0 ? -pDrop * 1.10 : 0;

      // 2. Spine Upward Compensation
      const spinalLateralBend = -pDrop * 1.20;
      const lumbarLordosis = Math.max(0, -pTilt * 0.90);
      const thoracicKyphosis = Math.max(0, -pTilt * 0.75 + Math.abs(pDrop) * 0.25);
      const cervicalForwardHead = thoracicKyphosis * 0.040;

      const rightShoulderProtraction = thoracicKyphosis * 0.5 + pDrop * 0.4;
      const leftShoulderProtraction = thoracicKyphosis * 0.5 - pDrop * 0.3;

      return {
        ...p,
        pelvisDrop: pDrop,
        pelvisTilt: pTilt,
        pelvisRotation: pDrop * 0.35,
        rightKneeValgus: rValgus,
        leftKneeValgus: lValgus,
        rightFootPronation: rFoot,
        leftFootPronation: lFoot,
        lumbarLordosis: lumbarLordosis,
        spinalLateralBend: spinalLateralBend,
        thoracicKyphosis: thoracicKyphosis,
        cervicalForwardHead: cervicalForwardHead,
        rightShoulderProtraction: Math.max(0, rightShoulderProtraction),
        leftShoulderProtraction: Math.max(0, leftShoulderProtraction),
        _driver: 'pelvis_rooted',
      };
    }

    // Manual decoupled mode: return parameters as is
    return { ...p, _driver: 'manual' };
  }

  /**
   * Computes dynamic muscle length-tension strain and clinical severity for all major muscle groups.
   * Strain formula: e = (L_current - L_0) / L_0
   * @param {Object} postureParams
   * @returns {Object} { muscles: Map, overactive: Array, underactive: Array }
   */
  static calculateMuscleStrains(postureParams = {}) {
    const {
      pelvisTilt = 0,
      pelvisDrop = 0,
      lumbarLordosis = 0,
      thoracicKyphosis = 0,
      spinalLateralBend = 0,
      cervicalForwardHead = 0,
      rightKneeValgus = 0,
      leftKneeValgus = 0,
      rightFootPronation = 0,
      leftFootPronation = 0,
    } = postureParams;

    // Convert angles to normalized mechanical factors
    const aptMagnitude = Math.max(0, -pelvisTilt);
    const rValgusMag = Math.max(0, rightKneeValgus);
    const lValgusMag = Math.max(0, leftKneeValgus);
    const rPronationMag = Math.max(0, rightFootPronation);
    const lPronationMag = Math.max(0, leftFootPronation);
    const rDropMag = Math.max(0, pelvisDrop);
    const lDropMag = Math.max(0, -pelvisDrop);
    const fhpMag = cervicalForwardHead; // in meters (0 to 0.05)

    const muscleRegistry = [];

    const addMuscle = (id, name, baseLength, deltaLength, region, optimalRole) => {
      const strainRatio = deltaLength / baseLength;
      const strainPercent = Math.round(strainRatio * 100);

      let state = 'normal';
      let severity = Math.min(100, Math.abs(strainPercent) * 2);

      if (strainPercent <= -8) {
        state = 'tight'; // Shortened / Hypertonic / In Spasm
      } else if (strainPercent >= 8) {
        state = 'weak'; // Overstretched / Inhibited / Eccentric Overload
      }

      muscleRegistry.push({
        id,
        name,
        region,
        optimalRole,
        strainPercent,
        state,
        severity: Math.max(10, severity),
        stretchFactor: 1 + strainRatio,
      });
    };

    // 1. LOWER LEG & FOOT COMPARTMENTS
    // Tibialis Posterior (Medial Arch Support & Inversion)
    addMuscle('tibialis_posterior_right', 'Right Tibialis Posterior', 0.28, rPronationMag * 0.12, 'foot', 'Overstretched & collapsed arch support');
    addMuscle('tibialis_posterior_left', 'Left Tibialis Posterior', 0.28, lPronationMag * 0.12, 'foot', 'Medial longitudinal arch decelerator');
    // Abductor Hallucis (Great Toe Abduction & Arch Spring)
    addMuscle('abductor_hallucis_right', 'Right Abductor Hallucis', 0.12, rPronationMag * 0.06, 'foot', 'Overstretched dynamic medial arch stabilizer');
    addMuscle('abductor_hallucis_left', 'Left Abductor Hallucis', 0.12, 0.045, 'foot', 'Neurologically inhibited / lost motor drive (2015 Trauma)');
    // Peroneus Longus & Brevis (Lateral Eversion)
    addMuscle('peroneus_longus_right', 'Right Peroneus Longus / Brevis', 0.30, -rPronationMag * 0.09, 'foot', 'Shortened & hyperactive evertor');
    addMuscle('peroneus_longus_left', 'Left Peroneus Longus / Brevis', 0.30, -lPronationMag * 0.09, 'foot', 'Evertor complex');
    // Gastrocnemius / Soleus (Calf)
    addMuscle('gastrocnemius_right', 'Right Gastrocnemius / Soleus', 0.38, -rPronationMag * 0.08 - rValgusMag * 0.05, 'calf', 'Hypertonic triceps surae limiting dorsiflexion');
    addMuscle('gastrocnemius_left', 'Left Gastrocnemius / Soleus', 0.38, -lPronationMag * 0.08, 'calf', 'Posterior calf compartment');

    // 2. HIP & THIGH COMPARTMENTS
    // Tensor Fasciae Latae (TFL) & IT Band
    addMuscle('tfl_it_band_right', 'Right TFL & Iliotibial (IT) Band', 0.45, -rValgusMag * 0.16 - rDropMag * 0.12, 'hip', 'Shortened & dense lateral tension cable');
    addMuscle('tfl_it_band_left', 'Left TFL & Iliotibial (IT) Band', 0.45, -lValgusMag * 0.16 - lDropMag * 0.12, 'hip', 'Lateral thigh stabilizer');
    // Gluteus Medius (Pelvic Leveler)
    addMuscle('gluteus_medius_right', 'Right Gluteus Medius', 0.22, rDropMag * 0.14 + rValgusMag * 0.08, 'hip', 'Overstretched & inhibited (Trendelenburg failure)');
    addMuscle('gluteus_medius_left', 'Left Gluteus Medius', 0.22, lDropMag * 0.14 + lValgusMag * 0.08, 'hip', 'Frontal plane pelvic stabilizer');
    // Hip Adductor Complex (Magnus / Longus / Brevis)
    addMuscle('adductors_right', 'Right Hip Adductor Complex', 0.32, -rValgusMag * 0.14 - rPronationMag * 0.08, 'thigh', 'Hypertonic inward femoral pull');
    addMuscle('adductors_left', 'Left Hip Adductor Complex', 0.32, -lValgusMag * 0.14 - lPronationMag * 0.08, 'thigh', 'Medial thigh group');
    // Iliopsoas (Deep Hip Flexor)
    addMuscle('iliopsoas_right', 'Right Psoas Major / Iliacus', 0.34, -aptMagnitude * 0.14 - rDropMag * 0.08, 'pelvis', 'Shortened tonic hip flexor dumping pelvis anteriorly');
    addMuscle('iliopsoas_left', 'Left Psoas Major / Iliacus', 0.34, -aptMagnitude * 0.14, 'pelvis', 'Primary sagittal pelvic pitch driver');
    // Gluteus Maximus (Hip Extensor & Posterior Tilt)
    addMuscle('gluteus_maximus_right', 'Right Gluteus Maximus', 0.36, aptMagnitude * 0.15 + rDropMag * 0.06, 'glutes', 'Underactive / lengthened power generator');
    addMuscle('gluteus_maximus_left', 'Left Gluteus Maximus', 0.36, aptMagnitude * 0.15, 'glutes', 'Posterior pelvic anchor');

    // 3. LUMBO-PELVIC-SPINAL COMPLEX
    // Quadratus Lumborum (QL)
    addMuscle('quadratus_lumborum_right', 'Right Quadratus Lumborum (QL)', 0.18, -rDropMag * 0.12 + spinalLateralBend * 0.08, 'spine', 'Hyperactive lateral hip-hiker spasm');
    addMuscle('quadratus_lumborum_left', 'Left Quadratus Lumborum (QL)', 0.18, rDropMag * 0.12 - spinalLateralBend * 0.08, 'spine', 'Overstretched lateral lumbar stabilizer');
    // Lumbar Erector Spinae
    addMuscle('erector_spinae_lumbar', 'Lumbar Erector Spinae', 0.40, -lumbarLordosis * 0.12 - aptMagnitude * 0.10, 'spine', 'Hypertonic lumbar extensor compression');
    // Rectus Abdominis / Core
    addMuscle('rectus_abdominis', 'Rectus & Transversus Abdominis', 0.38, aptMagnitude * 0.14, 'core', 'Inhibited anterior core wall');

    // 4. UPPER CROSS & CERVICAL-MANDIBULAR
    // Pectoralis Minor & Major
    addMuscle('pectoralis_minor_right', 'Right Pectoralis Minor', 0.16, -thoracicKyphosis * 0.08, 'chest', 'Shortened anterior shoulder depressor');
    addMuscle('pectoralis_minor_left', 'Left Pectoralis Minor', 0.16, -thoracicKyphosis * 0.08, 'chest', 'Scapular anterior tilter');
    // Rhomboids & Mid/Lower Trapezius
    addMuscle('rhomboids_trapezius', 'Rhomboids & Lower Trapezius', 0.30, thoracicKyphosis * 0.15, 'back', 'Overstretched & inhibited scapular retractors');
    // Sternocleidomastoid (SCM) & Scalenes
    addMuscle('scm_neck', 'Sternocleidomastoid (SCM) & Scalenes', 0.20, -fhpMag * 2.8, 'neck', 'Shortened anterior neck pull');
    // Suboccipital Complex
    addMuscle('suboccipitals', 'Suboccipital Muscle Complex (C1-C2)', 0.08, -fhpMag * 2.5, 'neck', 'Hypertonic capital extensors compressing occiput');
    // Anterior Cervical Fascia & Hyoid/Mandible Complex (Jaw Traction)
    addMuscle('anterior_neck_fascia_jaw', 'Platysma & Suprahyoid/Infrahyoid Chain', 0.22, fhpMag * 3.5, 'jaw', 'Chronic downward & posterior mechanical traction on lower jaw');

    const overactive = muscleRegistry
      .filter((m) => m.state === 'tight')
      .map((m) => ({
        id: m.id,
        name: m.name,
        role: m.optimalRole,
        severity: m.severity,
        strainPercent: m.strainPercent,
      }));

    const underactive = muscleRegistry
      .filter((m) => m.state === 'weak')
      .map((m) => ({
        id: m.id,
        name: m.name,
        role: m.optimalRole,
        severity: m.severity,
        strainPercent: m.strainPercent,
      }));

    return {
      registry: muscleRegistry,
      overactive,
      underactive,
    };
  }
}
