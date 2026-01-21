'use client';

import { CodeRain } from './code-rain';

export function GlobalBackground() {
  return (
    <CodeRain
      style="matrix"
      color="hsl(189 100% 55%)"
      opacity={0.7}
      speed={0.8}
      columnGap={18}
      className="fixed inset-0 -z-10"
    />
  );
}
