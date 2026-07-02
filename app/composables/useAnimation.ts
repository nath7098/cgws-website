/**
 * useAnimation — shared GSAP animation helpers for CGWS.
 *
 * All methods guard against prefers-reduced-motion before running any animation.
 * Methods are async and designed to be awaited inside onMounted().
 * GSAP and ScrollTrigger are imported dynamically to remain SSR-safe.
 */

export interface AnimationFromVars {
  opacity?: number
  x?: number | string
  y?: number | string
  scale?: number
  duration?: number
  ease?: string
  delay?: number
}

export interface AnimationScrollTriggerConfig {
  trigger?: string | Element
  start?: string
  end?: string
  scrub?: boolean | number
  once?: boolean
}

export function useAnimation() {
  function prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }

  /**
   * Reveal a single element from a given starting state.
   */
  async function revealFrom(
    selector: string,
    from: AnimationFromVars,
    scrollTriggerVars?: AnimationScrollTriggerConfig,
  ): Promise<void> {
    if (prefersReducedMotion()) return
    const { gsap } = await import('gsap')
    if (scrollTriggerVars !== undefined) {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
    }
    gsap.from(selector, {
      ...from,
      ...(scrollTriggerVars !== undefined ? { scrollTrigger: scrollTriggerVars } : {}),
    } as Parameters<typeof gsap.from>[1])
  }

  /**
   * Reveal multiple elements in a staggered sequence from a given starting state.
   */
  async function staggerReveal(
    selector: string,
    from: AnimationFromVars,
    staggerDelay: number,
    scrollTriggerVars?: AnimationScrollTriggerConfig,
  ): Promise<void> {
    if (prefersReducedMotion()) return
    const { gsap } = await import('gsap')
    if (scrollTriggerVars !== undefined) {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
    }
    gsap.from(selector, {
      ...from,
      stagger: staggerDelay,
      ...(scrollTriggerVars !== undefined ? { scrollTrigger: scrollTriggerVars } : {}),
    } as Parameters<typeof gsap.from>[1])
  }

  /**
   * Animate a numeric counter from 0 to a target value, calling onUpdate on each tick.
   */
  async function animateCounter(
    selector: string,
    target: number,
    duration: number,
    onUpdate: (value: number) => void,
    scrollTriggerVars?: AnimationScrollTriggerConfig,
  ): Promise<void> {
    if (prefersReducedMotion()) return
    const { gsap } = await import('gsap')
    if (scrollTriggerVars !== undefined) {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
    }
    const counter = { val: 0 }
    gsap.to(counter, {
      val: target,
      duration,
      ease: 'power2.out',
      ...(scrollTriggerVars !== undefined ? { scrollTrigger: scrollTriggerVars } : {}),
      onUpdate() {
        onUpdate(Math.round(counter.val))
      },
    } as Parameters<typeof gsap.to>[1])
  }

  /**
   * Attach a parallax scrub effect to an element.
   * The element moves yPercent% over the length of the trigger section.
   * Desktop only — call only when window.innerWidth >= 768.
   */
  async function parallaxScrub(
    selector: string,
    yPercent: number,
    triggerSelector: string,
  ): Promise<void> {
    if (prefersReducedMotion()) return
    const { gsap } = await import('gsap')
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    gsap.registerPlugin(ScrollTrigger)
    gsap.to(selector, {
      y: `${yPercent}%`,
      ease: 'none',
      scrollTrigger: {
        trigger: triggerSelector,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    } as Parameters<typeof gsap.to>[1])
  }

  return {
    prefersReducedMotion,
    revealFrom,
    staggerReveal,
    animateCounter,
    parallaxScrub,
  }
}
