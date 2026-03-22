"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const LS_LINES_KEY = "dental_lines_v1";

type SavedLine = { sx: number; sy: number; sz: number; ex: number; ey: number; ez: number };

async function loadAnnotations(): Promise<SavedLine[]> {
  try {
    const res = await fetch("/dental-annotations.json");
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  try { return JSON.parse(localStorage.getItem(LS_LINES_KEY) ?? "[]"); }
  catch { return []; }
}

function makeTubeLine(start: THREE.Vector3, end: THREE.Vector3, opacity = 0): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  if (length < 0.01) { const m = new THREE.Mesh(); m.userData = { start, end }; return m; }
  const mat = new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, length, 8), mat);
  mesh.renderOrder = 999;
  mesh.position.copy(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.userData = { start: start.clone(), end: end.clone() };
  return mesh;
}

interface SurgeryViewerProps {
  onLoad: () => void;
  revealLines?: boolean;
  planeScan?: boolean;
  drawMode?: boolean;
  onAnnotationsChange?: (lines: SavedLine[]) => void;
}

export default function SurgeryViewer({ onLoad, revealLines, planeScan, drawMode, onAnnotationsChange }: SurgeryViewerProps) {
  const mountRef        = useRef<HTMLDivElement>(null);
  const rafRef          = useRef<number | null>(null);
  const lineMeshesRef   = useRef<THREE.Mesh[]>([]);
  const timersRef       = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sceneRef        = useRef<THREE.Scene | null>(null);
  const cameraRef       = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef     = useRef<OrbitControls | null>(null);
  const modelMeshRef    = useRef<THREE.Mesh | null>(null);
  const pendingStartRef = useRef<THREE.Vector3 | null>(null);
  const previewDotRef   = useRef<THREE.Mesh | null>(null);
  const drawModeRef     = useRef(drawMode ?? false);
  const annotationsRef  = useRef<SavedLine[]>([]);

  // keep drawModeRef in sync without re-running main effect
  useEffect(() => { drawModeRef.current = drawMode ?? false; }, [drawMode]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x1a2a3a);
    renderer.localClippingEnabled = true;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(0, 0, 200);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 100, 100);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    loadAnnotations().then(lines => {
      annotationsRef.current = lines;
      const meshes: THREE.Mesh[] = [];
      lines.forEach(({ sx, sy, sz, ex, ey, ez }) => {
        const mesh = makeTubeLine(
          new THREE.Vector3(sx, sy, sz),
          new THREE.Vector3(ex, ey, ez),
          0.8,
        );
        scene.add(mesh);
        meshes.push(mesh);
      });
      lineMeshesRef.current = meshes;
    });

    new STLLoader().load("/dental-model.stl", (geometry) => {
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox!.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);
      geometry.computeBoundingSphere();
      const s = 80 / geometry.boundingSphere!.radius;
      geometry.scale(s, s, s);

      const modelMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: 0xf0e0c0, specular: 0x888888, shininess: 60,
      }));
      scene.add(modelMesh);
      modelMeshRef.current = modelMesh;
      onLoad();
    });

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const observer = new ResizeObserver(() => {
      const nw = mount.clientWidth, nh = mount.clientHeight;
      if (!nw || !nh) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    observer.observe(mount);

    // --- Click handler for draw mode ---
    const raycaster = new THREE.Raycaster();
    const handleClick = (e: MouseEvent) => {
      if (!drawModeRef.current || !modelMeshRef.current || !cameraRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, cameraRef.current);
      const hits = raycaster.intersectObject(modelMeshRef.current);
      if (!hits.length) return;

      const point = hits[0].point.clone();

      if (!pendingStartRef.current) {
        // First click — store start, show preview dot
        pendingStartRef.current = point;

        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x00ff88, depthTest: false }),
        );
        dot.position.copy(point);
        dot.renderOrder = 1002;
        scene.add(dot);
        previewDotRef.current = dot;
      } else {
        // Second click — draw the tube
        const start = pendingStartRef.current;
        const mesh = makeTubeLine(start, point, 0.8);
        scene.add(mesh);
        lineMeshesRef.current.push(mesh);

        const line: SavedLine = {
          sx: start.x, sy: start.y, sz: start.z,
          ex: point.x, ey: point.y, ez: point.z,
        };
        annotationsRef.current = [...annotationsRef.current, line];
        onAnnotationsChange?.(annotationsRef.current);

        // Clean up preview dot
        if (previewDotRef.current) {
          scene.remove(previewDotRef.current);
          previewDotRef.current = null;
        }
        pendingStartRef.current = null;
      }
    };

    const cancelPending = () => {
      if (previewDotRef.current) {
        scene.remove(previewDotRef.current);
        previewDotRef.current = null;
      }
      pendingStartRef.current = null;
    };

    const handleRightClick = (e: MouseEvent) => {
      if (!drawModeRef.current) return;
      e.preventDefault();
      cancelPending();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelPending();
    };

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("contextmenu", handleRightClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("contextmenu", handleRightClick);
      window.removeEventListener("keydown", handleKeyDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      observer.disconnect();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plane sweep scan
  useEffect(() => {
    if (!planeScan || !sceneRef.current) return;
    const scene = sceneRef.current;

    const SCAN_DURATION = 5000;
    const Y_START = 90; const Y_END = -90;
    const Z_START = -120; const Z_END = 120;

    lineMeshesRef.current.forEach(mesh => {
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0;
    });

    const planeGeoY = new THREE.PlaneGeometry(200, 200);
    const planeMatY = new THREE.MeshBasicMaterial({ color: 0x4AAEE0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthTest: false });
    const planeY = new THREE.Mesh(planeGeoY, planeMatY);
    planeY.rotation.x = Math.PI / 2;
    planeY.renderOrder = 1000;
    scene.add(planeY);

    const glowGeoY = new THREE.PlaneGeometry(200, 1.2);
    const glowMatY = new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false });
    const glowY = new THREE.Mesh(glowGeoY, glowMatY);
    glowY.rotation.x = Math.PI / 2;
    glowY.renderOrder = 1001;
    scene.add(glowY);

    const planeGeoZ = new THREE.PlaneGeometry(200, 200);
    const planeMatZ = new THREE.MeshBasicMaterial({ color: 0x4AAEE0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false });
    const planeZ = new THREE.Mesh(planeGeoZ, planeMatZ);
    planeZ.renderOrder = 1000;
    scene.add(planeZ);

    const glowGeoZ = new THREE.PlaneGeometry(200, 1.2);
    const glowMatZ = new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false });
    const glowZ = new THREE.Mesh(glowGeoZ, glowMatZ);
    glowZ.renderOrder = 1001;
    scene.add(glowZ);

    const startTime = performance.now();
    const FADE_MS = 600;
    const revealedAt = new Map<THREE.Mesh, number>();
    let rafId: number;

    const tick = () => {
      const now = performance.now();
      const progress = Math.min((now - startTime) / SCAN_DURATION, 1);

      const currentY = Y_START + (Y_END - Y_START) * progress;
      planeY.position.y = currentY;
      glowY.position.y  = currentY - 1.5;

      const currentZ = Z_START + (Z_END - Z_START) * progress;
      planeZ.position.z = currentZ;
      glowZ.position.z  = currentZ - 1.5;

      lineMeshesRef.current.forEach(mesh => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        const passed = mesh.position.y >= currentY;
        if (passed && !revealedAt.has(mesh)) revealedAt.set(mesh, now);
        const t = revealedAt.get(mesh);
        if (t !== undefined) {
          const fadeProgress = Math.min((now - t) / FADE_MS, 1);
          mat.opacity = (1 - Math.pow(1 - fadeProgress, 2)) * 0.8;
        }
      });

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        lineMeshesRef.current.forEach(mesh => {
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
        });
        [planeY, glowY, planeZ, glowZ].forEach(m => scene.remove(m));
        [planeGeoY, glowGeoY, planeGeoZ, glowGeoZ].forEach(g => g.dispose());
        [planeMatY, glowMatY, planeMatZ, glowMatZ].forEach(m => m.dispose());
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [planeScan]);

  // Staggered fade-in
  useEffect(() => {
    if (!revealLines) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const STAGGER_MS = 320;
    const FADE_MS    = 550;
    const TARGET_OPACITY = 0.8;

    lineMeshesRef.current.forEach((mesh, i) => {
      const t = setTimeout(() => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        const start = performance.now();
        const tick = () => {
          const progress = Math.min((performance.now() - start) / FADE_MS, 1);
          mat.opacity = (1 - Math.pow(1 - progress, 2)) * TARGET_OPACITY;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, i * STAGGER_MS);
      timersRef.current.push(t);
    });
  }, [revealLines]);

  return (
    <div
      ref={mountRef}
      style={{
        flex: 1,
        cursor: drawMode ? "crosshair" : "grab",
        minHeight: 0,
        touchAction: "none",
      }}
    />
  );
}
