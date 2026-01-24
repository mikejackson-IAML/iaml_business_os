'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { FallingPattern } from './falling-pattern';
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
    <FallingPattern
      color="hsl(var(--accent-primary))"
      backgroundColor="hsl(var(--background))"
      duration={150}
      blurIntensity="1em"
      density={1}
      className="fixed inset-0 -z-10"
    />
  );
}
