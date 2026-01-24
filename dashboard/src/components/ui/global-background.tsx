'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { CodeRain } from './code-rain';
import { AuroraBackground } from './aurora-background';

export function GlobalBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (resolvedTheme === 'light') {
    return (
      <div className="fixed inset-0 -z-10">
        <AuroraBackground showRadialGradient={true}>
          <div />
        </AuroraBackground>
      </div>
    );
  }

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
