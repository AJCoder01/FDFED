import React from 'react';

export function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)' }) {
  const style = {
    width: width,
    height: height,
    borderRadius: borderRadius,
    backgroundColor: '#E2E8F0',
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
      <div style={style} />
    </>
  );
}
