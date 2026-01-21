'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type CodeRainProps = {
  /** Style of characters to display */
  style?: 'matrix' | 'binary' | 'syntax' | 'hex';
  /** Primary color (default: cyan) */
  color?: string;
  /** Character opacity (0-1) */
  opacity?: number;
  /** Animation speed multiplier (default: 1) */
  speed?: number;
  /** Column density - lower = more columns (default: 20) */
  columnGap?: number;
  className?: string;
};

const CHAR_SETS = {
  matrix: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF',
  binary: '01',
  syntax: '{}[]();=><=!==&&||const let var function return if else for while import export default async await',
  hex: '0123456789ABCDEF',
};

export function CodeRain({
  style = 'matrix',
  color = 'hsl(189 100% 50%)',
  opacity = 0.8,
  speed = 1,
  columnGap = 20,
  className,
}: CodeRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get character set
    const chars = style === 'syntax'
      ? CHAR_SETS.syntax.split(' ').flatMap(word => word.split(''))
      : CHAR_SETS[style].split('');

    // Calculate columns
    const fontSize = 14;
    const columns = Math.floor(canvas.width / columnGap);

    // Track drop position for each column
    const drops: number[] = Array(columns).fill(1);

    // Randomize initial positions
    for (let i = 0; i < drops.length; i++) {
      drops[i] = Math.random() * -100;
    }

    // Draw function
    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(12, 17, 23, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text style
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
      ctx.globalAlpha = opacity;

      // Draw characters
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];

        // Calculate position
        const x = i * columnGap;
        const y = drops[i] * fontSize;

        // Draw with slight variation in brightness
        const brightness = Math.random() * 0.5 + 0.5;
        ctx.globalAlpha = opacity * brightness;
        ctx.fillText(char, x, y);

        // Draw a brighter "head" character
        if (Math.random() > 0.98) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = 'white';
          ctx.fillText(char, x, y);
          ctx.fillStyle = color;
        }

        // Reset drop to top randomly or when off screen
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Move drop down
        drops[i] += speed;
      }

      ctx.globalAlpha = 1;
    };

    // Animation loop
    const interval = setInterval(draw, 33); // ~30fps

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [style, color, opacity, speed, columnGap]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0', className)}
      style={{ background: 'hsl(220 45% 7%)' }}
    />
  );
}
