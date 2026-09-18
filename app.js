/* global gsap, ScrollTrigger */

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll(".social-card").forEach((card) => {
    card.style.setProperty("--card-accent", card.dataset.accent || "#ffffff");
  });

  const motion = gsap.matchMedia();

  motion.add(
    {
      reduceMotion: "(prefers-reduced-motion: reduce)",
      finePointer: "(hover: hover) and (pointer: fine)",
      desktop: "(min-width: 721px)"
    },
    (context) => {
      const { reduceMotion, finePointer, desktop } = context.conditions;
      const listeners = new AbortController();
      const listenerOptions = { signal: listeners.signal };

      if (reduceMotion) {
        gsap.set(".title-line > span, .hero-animate, .hero-visual, .site-header, .reveal-item", {
          clearProps: "all"
        });
        return () => listeners.abort();
      }

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

      gsap.to(".orbit-one", {
        rotation: 360,
        duration: 30,
        repeat: -1,
        ease: "none"
      });

      gsap.to(".orbit-two", {
        rotation: -305,
        duration: 38,
        repeat: -1,
        ease: "none"
      });

      gsap.to(".chip-top", {
        y: -12,
        rotation: -2,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".chip-bottom", {
        y: 10,
        rotation: 2,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

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
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1
        }
      });

      gsap.to(".ambient-one", {
        xPercent: -24,
        yPercent: 34,
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 2
        }
      });

      gsap.utils.toArray(".reveal-item:not(.social-card)").forEach((element) => {
        gsap.from(element, {
          y: 48,
          autoAlpha: 0,
          duration: 0.95,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            toggleActions: "play none none reverse"
          }
        });
      });

      gsap.from(".social-card", {
        y: 36,
        autoAlpha: 0,
        stagger: 0.09,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".social-grid",
          start: "top 82%",
          toggleActions: "play none none reverse"
        }
      });

      gsap.to(".closing-shape", {
        rotation: 20,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: ".closing",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.4
        }
      });

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

      window.addEventListener("load", () => ScrollTrigger.refresh(), { ...listenerOptions, once: true });

      return () => listeners.abort();
    }
  );
}
