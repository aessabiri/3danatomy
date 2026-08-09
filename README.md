# BioAlign3D — Interactive 3D Musculoskeletal Biomechanics & Posture Simulator

A WebGL-powered 3D anatomical visualization and corrective exercise simulator built with **React**, **Three.js**, and **Vite**.

![BioAlign3D](public/models/screenshot_preview.png)

## 🌟 Key Features

### 1. Multi-Model Anatomical Atlas Support
- **🧬 Full Musculoskeletal Atlas**: Complete interconnected human skeleton (217 bones) + 136 full superficial and deep muscles with medical PBR shading.
- **⚡ LUMC Clinical Skeleton (3.2MB)**: Ultra-lightweight university medical skeleton derived from Leiden University Medical Center / AnatomyTool with bilateral skeletal mirroring for zero GPU lag.
- **🦵 LUMC Lower-Limb & Foot Joint Deep-Dive**: High-precision articular cartilages, Plantar Calcaneonavicular ("Spring") Ligament, Iliotibial (IT) tract, and patellar retinacula.

### 2. True 3D World-Space Kinematic Articulation
- **Right Foot Arch Drop (Pes Planus)**: Real-time navicular, talus, and calcaneus eversion roll and arch flattening.
- **Right Tibial Torsion & Knee Valgus**: Longitudinal axial shin rotation ($+15^\circ$ to $+30^\circ$) with inward knock-knee collapse.
- **Pelvic Obliquity (Dropped Hip) & APT**: Frontal-plane iliac drop (15–20mm) and sagittal forward pitch (hyperlordosis).
- **Thoracic Kyphosis & Forward Head Posture (FHP)**: Spinal curve deformity with $+40$mm cervical translation.
- **Mandibular Retraction (Jaw)**: Downward and posterior mechanical traction on the mandible from anterior neck tension.

### 3. Ayoub's 7-Stage Chronological Case Journey
An animated, step-by-step diagnostic journey tracking ascending biomechanical compensation:
1. **2015: Left Knee Trauma** (Patellar fracture & capsule fibrosis)
2. **2016–2018: Neurological Disconnect** (Left Abductor Hallucis loss & motor overflow)
3. **2018–2020: Dynamic Balancing Overload** (Right foot pes planus & arch fatigue)
4. **2020–2021: Tibial Torsion & Knee Valgus** (Inward right leg collapse)
5. **2021–2022: Pelvic Shift & Dropped Hip** (Right hip drop & Anterior Pelvic Tilt)
6. **2022–2024: Spinal Realignment** (Compensatory thoracic kyphosis & forward head)
7. **Present: Myofascial Pull on Jaw** (Downward anterior neck tension on mandible)
8. **Full Kinetic Loop** (360° compound ascending cascade)

### 4. 3D Biomechanical Force Vectors & Laser Levels
- **Medial Arch Comparison Guide**: Dynamic green ideal arch vs red collapsed flat foot spline.
- **Tibial Torque Spiral Arrow**: Glowing rotational torque ring circling the shin.
- **Inward Valgus Force Vector**: Neon 3D vector arrow pointing across the knee joint line.
- **Inter-ASIS Pelvic Horizon Laser**: Bright horizontal laser level cutting across both hip bones.
- **Myofascial Mandibular Tension Cables**: Glowing tension vectors pulling from clavicles to jaw.

### 5. Dynamic Vertex Decimator & Integrated GPU Performance Engine
- **Eco Mode (iGPU Saver)**: 35–40% vertex density (~45k vertices), 0.8x render scale, and shadow bypass to drop GPU utilization from 80% down to 25–35%.
- **Mesh Vertex Density Slider**: Dial resolution anywhere from 25% to 100% with symmetric left/right decimation.
- **Live Telemetry & Polygon Counters**: Real-time vertex and triangle stats.

### 6. NASM CES 4-Phase Rehabilitation Prescription
Complete clinical protocols with:
- **Phase 1 (Inhibit / SMR)**
- **Phase 2 (Lengthen / Stretch)**
- **Phase 3 (Activate / Isolated Motor Control)**
- **Phase 4 (Integrate / Dynamic Realignment)**

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/aessabiri/3danatomy.git
cd 3danatomy

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite
- **3D Graphics Engine**: Three.js (WebGL, PBR MeshPhysicalMaterial, custom shaders)
- **3D Assets**: Z-Anatomy (CC-BY-SA), Leiden University Medical Center / AnatomyTool (CC-BY-SA)
- **UI & Icons**: Lucide React, Glassmorphic Vanilla CSS Design System
