"use client";

import { useEffect, useRef, type RefObject } from "react";

const MOBILE_QUERY = "(max-width: 750px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_AUTOPLAY_MS = 1800;
const SMOOTHING = 10;
const MAX_DEVICE_PIXEL_RATIO = 2;

type LaptopScrubProps = {
  frames: string[] | null;
  intro: string;
  pinTarget: RefObject<HTMLElement | null>;
};

type FrameImage = {
  element: HTMLImageElement;
  ready: boolean;
};

function nearestReadyFrame(images: FrameImage[], index: number): FrameImage | null {
  if (images.length === 0) {
    return null;
  }

  if (images[index]?.ready) {
    return images[index];
  }

  for (let distance = 1; distance < images.length; distance += 1) {
    const previous = images[index - distance];
    if (previous?.ready) {
      return previous;
    }

    const next = images[index + distance];
    if (next?.ready) {
      return next;
    }
  }

  return null;
}

export function LaptopScrub({ frames, intro, pinTarget }: LaptopScrubProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameList = frames && frames.length > 0 ? frames : null;

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const canvas = frameList ? canvasRef.current : null;
    const pinElement = pinTarget.current ?? root;
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const reduceQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const images: FrameImage[] = [];
    let reduced = reduceQuery.matches;
    let visible = typeof IntersectionObserver === "undefined";
    let disposed = false;
    let rafId = 0;
    let running = false;
    let lastFrameTime = 0;
    let currentProgress = reduced ? 1 : 0;
    let targetProgress = currentProgress;
    let mobileElapsed = 0;
    let lastMobileTime = 0;
    let mobileFinished = reduced;
    let gsapContext: { revert: () => void } | null = null;

    const context = canvas?.getContext("2d") ?? null;

    const applyProgress = (progress: number) => {
      currentProgress = Math.max(0, Math.min(1, progress));
      root.style.setProperty("--laptop-progress", currentProgress.toFixed(4));
      root.dataset.laptopProgress = currentProgress.toFixed(4);

      if (!canvas || !context || images.length === 0) {
        return;
      }

      const frameIndex = Math.round(currentProgress * (images.length - 1));
      const frame = nearestReadyFrame(images, frameIndex);

      if (!frame) {
        return;
      }

      const { element } = frame;
      const width = canvas.width;
      const height = canvas.height;

      context.clearRect(0, 0, width, height);

      if (!element.naturalWidth || !element.naturalHeight) {
        return;
      }

      const scale = Math.min(
        width / element.naturalWidth,
        height / element.naturalHeight,
      );
      const drawWidth = element.naturalWidth * scale;
      const drawHeight = element.naturalHeight * scale;

      context.drawImage(
        element,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
      root.dataset.laptopFrame = String(frameIndex);
    };

    const sizeCanvas = () => {
      if (!canvas) {
        return;
      }

      const parent = canvas.parentElement;
      const width = Math.max(1, parent?.clientWidth ?? canvas.clientWidth);
      const height = Math.max(1, parent?.clientHeight ?? canvas.clientHeight);
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        MAX_DEVICE_PIXEL_RATIO,
      );

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      applyProgress(currentProgress);
    };

    const stopLoop = () => {
      running = false;
      lastFrameTime = 0;

      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const tick = (now: number) => {
      if (
        disposed ||
        reduced ||
        !visible ||
        document.visibilityState === "hidden"
      ) {
        stopLoop();
        return;
      }

      const delta = lastFrameTime
        ? Math.min(0.05, (now - lastFrameTime) / 1000)
        : 1 / 60;
      lastFrameTime = now;

      const difference = targetProgress - currentProgress;
      currentProgress += difference * (1 - Math.exp(-SMOOTHING * delta));
      applyProgress(currentProgress);

      if (Math.abs(targetProgress - currentProgress) < 0.0008) {
        applyProgress(targetProgress);
        stopLoop();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (
        running ||
        disposed ||
        reduced ||
        !visible ||
        document.visibilityState === "hidden"
      ) {
        return;
      }

      running = true;
      lastFrameTime = 0;
      rafId = window.requestAnimationFrame(tick);
    };

    const stopMobileAutoplay = () => {
      lastMobileTime = 0;

      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const mobileTick = (now: number) => {
      if (disposed || reduced || mobileFinished) {
        stopMobileAutoplay();
        return;
      }

      if (!visible || document.visibilityState === "hidden") {
        stopMobileAutoplay();
        return;
      }

      if (lastMobileTime) {
        mobileElapsed += now - lastMobileTime;
      }

      lastMobileTime = now;

      const progress = Math.min(1, mobileElapsed / MOBILE_AUTOPLAY_MS);

      applyProgress(progress);

      if (progress >= 1) {
        mobileFinished = true;
        root.dataset.laptopAutoplayed = "true";
        stopMobileAutoplay();
        return;
      }

      rafId = window.requestAnimationFrame(mobileTick);
    };

    const startMobileAutoplay = () => {
      if (
        disposed ||
        reduced ||
        mobileFinished ||
        rafId ||
        !visible ||
        document.visibilityState === "hidden"
      ) {
        return;
      }

      rafId = window.requestAnimationFrame(mobileTick);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopLoop();
        stopMobileAutoplay();
        return;
      }

      if (mobileQuery.matches) {
        startMobileAutoplay();
      } else {
        startLoop();
      }
    };

    const onReducedMotionChange = (event: MediaQueryListEvent) => {
      reduced = event.matches;

      if (reduced) {
        stopLoop();
        stopMobileAutoplay();
        targetProgress = 1;
        applyProgress(1);
      } else if (mobileQuery.matches) {
        startMobileAutoplay();
      } else {
        startLoop();
      }
    };

    root.dataset.laptopMode = frameList ? "frames" : "css";
    root.dataset.laptopReady = "true";
    root.dataset.laptopAutoplay = mobileQuery.matches ? "true" : "false";
    root.dataset.laptopAutoplayed = mobileFinished ? "true" : "false";

    if (reduced) {
      root.dataset.laptopPinned = "false";
      applyProgress(1);
    } else if (mobileQuery.matches) {
      root.dataset.laptopPinned = "false";
      applyProgress(0);
    } else {
      root.dataset.laptopPinned = "false";
      applyProgress(0);
    }

    if (frameList) {
      frameList.forEach((source, index) => {
        const element = new Image();
        const frame: FrameImage = { element, ready: false };

        images.push(frame);
        element.decoding = "async";
        element.onload = () => {
          frame.ready = true;

          if (!disposed) {
            applyProgress(currentProgress);
          }
        };
        element.onerror = () => {
          element.dataset.failed = "true";
        };
        element.src = source;
        root.dataset.laptopFrames = String(index + 1);
      });
    }

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            sizeCanvas();
          });

    resizeObserver?.observe(canvas?.parentElement ?? root);
    sizeCanvas();

    const intersectionObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              visible = entries[0]?.isIntersecting ?? true;

              if (!visible) {
                stopLoop();
                stopMobileAutoplay();
              } else if (reduced) {
                applyProgress(1);
              } else if (mobileQuery.matches) {
                startMobileAutoplay();
              } else {
                startLoop();
              }
            },
            { threshold: 0 },
          );

    intersectionObserver?.observe(root);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reduceQuery.addEventListener("change", onReducedMotionChange);

    if (!reduced && mobileQuery.matches) {
      startMobileAutoplay();
    }

    if (!reduced && !mobileQuery.matches) {
      void (async () => {
        try {
          const [{ gsap }, { ScrollTrigger }] = await Promise.all([
            import("gsap"),
            import("gsap/ScrollTrigger"),
          ]);

          if (disposed) {
            return;
          }

          gsap.registerPlugin(ScrollTrigger);

          gsapContext = gsap.context(() => {
            ScrollTrigger.create({
              trigger: pinElement,
              start: "top top",
              end: "+=120%",
              pin: pinElement,
              pinSpacing: true,
              scrub: true,
              invalidateOnRefresh: true,
              onRefresh: (self) => {
                targetProgress = self.progress;
                applyProgress(self.progress);
              },
              onUpdate: (self) => {
                targetProgress = self.progress;
                startLoop();
              },
            });
          }, pinElement);

          root.dataset.laptopPinned = "true";
          root.dataset.laptopGsap = "true";
        } catch {
          root.dataset.laptopGsap = "failed";
        }
      })();
    }

    return () => {
      disposed = true;
      stopLoop();
      stopMobileAutoplay();
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reduceQuery.removeEventListener("change", onReducedMotionChange);
      gsapContext?.revert();
    };
  }, [frameList, pinTarget]);

  return (
    <div
      ref={rootRef}
      className="laptop-scrub"
      data-laptop-visual
      data-laptop-progress="0"
      aria-hidden="true"
    >
      <div className="laptop-scrub-glow" />

      {frameList ? (
        <div className="laptop-frame-stage">
          <canvas ref={canvasRef} className="laptop-frame-canvas" />
        </div>
      ) : (
        <div className="laptop-css-stage">
          <div className="laptop-css">
            <div className="laptop-css-lid">
              <div className="laptop-css-face laptop-css-face-front">
                <div className="laptop-css-screen">
                  <p className="laptop-css-intro">{intro}</p>
                  <div className="laptop-css-code">
                    <span className="code-line w-11/12" />
                    <span className="code-line w-9/12" />
                    <span className="code-line w-10/12" />
                    <span className="code-line w-7/12" />
                  </div>
                  <span className="laptop-css-cursor" />
                </div>
              </div>
              <div className="laptop-css-face laptop-css-face-back">
                <span className="laptop-css-mark">PORTFOLIO</span>
              </div>
            </div>
            <div className="laptop-css-base">
              <span className="laptop-css-notch" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
