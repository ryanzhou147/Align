"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const LS_LINES_KEY = "dental_lines_v1";

type SavedLine = { sx: number; sy: number; sz: number; ex: number; ey: number; ez: number };

function loadSavedLines(): SavedLine[] {
  if (typeof window === "undefined") return [];
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
}

export default function SurgeryViewer({ onLoad, revealLines, planeScan }: SurgeryViewerProps) {
  const mountRef      = useRef<HTMLDivElement>(null);
  const rafRef        = useRef<number | null>(null);
  const lineMeshesRef = useRef<THREE.Mesh[]>([]);
  const timersRef     = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sceneRef      = useRef<THREE.Scene | null>(null);

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

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 100, 100);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0, 0);
    controls.update();

    const meshes: THREE.Mesh[] = [];
    loadSavedLines().forEach(({ sx, sy, sz, ex, ey, ez }) => {
      const mesh = makeTubeLine(
        new THREE.Vector3(sx, sy, sz),
        new THREE.Vector3(ex, ey, ez),
        0,
      );
      scene.add(mesh);
      meshes.push(mesh);
    });
    lineMeshesRef.current = meshes;

    new STLLoader().load("/dental-model.stl", (geometry) => {
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox!.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);
      geometry.computeBoundingSphere();
      const s = 80 / geometry.boundingSphere!.radius;
      geometry.scale(s, s, s);

      scene.add(new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: 0xf0e0c0, specular: 0x888888, shininess: 60,
      })));

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

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      observer.disconnect();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plane sweep scan: horizontal plane descends, revealing lines as it passes them
  useEffect(() => {
    if (!planeScan || !sceneRef.current) return;
    const scene = sceneRef.current;

    const SCAN_DURATION = 5000;
    const Y_START = 90;
    const Y_END   = -90;

    // Reset all lines to hidden
    lineMeshesRef.current.forEach(mesh => {
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0;
    });

    // Scan plane — square flat horizontal plane
    const planeGeo = new THREE.PlaneGeometry(200, 200);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x4AAEE0, transparent: true, opacity: 0.18,
      side: THREE.DoubleSide, depthTest: false,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = Math.PI / 2;
    plane.renderOrder = 1000;
    scene.add(plane);

    // Bright leading edge glow line
    const glowGeo = new THREE.PlaneGeometry(200, 1.2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x88ddff, transparent: true, opacity: 0.95,
      side: THREE.DoubleSide, depthTest: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    glow.renderOrder = 1001;
    scene.add(glow);

    const startTime = performance.now();
    let rafId: number;

    const tick = () => {
      const progress = Math.min((performance.now() - startTime) / SCAN_DURATION, 1);
      const currentY = Y_START + (Y_END - Y_START) * progress;

      plane.position.y = currentY;
      glow.position.y  = currentY - 1.5;

      // Reveal lines whose midpoint has been passed by the plane
      lineMeshesRef.current.forEach(mesh => {
        if ((mesh.material as THREE.MeshBasicMaterial).opacity === 0 && mesh.position.y >= currentY) {
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
        }
      });

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Reveal any remaining lines and clean up
        lineMeshesRef.current.forEach(mesh => {
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
        });
        scene.remove(plane);
        scene.remove(glow);
        planeGeo.dispose();
        planeMat.dispose();
        glowGeo.dispose();
        glowMat.dispose();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [planeScan]);

  // Staggered fade-in when revealLines becomes true
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

  return <div ref={mountRef} style={{ flex: 1, cursor: "grab", minHeight: 0, touchAction: "none" }} />;
}
