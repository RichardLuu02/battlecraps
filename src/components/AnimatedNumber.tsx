import { animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/** Counts smoothly from the previous value to the new one. */
export function AnimatedNumber({ value, prefix = '', duration = 0.7 }: { value: number; prefix?: string; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const controls = animate(from.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return (
    <>
      {prefix}
      {display.toLocaleString()}
    </>
  );
}
