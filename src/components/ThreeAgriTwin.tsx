import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  Layers,
  Eye,
  Sliders,
  Sun,
  CloudRain,
  ChevronDown,
  ChevronUp,
  Maximize2,
  RefreshCw,
} from "lucide-react";

interface ThreeAgriTwinProps {
  cropName?: string;
  activeDisease?: string | null;
  surfaceMoisture?: number;
  deepMoisture?: number;
}

export const ThreeAgriTwin: React.FC<ThreeAgriTwinProps> = ({
  cropName = "Paddy (Rice)",
  activeDisease = null,
  surfaceMoisture = 34,
  deepMoisture = 48,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLesions, setShowLesions] = useState(activeDisease ? true : false);
  const [growthStage, setGrowthStage] = useState<"vegetative" | "flowering" | "mature">("flowering");
  const [soilSlice, setSoilSlice] = useState<"surface" | "deep" | "full">("full");
  const [weatherCondition, setWeatherCondition] = useState<"sun" | "rain">("sun");

  // Sync disease prop
  useEffect(() => {
    if (activeDisease) {
      setShowLesions(true);
    }
  }, [activeDisease]);

  const sceneRefs = useRef<{
    controls?: OrbitControls;
    lesionMeshes: THREE.Mesh[];
    soilSurfaceMesh?: THREE.Mesh;
    soilDeepMesh?: THREE.Mesh;
    rainParticles?: THREE.Points;
    plantGroup?: THREE.Group;
  }>({
    lesionMeshes: [],
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x061a14);
    scene.fog = new THREE.FogExp2(0x061a14, 0.045);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.8, 2.2, 3.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Studio Lighting Rig
    const warmKeyLight = new THREE.DirectionalLight(0xfff3d6, 2.4);
    warmKeyLight.position.set(4, 6, 3);
    warmKeyLight.castShadow = !isSoftwareGl;
    warmKeyLight.shadow.mapSize.width = 1024;
    warmKeyLight.shadow.mapSize.height = 1024;
    warmKeyLight.shadow.bias = -0.0005;
    warmKeyLight.shadow.normalBias = 0.02;
    scene.add(warmKeyLight);

    const coolHemiFill = new THREE.HemisphereLight(0x86efac, 0x064e3b, 1.2);
    scene.add(coolHemiFill);

    const rimLight = new THREE.DirectionalLight(0x6ee7b7, 1.0);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // 4. Procedural Textures (Zero 404 External Assets)
    // Leaf venation texture
    const leafCanvas = document.createElement("canvas");
    leafCanvas.width = 512;
    leafCanvas.height = 512;
    const ctx = leafCanvas.getContext("2d")!;
    ctx.fillStyle = "#166534";
    ctx.fillRect(0, 0, 512, 512);
    // Draw leaf ribs
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(256, 512);
    ctx.lineTo(256, 0);
    ctx.stroke();
    // Side veins
    ctx.lineWidth = 2.5;
    for (let y = 50; y < 500; y += 30) {
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.quadraticCurveTo(340, y - 25, 480, y - 50);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.quadraticCurveTo(172, y - 25, 32, y - 50);
      ctx.stroke();
    }
    const leafTexture = new THREE.CanvasTexture(leafCanvas);
    leafTexture.colorSpace = THREE.SRGBColorSpace;
    leafTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Lesion / Pathology Texture (Bacterial Blight necrotic spots)
    const lesionCanvas = document.createElement("canvas");
    lesionCanvas.width = 512;
    lesionCanvas.height = 512;
    const lctx = lesionCanvas.getContext("2d")!;
    lctx.fillStyle = "rgba(0,0,0,0)";
    lctx.fillRect(0, 0, 512, 512);
    // Necrotic brown/yellow blotches
    for (let i = 0; i < 24; i++) {
      const rx = Math.random() * 400 + 56;
      const ry = Math.random() * 400 + 56;
      const grad = lctx.createRadialGradient(rx, ry, 2, rx, ry, 28);
      grad.addColorStop(0, "rgba(120, 53, 15, 0.95)"); // Dark necrosis
      grad.addColorStop(0.5, "rgba(217, 119, 6, 0.85)"); // Amber halo
      grad.addColorStop(1, "rgba(245, 158, 11, 0)"); // Fading chlorotic ring
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.ellipse(rx, ry, 20 + Math.random() * 20, 10 + Math.random() * 10, Math.random() * Math.PI, 0, Math.PI * 2);
      lctx.fill();
    }
    const lesionTexture = new THREE.CanvasTexture(lesionCanvas);
    lesionTexture.colorSpace = THREE.SRGBColorSpace;

    // Contact Shadow Ground Plane
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext("2d")!;
    const shadowGrad = sctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.55)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    sctx.fillStyle = shadowGrad;
    sctx.fillRect(0, 0, 256, 256);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);

    const groundShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 3.6),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -0.58;
    scene.add(groundShadow);

    // 5. Composite 3–12 Part Procedural Plant Model (THREE.Group)
    const plantGroup = new THREE.Group();
    plantGroup.position.set(0, -0.58, 0); // Bottom-center grounded
    scene.add(plantGroup);
    sceneRefs.current.plantGroup = plantGroup;

    // Materials with PBR properties
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.35,
      metalness: 0.1,
    });

    const leafMaterial = new THREE.MeshStandardMaterial({
      map: leafTexture,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const lesionMaterial = new THREE.MeshStandardMaterial({
      map: lesionTexture,
      transparent: true,
      opacity: showLesions ? 0.95 : 0.0,
      roughness: 0.7,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide,
    });

    // Part 1: Main stem with nodes
    const stemHeight = 1.6;
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.065, stemHeight, 16);
    const stemMesh = new THREE.Mesh(stemGeo, stemMaterial);
    stemMesh.position.y = stemHeight / 2;
    stemMesh.castShadow = !isSoftwareGl;
    plantGroup.add(stemMesh);

    // Part 2: Stem nodes (accent rings)
    for (let i = 1; i <= 4; i++) {
      const nodeRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.055, 0.018, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
      );
      nodeRing.rotation.x = Math.PI / 2;
      nodeRing.position.y = i * 0.32;
      plantGroup.add(nodeRing);
    }

    // Part 3 to 8: Multi-part compound leaf blades radiating organically
    const lesionMeshes: THREE.Mesh[] = [];
    const leafCount = 8;
    for (let i = 0; i < leafCount; i++) {
      const leafGroup = new THREE.Group();
      const angle = (i * Math.PI * 2) / leafCount + (i * 0.2);
      const yPos = 0.3 + (i / leafCount) * 1.0;

      // Curved blade geometry
      const bladeCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.3, 0.15, 0),
        new THREE.Vector3(0.7, -0.1, 0)
      );
      const bladeGeo = new THREE.TubeGeometry(bladeCurve, 12, 0.08, 4, false);

      // Flatten tube into arched blade leaf
      bladeGeo.scale(1, 0.12, 1);

      const leafMesh = new THREE.Mesh(bladeGeo, leafMaterial);
      leafMesh.castShadow = !isSoftwareGl;
      leafGroup.add(leafMesh);

      // Lesion overlay mesh on same geometry
      const lesionOverlay = new THREE.Mesh(bladeGeo.clone(), lesionMaterial);
      lesionOverlay.scale.set(1.02, 1.02, 1.02);
      leafGroup.add(lesionOverlay);
      lesionMeshes.push(lesionOverlay);

      leafGroup.position.set(0, yPos, 0);
      leafGroup.rotation.y = angle;
      leafGroup.rotation.z = 0.25 + (i % 2 === 0 ? 0.15 : -0.1);
      plantGroup.add(leafGroup);
    }
    sceneRefs.current.lesionMeshes = lesionMeshes;

    // Part 9: Panicle Grain / Flowering Head
    const panicleGroup = new THREE.Group();
    panicleGroup.position.set(0, stemHeight, 0);
    for (let p = 0; p < 12; p++) {
      const grainSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.02, 0.22, 6),
        new THREE.MeshStandardMaterial({
          color: growthStage === "mature" ? 0xd97706 : 0x84cc16,
          roughness: 0.5,
        })
      );
      grainSpike.rotation.x = 0.4 + (p * 0.15);
      grainSpike.rotation.y = (p * Math.PI) / 6;
      grainSpike.position.y = (p * 0.02);
      panicleGroup.add(grainSpike);
    }
    plantGroup.add(panicleGroup);

    // Part 10 & 11: Multi-depth Soil Strata Cross-Section
    // Soil 0-10cm Surface layer
    const soilSurfaceGeo = new THREE.BoxGeometry(1.8, 0.2, 1.8);
    const soilSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0x3f2e18, // Rich loam humus
      roughness: 0.85,
      metalness: 0.05,
    });
    const soilSurfaceMesh = new THREE.Mesh(soilSurfaceGeo, soilSurfaceMat);
    soilSurfaceMesh.position.set(0, -0.1, 0);
    soilSurfaceMesh.receiveShadow = !isSoftwareGl;
    plantGroup.add(soilSurfaceMesh);
    sceneRefs.current.soilSurfaceMesh = soilSurfaceMesh;

    // Soil 10-40cm Deep Subsoil layer
    const soilDeepGeo = new THREE.BoxGeometry(1.8, 0.4, 1.8);
    const soilDeepMat = new THREE.MeshStandardMaterial({
      color: 0x27190c, // Deep clay substratum
      roughness: 0.95,
      metalness: 0.0,
    });
    const soilDeepMesh = new THREE.Mesh(soilDeepGeo, soilDeepMat);
    soilDeepMesh.position.set(0, -0.4, 0);
    soilDeepMesh.receiveShadow = !isSoftwareGl;
    plantGroup.add(soilDeepMesh);
    sceneRefs.current.soilDeepMesh = soilDeepMesh;

    // Part 12: Root system nodules
    const rootMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      roughness: 0.6,
    });
    for (let r = 0; r < 8; r++) {
      const rootCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.005, 0.4, 6),
        rootMat
      );
      rootCylinder.position.set(
        (Math.random() - 0.5) * 0.4,
        -0.25 - Math.random() * 0.2,
        (Math.random() - 0.5) * 0.4
      );
      rootCylinder.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      plantGroup.add(rootCylinder);
    }

    // 6. Rain / Microclimate Particles
    const rainCount = 400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i] = (Math.random() - 0.5) * 5;
      rainPos[i + 1] = Math.random() * 5;
      rainPos[i + 2] = (Math.random() - 0.5) * 5;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.04,
      transparent: true,
      opacity: 0.0, // hidden when sun
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    scene.add(rainPoints);
    sceneRefs.current.rainParticles = rainPoints;

    // 7. OrbitControls with smooth exponential damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.4;
    controls.maxDistance = 6.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0.4, 0);
    sceneRefs.current.controls = controls;

    // 8. Lossless 60fps Animation Loop with zero GC
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle wind sway physics on leaves
      if (plantGroup) {
        plantGroup.rotation.y = Math.sin(elapsed * 0.6) * 0.06;
      }

      // Rain animation
      if (rainPoints && (rainPoints.material as THREE.PointsMaterial).opacity > 0) {
        const positions = rainPoints.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= delta * 4;
          if (positions[i] < -0.5) positions[i] = 4.5;
        }
        rainPoints.geometry.attributes.position.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Effect: Toggle pathology lesions
  useEffect(() => {
    sceneRefs.current.lesionMeshes.forEach((mesh) => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.opacity = showLesions ? 0.95 : 0.0;
        mesh.material.needsUpdate = true;
      }
    });
  }, [showLesions]);

  // Effect: Soil slice visibility
  useEffect(() => {
    const { soilSurfaceMesh, soilDeepMesh } = sceneRefs.current;
    if (soilSurfaceMesh && soilDeepMesh) {
      soilSurfaceMesh.visible = soilSlice === "surface" || soilSlice === "full";
      soilDeepMesh.visible = soilSlice === "deep" || soilSlice === "full";
    }
  }, [soilSlice]);

  // Effect: Weather simulator
  useEffect(() => {
    const { rainParticles } = sceneRefs.current;
    if (rainParticles && rainParticles.material instanceof THREE.PointsMaterial) {
      rainParticles.material.opacity = weatherCondition === "rain" ? 0.85 : 0.0;
      rainParticles.material.needsUpdate = true;
    }
  }, [weatherCondition]);

  return (
    <div className="relative w-full h-[640px] md:h-[720px] rounded-3xl overflow-hidden bg-[#061a14] border border-white/20 shadow-2xl">
      {/* 3D Canvas Mount (stable ref outside re-rendering UI) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Spec Badge (Zero Viewport Occlusion) */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="px-3.5 py-1.5 rounded-full bg-[#09261E]/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-lg backdrop-blur-md">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>3D AGRI-TWIN SIMULATOR</span>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-white/90 text-xs font-medium">
          Crop: <span className="text-amber-300 font-semibold">{cropName}</span>
        </div>
        {activeDisease && (
          <div className="px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Pathology: {activeDisease}
          </div>
        )}
      </div>

      {/* Camera Guidance Prompt */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 text-emerald-200/80 text-xs border border-white/10">
        <span>Drag to orbit • Scroll to zoom</span>
      </div>

      {/* Consolidated Collapsible Bottom Control Dock (<=15% Viewport footprint) */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-3xl transition-transform duration-300 ${
          isCollapsed ? "translate-y-[calc(100%-42px)]" : "translate-y-0"
        }`}
      >
        {/* Toggle Collapse Pill */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-4 py-1 rounded-t-xl bg-[#0d3b32] hover:bg-[#124d42] border-t border-x border-white/20 text-xs font-semibold text-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> Show Controls
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> Hide Controls
              </>
            )}
          </button>
        </div>

        {/* Dock Surface (solid/rgba surface without backdrop-filter stall over WebGL) */}
        <div className="p-4 rounded-2xl bg-[#09261E]/95 border border-white/20 shadow-2xl text-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Pathology Lesion Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-300 font-semibold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-400" /> Lesion Overlay
              </label>
              <button
                onClick={() => setShowLesions(!showLesions)}
                className={`py-1.5 px-3 rounded-lg border font-medium transition-all ${
                  showLesions
                    ? "bg-amber-600/30 border-amber-500/60 text-amber-200"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                {showLesions ? "Necrosis Active" : "Healthy Foliage"}
              </button>
            </div>

            {/* Soil Strata Slice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-300 font-semibold flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Soil Strata
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(["surface", "deep", "full"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSoilSlice(s)}
                    className={`py-1 rounded text-[11px] font-medium uppercase border ${
                      soilSlice === s
                        ? "bg-emerald-600 border-emerald-400 text-white"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {s === "surface" ? "0-10cm" : s === "deep" ? "10-40cm" : "All"}
                  </button>
                ))}
              </div>
            </div>

            {/* Microclimate Simulation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-emerald-300 font-semibold flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-yellow-400" /> Weather Mode
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setWeatherCondition("sun")}
                  className={`py-1 px-2 rounded text-[11px] font-medium border flex items-center justify-center gap-1 ${
                    weatherCondition === "sun"
                      ? "bg-amber-600 border-amber-400 text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Sun className="w-3 h-3" /> Dry Sun
                </button>
                <button
                  onClick={() => setWeatherCondition("rain")}
                  className={`py-1 px-2 rounded text-[11px] font-medium border flex items-center justify-center gap-1 ${
                    weatherCondition === "rain"
                      ? "bg-blue-600 border-blue-400 text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <CloudRain className="w-3 h-3" /> Monsoon
                </button>
              </div>
            </div>

            {/* Reset Camera */}
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="text-emerald-300 font-semibold flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Perspective
              </label>
              <button
                onClick={() => {
                  if (sceneRefs.current.controls) {
                    sceneRefs.current.controls.reset();
                  }
                }}
                className="py-1.5 px-3 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-200 font-medium transition-colors"
              >
                Reset Camera
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
