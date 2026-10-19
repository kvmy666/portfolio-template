"use client";

import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Scene,
  TetrahedronGeometry,
  WebGLRenderer,
  type BufferAttribute,
} from "three";

const EMERALD = {
  deep: 0x0a5c2a,
  mid: 0x00b13f,
  light: 0x7dffb0,
} as const;

const MOBILE_QUERY = "(max-width: 750px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function pixelRatioCap(): number {
  return window.matchMedia(MOBILE_QUERY).matches ? 1.5 : 2;
}

function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer | null {
  try {
    return new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
}

export default function HeroSplash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;

    if (!canvas || !container) {
      return;
    }

    const renderer = createRenderer(canvas);

    if (!renderer) {
      queueMicrotask(() => setFailed(true));
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap()));

    const scene = new Scene();
    const camera = new PerspectiveCamera(
      42,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      100,
    );
    camera.position.set(0, 0.08, 4.7);

    const ambient = new AmbientLight(EMERALD.light, 0.9);
    const key = new DirectionalLight(EMERALD.light, 2.6);
    key.position.set(2.4, 3.2, 4);
    const fill = new DirectionalLight(EMERALD.mid, 1.4);
    fill.position.set(-3, -1.4, 2.4);
    scene.add(ambient, key, fill);

    const coreGeometry = new IcosahedronGeometry(1.08, 2);
    const basePositions = Float32Array.from(
      coreGeometry.getAttribute("position").array,
    );
    const coreMaterial = new MeshStandardMaterial({
      color: EMERALD.deep,
      roughness: 0.4,
      metalness: 0.28,
      flatShading: true,
    });
    const core = new Mesh(coreGeometry, coreMaterial);
    core.position.y = 0.08;
    scene.add(core);

    const orbitGeometryA = new OctahedronGeometry(0.32, 0);
    const orbitMaterialA = new MeshStandardMaterial({
      color: EMERALD.light,
      roughness: 0.32,
      metalness: 0.34,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });
    const orbiterA = new Mesh(orbitGeometryA, orbitMaterialA);
    orbiterA.position.set(1.62, 0.7, -0.3);

    const orbitGeometryB = new TetrahedronGeometry(0.26, 0);
    const orbitMaterialB = new MeshStandardMaterial({
      color: EMERALD.mid,
      roughness: 0.42,
      metalness: 0.24,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    });
    const orbiterB = new Mesh(orbitGeometryB, orbitMaterialB);
    orbiterB.position.set(-1.55, -0.72, 0.18);

    const orbit = new Group();
    orbit.add(orbiterA, orbiterB);
    scene.add(orbit);

    const reduceQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    let reduced = reduceQuery.matches;
    let visible = true;
    let running = false;
    let disposed = false;
    let frameId = 0;
    const startedAt = performance.now();

    const getSize = () => ({
      width: Math.max(1, container.clientWidth),
      height: Math.max(1, container.clientHeight),
    });

    const resize = () => {
      if (disposed) {
        return;
      }

      const { width, height } = getSize();
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, pixelRatioCap()),
      );
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (reduced) {
        renderFrame(performance.now());
      }
    };

    const renderFrame = (now: number) => {
      const elapsed = (now - startedAt) / 1000;

      const position = coreGeometry.getAttribute("position") as BufferAttribute;
      const target = position.array as Float32Array;

      for (let index = 0; index < target.length; index += 3) {
        const x = basePositions[index];
        const y = basePositions[index + 1];
        const z = basePositions[index + 2];
        const breath =
          Math.sin(x * 2.1 + elapsed * 0.82) *
          Math.cos(y * 1.7 - elapsed * 0.61) *
          Math.sin(z * 2.3 + elapsed * 0.47);
        const scale = 1 + breath * 0.075;

        target[index] = x * scale;
        target[index + 1] = y * scale;
        target[index + 2] = z * scale;
      }

      position.needsUpdate = true;
      core.rotation.y = elapsed * 0.11;
      core.rotation.x = Math.sin(elapsed * 0.17) * 0.14;
      orbit.rotation.y = -elapsed * 0.16;
      orbit.rotation.z = Math.sin(elapsed * 0.11) * 0.1;
      orbiterA.rotation.x = elapsed * 0.4;
      orbiterA.rotation.y = elapsed * 0.28;
      orbiterB.rotation.y = elapsed * 0.34;
      orbiterB.rotation.z = elapsed * 0.22;

      renderer.render(scene, camera);
      canvas.dataset.heroReady = "true";
    };

    const tick = (now: number) => {
      if (!running) {
        return;
      }

      renderFrame(now);
      frameId = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const start = () => {
      if (
        disposed ||
        running ||
        reduced ||
        !visible ||
        document.visibilityState === "hidden"
      ) {
        return;
      }

      running = true;
      frameId = window.requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        start();
      }
    };

    const onMotionPreference = (event: MediaQueryListEvent) => {
      reduced = event.matches;

      if (reduced) {
        stop();
        renderFrame(performance.now());
      } else {
        start();
      }
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
      setFailed(true);
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              visible = entries[0]?.isIntersecting ?? true;

              if (visible) {
                start();
              } else {
                stop();
              }
            },
            { threshold: 0 },
          );

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(resize);

    observer?.observe(container);
    resizeObserver?.observe(container);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reduceQuery.addEventListener("change", onMotionPreference);
    canvas.addEventListener("webglcontextlost", onContextLost);

    resize();

    if (reduced) {
      renderFrame(performance.now());
    } else {
      start();
    }

    return () => {
      disposed = true;
      stop();
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reduceQuery.removeEventListener("change", onMotionPreference);
      canvas.removeEventListener("webglcontextlost", onContextLost);

      scene.remove(core, orbit);
      coreGeometry.dispose();
      orbitGeometryA.dispose();
      orbitGeometryB.dispose();
      coreMaterial.dispose();
      orbitMaterialA.dispose();
      orbitMaterialB.dispose();
      renderer.dispose();
    };
  }, []);

  if (failed) {
    return (
      <div
        className="hero-splash-fallback"
        data-hero-fallback
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="hero-splash-canvas"
      data-hero-canvas
      aria-hidden="true"
    />
  );
}
