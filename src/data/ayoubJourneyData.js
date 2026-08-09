/**
 * Ayoub's Personal Musculoskeletal Chronological Trauma-to-Compensation Journey
 * Tracks the complete kinetic chain from 2015 Left Patella injury down to foot, knee, pelvis, spine, and jaw compensations.
 */

export const AYOUB_JOURNEY_STAGES = [
  {
    stage: 1,
    id: 'left_patella_trauma',
    title: '1. Initial Trauma: Left Knee Patellar Fracture (2015)',
    year: '2015',
    focusRegion: 'Left Knee Joint Capsule',
    cameraPreset: 'left_knee',
    clinicalTerm: 'Post-Traumatic Patellofemoral Arthrofibrosis & Extension Deficit',
    description:
      'Split patella (2015) followed by months of rigid straight-leg immobilization. This caused dense joint capsule fibrosis, loss of terminal knee extension, and impaired posterior femoral glide.',
    cascadeMechanism:
      'The body begins subconscious antalgic unloading, avoiding full weight-bearing on the left lower limb.',
    affectedAnatomy: ['Left Patella', 'Left Quadriceps Tendon', 'Left Joint Capsule'],
    overactive: [
      { id: 'quadriceps_left', name: 'Left Quadriceps (Fibrotic Hypertonicity)', role: 'Guarding / Shortened', severity: 90 },
      { id: 'hamstrings_left', name: 'Left Hamstrings (Protective Spasm)', role: 'Shortened & Guarding', severity: 85 },
    ],
    underactive: [
      { id: 'vmo_left', name: 'Left Vastus Medialis Oblique (VMO)', role: 'Inhibited & Atrophied', severity: 92 },
    ],
    parameters: {
      pelvisTilt: 0,
      pelvisDrop: 0,
      pelvisRotation: 0,
      lumbarLordosis: 0,
      thoracicKyphosis: 0,
      spinalLateralBend: 0,
      cervicalForwardHead: 0,
      leftKneeValgus: 0.08,
      rightKneeValgus: 0,
      leftFootPronation: 0,
      rightFootPronation: 0,
      leftShoulderProtraction: 0,
      rightShoulderProtraction: 0,
    },
    correctiveAction: 'Low-load prolonged knee joint capsule mobilizations, patellar glides, and terminal knee extension (TKE) biofeedback.',
  },

  {
    stage: 2,
    id: 'left_foot_synkinesis',
    title: '2. Neurological Disconnect: Left Abductor Hallucis & Synkinesis',
    year: '2016–2018',
    focusRegion: 'Left Foot & Big Toe (Hallux)',
    cameraPreset: 'left_foot',
    clinicalTerm: 'Cortical Motor Inhibition & Aberrant Motor Overflow (Synkinesis)',
    description:
      'Immobilization led to sensory-motor amnesia over the Left Abductor Hallucis (inability to abduct the big toe medially). Forcing the movement triggers motor overflow (involuntary clenching of the contralateral hand).',
    cascadeMechanism:
      'Without an active medial arch lifter (Abductor Hallucis), the left foot loses intrinsic dynamic shock absorption.',
    affectedAnatomy: ['Left Abductor Hallucis', 'Left Medial Arch', 'Plantar Fascia'],
    overactive: [
      { id: 'flexor_hallucis_brevis', name: 'Left Flexor Hallucis (Toe Gripping)', role: 'Compensatory Spasm', severity: 88 },
    ],
    underactive: [
      { id: 'abductor_hallucis_left', name: 'Left Abductor Hallucis', role: 'Deactivated / Motor Amnesia', severity: 98 },
      { id: 'tibialis_posterior_left', name: 'Left Tibialis Posterior', role: 'Inhibited Arch Lifter', severity: 86 },
    ],
    parameters: {
      pelvisTilt: 0,
      pelvisDrop: 0,
      pelvisRotation: 0,
      lumbarLordosis: 0,
      thoracicKyphosis: 0,
      spinalLateralBend: 0,
      cervicalForwardHead: 0,
      leftKneeValgus: 0.08,
      rightKneeValgus: 0,
      leftFootPronation: 0.12,
      rightFootPronation: 0,
      leftShoulderProtraction: 0,
      rightShoulderProtraction: 0,
    },
    correctiveAction: 'Tactile biofeedback toe spreading with mirror visualization; isolated short-foot training without hand co-contraction.',
  },

  {
    stage: 3,
    id: 'right_foot_overload',
    title: '3. Dynamic Balancing Overload: Right Foot Arch Collapse',
    year: '2018–2020',
    focusRegion: 'Right Foot Medial Arch',
    cameraPreset: 'right_foot',
    clinicalTerm: 'Compensatory Pes Planus (Right Foot Pronation & Out-Toeing)',
    description:
      'To spare the injured left leg, the healthy right foot absorbed over 70% of dynamic single-leg stabilization. Chronic eccentric overload caused the right medial longitudinal arch to fatigue and collapse (Pes Planus), turning the foot outward.',
    cascadeMechanism:
      'The right foot eversion and flat arch create an unstable, collapsed foundation at the base of the entire right kinetic chain.',
    affectedAnatomy: ['Right Navicular & Talus', 'Right Plantar Fascia', 'Right Calcaneus'],
    overactive: [
      { id: 'peroneals_right', name: 'Right Peroneus Longus / Brevis', role: 'Shortened (Eversion Pull)', severity: 92 },
      { id: 'lateral_gastrocnemius_right', name: 'Right Lateral Gastrocnemius', role: 'Hypertonic & Tight', severity: 90 },
    ],
    underactive: [
      { id: 'tibialis_posterior_right', name: 'Right Tibialis Posterior', role: 'Fatigued & Overstretched', severity: 96 },
      { id: 'tibialis_anterior_right', name: 'Right Tibialis Anterior', role: 'Inhibited Medial Lifter', severity: 88 },
    ],
    parameters: {
      pelvisTilt: -0.05,
      pelvisDrop: 0.05,
      pelvisRotation: 0.05,
      lumbarLordosis: 0.05,
      thoracicKyphosis: 0,
      spinalLateralBend: 0,
      cervicalForwardHead: 0,
      leftKneeValgus: 0.05,
      rightKneeValgus: 0.15,
      leftFootPronation: 0.10,
      rightFootPronation: 0.35, // Right foot collapsed outward
      leftShoulderProtraction: 0,
      rightShoulderProtraction: 0,
    },
    correctiveAction: 'Plantar fascia trigger release; banded Tibialis Posterior eccentric inversions; Janda Short Foot arch doming.',
  },

  {
    stage: 4,
    id: 'right_knee_valgus',
    title: '4. Tibial Torsion & Knee Valgus Collapse (Right Knee)',
    year: '2020–2021',
    focusRegion: 'Right Tibia & Patellofemoral Joint',
    cameraPreset: 'right_knee',
    clinicalTerm: 'Right Tibial External Rotation & Dynamic Knee Valgus Collapse',
    description:
      'As the right foot collapsed into pronation, the torque was transmitted upward into the right tibia. The shin twisted, forcing the right femur into internal rotation and the right knee into inward collapse (Knee Valgus) under bodyweight.',
    cascadeMechanism:
      'Creates asymmetrical lateral patellofemoral shearing and shortens the right iliotibial band / TFL complex.',
    affectedAnatomy: ['Right Tibia', 'Right Patella', 'Right IT Band', 'Right TFL'],
    overactive: [
      { id: 'tfl_right', name: 'Right Tensor Fasciae Latae (TFL / ITB)', role: 'Shortened & Dominant', severity: 94 },
      { id: 'adductor_right', name: 'Right Hip Adductor Complex', role: 'Hypertonic (Valgus vector)', severity: 90 },
    ],
    underactive: [
      { id: 'gluteus_medius_right', name: 'Right Gluteus Medius (Posterior Fibers)', role: 'Inhibited (Cannot prevent valgus)', severity: 95 },
      { id: 'vmo_right', name: 'Right Vastus Medialis Oblique', role: 'Inhibited & Lengthened', severity: 88 },
    ],
    parameters: {
      pelvisTilt: -0.12,
      pelvisDrop: 0.12,
      pelvisRotation: 0.08,
      lumbarLordosis: 0.10,
      thoracicKyphosis: 0.05,
      spinalLateralBend: -0.08,
      cervicalForwardHead: 0.05,
      leftKneeValgus: 0.05,
      rightKneeValgus: 0.32, // Right knee inward collapse
      leftFootPronation: 0.10,
      rightFootPronation: 0.35,
      leftShoulderProtraction: 0,
      rightShoulderProtraction: 0,
    },
    correctiveAction: 'Foam rolling right ITB/TFL; side-lying clamshells with resistance band; single-leg glute medius step-downs.',
  },

  {
    stage: 5,
    id: 'pelvic_shift_dropped_hip',
    title: '5. Pelvic Shift: Right Dropped Hip & Anterior Pelvic Tilt (APT)',
    year: '2021–2022',
    focusRegion: 'Pelvic Girdle & Lumbo-Sacral Junction',
    cameraPreset: 'pelvis',
    clinicalTerm: 'Lateral Pelvic Obliquity (Right Dropped Hip) + Lower Crossed Syndrome',
    description:
      'The inward collapse of the right leg dragged the right iliac crest downward (Dropped Hip on the healthy side). To stabilize the torso, the pelvis rotated forward into an Anterior Pelvic Tilt (APT) with sharp lumbar hyperlordosis.',
    cascadeMechanism:
      'Left Quadratus Lumborum (QL) goes into permanent spasm to hike the opposite hip, while bilateral glutes enter reciprocal inhibition.',
    affectedAnatomy: ['Right Ilium', 'Sacrum', 'L4-L5 Facet Joints', 'Left QL'],
    overactive: [
      { id: 'ql_left', name: 'Left Quadratus Lumborum (High Hip QL)', role: 'Chronic Spasm & Hiking', severity: 96 },
      { id: 'iliopsoas_both', name: 'Bilateral Iliopsoas (Psoas Major)', role: 'Shortened & Locking APT', severity: 94 },
      { id: 'erector_spinae_lumbar', name: 'Lumbar Erector Spinae', role: 'Compressed & Overactive', severity: 92 },
    ],
    underactive: [
      { id: 'gluteus_maximus_both', name: 'Bilateral Gluteus Maximus', role: 'Gluteal Amnesia / Inhibited', severity: 95 },
      { id: 'gluteus_medius_right', name: 'Right Gluteus Medius', role: 'Trendelenburg Weakness', severity: 94 },
      { id: 'transverse_abdominis', name: 'Deep Transverse Abdominis (Core)', role: 'Distended & Underactive', severity: 90 },
    ],
    parameters: {
      pelvisTilt: -0.28, // Marked Anterior Pelvic Tilt
      pelvisDrop: 0.24,  // Right hip dropped down
      pelvisRotation: 0.10,
      lumbarLordosis: 0.30, // Lumbar hyperlordosis
      thoracicKyphosis: 0.12,
      spinalLateralBend: -0.18, // Spine side-bends to compensate
      cervicalForwardHead: 0.12,
      leftKneeValgus: 0.05,
      rightKneeValgus: 0.32,
      leftFootPronation: 0.10,
      rightFootPronation: 0.35,
      leftShoulderProtraction: 0.05,
      rightShoulderProtraction: 0.05,
    },
    correctiveAction: 'Trigger point release on Left QL and Psoas; Half-kneeling posterior pelvic tuck stretch; Pelvic drops (hip hikes) on step block.',
  },

  {
    stage: 6,
    id: 'spinal_hyperkyphosis',
    title: '6. Spinal Realignment: Thoracic Kyphosis & Forward Head',
    year: '2022–2024',
    focusRegion: 'Thoracic Vertebrae T1-T12 & Cervical Spine C1-C7',
    cameraPreset: 'spine',
    clinicalTerm: 'Thoracic Hyperkyphosis & Upper Crossed Syndrome (FHP)',
    description:
      'Because the lower lumbar spine was arched into hyperlordosis and the pelvis was unlevel, the upper spine formed a compensatory thoracic hump (kyphosis). The head drifted 40mm forward to maintain a level visual horizon.',
    cascadeMechanism:
      'Every centimeter of forward head displacement adds 2-3 kg of shear force on C5-C7 and tightens the anterior chest/neck fascia.',
    affectedAnatomy: ['Thoracic Ribcage', 'C1-C7 Vertebrae', 'Scapulae', 'Suboccipitals'],
    overactive: [
      { id: 'pectoralis_minor', name: 'Pectoralis Major & Minor', role: 'Shortened (Shoulder roll)', severity: 95 },
      { id: 'upper_trapezius', name: 'Upper Trapezius & Levator Scapulae', role: 'Elevated & Hypertonic', severity: 94 },
      { id: 'suboccipitals', name: 'Suboccipital Muscle Group', role: 'Compressed & Spastic', severity: 92 },
    ],
    underactive: [
      { id: 'lower_trapezius', name: 'Lower & Middle Trapezius', role: 'Lengthened & Deactivated', severity: 94 },
      { id: 'rhomboids', name: 'Rhomboids Major / Minor', role: 'Inhibited & Stretched', severity: 90 },
      { id: 'deep_neck_flexors', name: 'Deep Cervical Flexors (Longus Colli)', role: 'Weak & Inactive', severity: 96 },
    ],
    parameters: {
      pelvisTilt: -0.28,
      pelvisDrop: 0.24,
      pelvisRotation: 0.10,
      lumbarLordosis: 0.30,
      thoracicKyphosis: 0.38, // Marked rounded upper back
      spinalLateralBend: -0.18,
      cervicalForwardHead: 0.40, // Head forward
      leftKneeValgus: 0.05,
      rightKneeValgus: 0.32,
      leftFootPronation: 0.10,
      rightFootPronation: 0.35,
      leftShoulderProtraction: 0.30, // Shoulders rounded forward
      rightShoulderProtraction: 0.30,
    },
    correctiveAction: 'Thoracic foam roller extensions; Doorway pectoral stretch; Chin tucks (cervical retraction) and Prone Y-T-W raises.',
  },

  {
    stage: 7,
    id: 'jaw_mandible_pull',
    title: '7. Downstream Myofascial Pull: Lower Jaw Retraction & Tension',
    year: '2024–Present',
    focusRegion: 'Mandible (Jaw), Hyoid Bone & Anterior Neck Fascia',
    cameraPreset: 'jaw',
    clinicalTerm: 'Cervicocranial-Mandibular Fascial Distortion & Receding Jaw Mimicry',
    description:
      'With the head displaced forward and upper ribs depressed, the anterior cervical fascia (Platysma, Sternocleidomastoid, Supra/Infrahyoid chains) is placed under constant downward and backward mechanical traction. This pulls downward on the mandible, mimicking and worsening a receding jawline profile.',
    cascadeMechanism:
      'The entire kinetic chain from the 2015 left knee trauma has now culminated in cranial-mandibular myofascial strain.',
    affectedAnatomy: ['Mandible (Lower Jaw)', 'Hyoid Bone', 'Sternocleidomastoid (SCM)', 'Platysma'],
    overactive: [
      { id: 'scm_platysma', name: 'Sternocleidomastoid & Platysma Chain', role: 'Downward Traction Vector', severity: 96 },
      { id: 'masseter_temporalis', name: 'Masseter & Temporalis', role: 'Clenching & Hypertonic', severity: 92 },
      { id: 'infrahyoids', name: 'Infrahyoid Muscle Group', role: 'Downward Mandibular Pull', severity: 90 },
    ],
    underactive: [
      { id: 'suprahyoids_postural', name: 'Posterior Suprahyoid Stabilizers', role: 'Altered Length-Tension', severity: 88 },
      { id: 'deep_cervical_flexors', name: 'Deep Neck Flexors (Longus Capitis)', role: 'Weakened Neck Base', severity: 96 },
    ],
    parameters: {
      pelvisTilt: -0.28,
      pelvisDrop: 0.24,
      pelvisRotation: 0.10,
      lumbarLordosis: 0.30,
      thoracicKyphosis: 0.38,
      spinalLateralBend: -0.18,
      cervicalForwardHead: 0.44, // Head maximally forward
      leftKneeValgus: 0.05,
      rightKneeValgus: 0.32,
      leftFootPronation: 0.10,
      rightFootPronation: 0.35,
      leftShoulderProtraction: 0.30,
      rightShoulderProtraction: 0.30,
    },
    correctiveAction: 'Platysma and SCM myofascial release; submandibular tongue-to-palate (mewing) posture; full kinetic chain bottom-up restoration.',
  },

  {
    stage: 8,
    id: 'full_cascade_overview',
    title: '8. Full Compound Kinetic Loop (Toe to Jaw Overview)',
    year: '2015–2026',
    focusRegion: 'Entire Human Musculoskeletal Chain',
    cameraPreset: 'front',
    clinicalTerm: 'Ascending Compensatory Cascade: Left Patella → Right Pes Planus → Dropped Hip → APT → Kyphosis → Jaw Retraction',
    description:
      'Interactive 360° visualization of all 7 interconnected compensatory misalignments operating simultaneously across your body.',
    cascadeMechanism:
      'Fixing the jaw or neck requires realigning the pelvis and rebuilding intrinsic foot arch stabilization from the ground up.',
    affectedAnatomy: ['Left Knee', 'Left Foot', 'Right Foot', 'Right Knee', 'Pelvis', 'Spine', 'Mandible'],
    overactive: [
      { id: 'ql_left', name: 'Left Quadratus Lumborum', role: 'Pelvic Hiking', severity: 95 },
      { id: 'tfl_right', name: 'Right TFL / ITB', role: 'Valgus Torque', severity: 94 },
      { id: 'iliopsoas_both', name: 'Bilateral Iliopsoas', role: 'Anterior Pelvic Tilt', severity: 92 },
      { id: 'scm_platysma', name: 'SCM & Platysma', role: 'Jaw Traction', severity: 92 },
    ],
    underactive: [
      { id: 'abductor_hallucis_left', name: 'Left Abductor Hallucis', role: 'Toe Motor Amnesia', severity: 98 },
      { id: 'tibialis_posterior_right', name: 'Right Tibialis Posterior', role: 'Arch Collapse', severity: 96 },
      { id: 'gluteus_medius_right', name: 'Right Gluteus Medius', role: 'Dropped Hip Driver', severity: 95 },
      { id: 'deep_neck_flexors', name: 'Deep Cervical Flexors', role: 'Forward Head', severity: 95 },
    ],
    parameters: {
      pelvisTilt: -0.28,
      pelvisDrop: 0.24,
      pelvisRotation: 0.10,
      lumbarLordosis: 0.30,
      thoracicKyphosis: 0.38,
      spinalLateralBend: -0.18,
      cervicalForwardHead: 0.44,
      leftKneeValgus: 0.05,
      rightKneeValgus: 0.32,
      leftFootPronation: 0.10,
      rightFootPronation: 0.35,
      leftShoulderProtraction: 0.30,
      rightShoulderProtraction: 0.30,
    },
    correctiveAction: 'Integrated bottom-up protocol starting at foot tripod and left knee terminal extension, ascending through pelvis leveling to cervical/jaw decompression.',
  },
];
