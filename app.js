(() => {
  window.__profileMotionCleanup?.();

  const root = document.documentElement;
  const motionToggle = document.querySelector("#motion-toggle");
  const motionLabel = motionToggle?.querySelector(".motion-label");
  const { gsap, ScrollTrigger } = window;

  // Brand colors are useful even when the animation CDN is unavailable.
  document.querySelectorAll(".social-card").forEach((card) => {
    card.style.setProperty("--card-accent", card.dataset.accent || "#f8ddba");
  });

  root.dataset.motion = "off";
  if (!gsap) return;
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const lifecycle = new AbortController();
  const lifecycleOptions = { signal: lifecycle.signal };
  const revealedElements = new WeakSet();
  let motion;
  let manualMotion = null;
  let motionEnabled = false;
  let introPlayed = false;
  let pageSuspended = false;
  let updateLoops = () => {};

  function updatePlayback() {
    const hidden = document.hidden || pageSuspended;
    root.dataset.pageHidden = String(hidden);
    updateLoops(hidden);
  }

  function updateControl(enabled) {
    motionEnabled = enabled;
    root.dataset.motion = enabled ? "on" : "off";
    if (!motionToggle) return;
    const label = enabled ? "Tắt chuyển động" : "Bật chuyển động";
    motionToggle.hidden = false;
    motionToggle.setAttribute("aria-pressed", String(!enabled));
    motionToggle.setAttribute("aria-label", label);
    if (motionLabel) motionLabel.textContent = label;
  }

  function refreshLayout() {
    if (!lifecycle.signal.aborted && motionEnabled) ScrollTrigger?.refresh();
  }

  function setupMotion() {
    motion?.revert();
    motion = gsap.matchMedia();
    motion.add(
      {
        all: "all",
        reduceMotion: "(prefers-reduced-motion: reduce)",
        finePointer: "(hover: hover) and (pointer: fine)",
        desktop: "(min-width: 721px)"
      },
      (context) => {
        const { reduceMotion, finePointer, desktop } = context.conditions;
        const listeners = new AbortController();
        const listenerOptions = { signal: listeners.signal };
        const enabled = manualMotion ?? !reduceMotion;
        updateControl(enabled);

        // Reverting this context restores readable, static content immediately.
        if (!enabled) {
          introPlayed = true;
          return () => listeners.abort();
        }

        const loops = [];
        const hero = document.querySelector(".hero");
        const heroBounds = hero?.getBoundingClientRect();
        let heroVisible = !heroBounds || (heroBounds.bottom > 0 && heroBounds.top < window.innerHeight);
        let heroObserver;

        function loop(selector, options, heroOnly = false) {
          if (!document.querySelector(selector)) return;
          loops.push({ animation: gsap.to(selector, options), heroOnly });
        }

        updateLoops = (hidden) => {
          loops.forEach(({ animation, heroOnly }) => {
            animation.paused(hidden || (heroOnly && !heroVisible));
          });
          root.dataset.heroVisible = String(heroVisible);
        };

        // Never replay the entrance when the viewport or pointer type changes.
        if (!introPlayed && (!location.hash || location.hash === "#home")) {
          const intro = gsap.timeline({
            defaults: { duration: 0.9, ease: "power3.out" }
          });

          intro
            .from(".site-header", { y: -22, autoAlpha: 0, duration: 0.7 })
            .from(".eyebrow", { y: 18, autoAlpha: 0 }, "<0.18")
            .from(".title-line > span", {
              yPercent: 115,
              rotation: 3,
              stagger: 0.09,
              duration: 1.05
            }, "<0.08")
            .from(".hero-lead", { y: 24, autoAlpha: 0 }, "<0.38")
            .from(".hero-actions", { y: 20, autoAlpha: 0 }, "<0.12")
            .from(".hero-note", { y: 15, autoAlpha: 0, duration: 0.65 }, "<0.1")
            .from(".hero-visual", {
              x: desktop ? 65 : 0,
              y: desktop ? 0 : 40,
              scale: 0.92,
              rotation: 2,
              autoAlpha: 0,
              duration: 1.25
            }, 0.32)
            .from(".floating-chip", {
              scale: 0.7,
              autoAlpha: 0,
              stagger: 0.12,
              duration: 0.7,
              ease: "back.out(1.7)"
            }, 1.05);
        }
        introPlayed = true;

        loop(".orbit-one", { rotation: "+=360", duration: 65, repeat: -1, ease: "none" }, true);
        loop(".orbit-two", { rotation: "-=360", duration: 86, repeat: -1, ease: "none" }, true);
        loop(".chip-top", {
          y: -9, rotation: -2, duration: 4.2, repeat: -1, yoyo: true, ease: "sine.inOut"
        }, true);
        loop(".chip-bottom", {
          y: 8, rotation: 2, duration: 4.8, repeat: -1, yoyo: true, ease: "sine.inOut"
        }, true);
        loop(".hero-planet", {
          y: -10, rotation: 4, duration: 6.5, repeat: -1, yoyo: true, ease: "sine.inOut"
        }, true);
        loop(".star--bright", {
          opacity: 0.4, duration: 3.8, repeat: -1, yoyo: true, stagger: 0.65, ease: "sine.inOut"
        });

        if (hero && "IntersectionObserver" in window) {
          heroObserver = new IntersectionObserver(([entry]) => {
            heroVisible = entry.isIntersecting;
            updatePlayback();
          });
          heroObserver.observe(hero);
        }
        updatePlayback();

        if (ScrollTrigger) {
          gsap.to(".page-progress span", {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "max",
              scrub: 0.15
            }
          });

          gsap.to(".portrait-inner img", {
            yPercent: 8,
            scale: 1.16,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero", start: "top top", end: "bottom top", scrub: 1
            }
          });

          if (document.querySelector(".hero-planet")) {
            // The float uses y; parallax uses yPercent so both can coexist.
            gsap.to(".hero-planet", {
              yPercent: -26,
              ease: "none",
              scrollTrigger: {
                trigger: ".hero", start: "top top", end: "bottom top", scrub: 1.5
              }
            });
          }

          gsap.to(".ambient-one", {
            xPercent: -16,
            yPercent: 22,
            ease: "none",
            scrollTrigger: {
              trigger: "body", start: "top top", end: "bottom bottom", scrub: 2
            }
          });

          gsap.utils.toArray(".reveal-item:not(.social-card)").forEach((element) => {
            if (revealedElements.has(element)) return;
            gsap.from(element, {
              y: 38,
              autoAlpha: 0,
              duration: 0.95,
              ease: "power3.out",
              onComplete: () => revealedElements.add(element),
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                toggleActions: "play none none reverse"
              }
            });
          });

          const socialCards = gsap.utils.toArray(".social-card").filter((card) => !revealedElements.has(card));
          if (socialCards.length) {
            gsap.from(socialCards, {
              y: 36,
              autoAlpha: 0,
              stagger: 0.09,
              duration: 0.8,
              ease: "power3.out",
              onComplete: () => socialCards.forEach((card) => revealedElements.add(card)),
              scrollTrigger: {
                trigger: ".social-grid",
                start: "top 82%",
                toggleActions: "play none none reverse"
              }
            });
          }

          gsap.to(".closing-shape", {
            rotation: 20,
            scale: 1.08,
            ease: "none",
            scrollTrigger: {
              trigger: ".closing", start: "top bottom", end: "bottom top", scrub: 1.4
            }
          });

          if (document.querySelector(".closing-planet")) {
            gsap.fromTo(".closing-planet", { y: 24 }, {
              y: -24,
              ease: "none",
              scrollTrigger: {
                trigger: ".closing", start: "top bottom", end: "bottom top", scrub: 1.6
              }
            });
          }
        }

        if (finePointer) {
          const glowX = gsap.quickTo(".cursor-glow", "x", { duration: 0.55, ease: "power3.out" });
          const glowY = gsap.quickTo(".cursor-glow", "y", { duration: 0.55, ease: "power3.out" });
          window.addEventListener("pointermove", (event) => {
            glowX(event.clientX);
            glowY(event.clientY);
          }, listenerOptions);

          document.querySelectorAll(".magnetic").forEach((element) => {
            const xTo = gsap.quickTo(element, "x", { duration: 0.45, ease: "power3.out" });
            const yTo = gsap.quickTo(element, "y", { duration: 0.45, ease: "power3.out" });
            element.addEventListener("pointermove", (event) => {
              const bounds = element.getBoundingClientRect();
              xTo((event.clientX - bounds.left - bounds.width / 2) * 0.18);
              yTo((event.clientY - bounds.top - bounds.height / 2) * 0.18);
            }, listenerOptions);
            element.addEventListener("pointerleave", () => {
              xTo(0);
              yTo(0);
            }, listenerOptions);
          });

          document.querySelectorAll("[data-tilt]").forEach((card) => {
            const rotateX = gsap.quickTo(card, "rotationX", { duration: 0.45, ease: "power3.out" });
            const rotateY = gsap.quickTo(card, "rotationY", { duration: 0.45, ease: "power3.out" });
            card.addEventListener("pointermove", (event) => {
              const bounds = card.getBoundingClientRect();
              const px = (event.clientX - bounds.left) / bounds.width;
              const py = (event.clientY - bounds.top) / bounds.height;
              card.style.setProperty("--mx", `${px * 100}%`);
              card.style.setProperty("--my", `${py * 100}%`);
              rotateX((0.5 - py) * 5);
              rotateY((px - 0.5) * 5);
            }, listenerOptions);
            card.addEventListener("pointerleave", () => {
              rotateX(0);
              rotateY(0);
            }, listenerOptions);
          });

          const portrait = document.querySelector(".portrait-frame");
          const heroVisual = document.querySelector(".hero-visual");
          if (portrait && heroVisual) {
            const portraitX = gsap.quickTo(portrait, "rotationY", { duration: 0.65, ease: "power3.out" });
            const portraitY = gsap.quickTo(portrait, "rotationX", { duration: 0.65, ease: "power3.out" });
            heroVisual.addEventListener("pointermove", (event) => {
              const bounds = portrait.getBoundingClientRect();
              portraitX(((event.clientX - bounds.left) / bounds.width - 0.5) * 7);
              portraitY((0.5 - (event.clientY - bounds.top) / bounds.height) * 7);
            }, listenerOptions);
            heroVisual.addEventListener("pointerleave", () => {
              portraitX(0);
              portraitY(0);
            }, listenerOptions);
          }
        }

        return () => {
          listeners.abort();
          heroObserver?.disconnect();
          updateLoops = () => {};
          document.querySelectorAll("[data-tilt]").forEach((card) => {
            card.style.removeProperty("--mx");
            card.style.removeProperty("--my");
          });
        };
      }
    );
  }

  motionToggle?.addEventListener("click", () => {
    manualMotion = !motionEnabled;
    setupMotion();
    refreshLayout();
  }, lifecycleOptions);

  document.addEventListener("visibilitychange", updatePlayback, lifecycleOptions);
  window.addEventListener("pagehide", () => {
    pageSuspended = true;
    updatePlayback();
  }, lifecycleOptions);
  window.addEventListener("pageshow", () => {
    pageSuspended = false;
    updatePlayback();
    refreshLayout();
  }, lifecycleOptions);
  window.addEventListener("load", refreshLayout, { ...lifecycleOptions, once: true });
  document.fonts?.ready.then(refreshLayout);

  window.__profileMotionCleanup = () => {
    lifecycle.abort();
    motion?.revert();
    root.dataset.motion = "off";
  };

  setupMotion();
})();
