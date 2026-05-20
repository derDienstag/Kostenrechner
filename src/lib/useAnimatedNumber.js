import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animate a numeric value from its previous reading to a new
 * target whenever `target` changes. Eased with cubic ease-out.
 *
 * Used for the headline €/kWp number so users see it count up rather
 * than snap on each slider tick.
 *
 * @param {number} target            New target value.
 * @param {number} [duration=350]    Tween duration in ms.
 * @returns {number}                 Currently-displayed value.
 */
export function useAnimatedNumber(target, duration = 350) {
  const [display, setDisplay] = useState(target);
  const animRef = useRef(null);
  const prevRef = useRef(target);

  useEffect(() => {
    const start = prevRef.current;
    const end = target;
    const t0 = performance.now();
    if (animRef.current) cancelAnimationFrame(animRef.current);

    function step(now) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(start + (end - start) * eased);
      if (p < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        prevRef.current = end;
      }
    }
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [target, duration]);

  return display;
}
