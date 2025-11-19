import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const ScanIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ErrorIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const FaceMeshIcon: React.FC<IconProps> = ({ className, ...props }) => {
  // Dynamic nodes for the face mesh
  const nodes = [
    { x: 50, y: 5 },   // 0: Top
    { x: 25, y: 20 },  // 1: Forehead L
    { x: 75, y: 20 },  // 2: Forehead R
    { x: 10, y: 40 },  // 3: Temple L
    { x: 90, y: 40 },  // 4: Temple R
    { x: 35, y: 40 },  // 5: Eye L Top
    { x: 65, y: 40 },  // 6: Eye R Top
    { x: 35, y: 48 },  // 7: Eye L Bot
    { x: 65, y: 48 },  // 8: Eye R Bot
    { x: 50, y: 35 },  // 9: Nose Bridge Top
    { x: 50, y: 55 },  // 10: Nose Tip
    { x: 20, y: 60 },  // 11: Cheek L
    { x: 80, y: 60 },  // 12: Cheek R
    { x: 35, y: 75 },  // 13: Jaw L
    { x: 65, y: 75 },  // 14: Jaw R
    { x: 50, y: 90 },  // 15: Chin
  ];

  // Connectivity map
  const connections = [
    [0, 1], [0, 2], [1, 2], // Top
    [1, 3], [2, 4], // Temples
    [1, 5], [2, 6], // Forehead to eyes
    [9, 5], [9, 6], [9, 1], [9, 2], // Nose bridge connections
    [3, 11], [4, 12], // Outer face
    [5, 7], [6, 8], // Eyes vertical
    [3, 5], [4, 6], // Temple to eye
    [11, 7], [12, 8], // Cheek to eye bottom
    [10, 7], [10, 8], // Nose tip to eyes
    [10, 11], [10, 12], // Nose to cheeks
    [10, 13], [10, 14], // Nose to jaw
    [11, 13], [12, 14], // Cheek to jaw
    [13, 15], [14, 15], // Jaw to chin
    [10, 15] // Nose to chin line
  ];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <defs>
        <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g className="face-mesh-group" filter="url(#glow-filter)">
        {connections.map((pair, i) => {
            const p1 = nodes[pair[0]];
            const p2 = nodes[pair[1]];
            return (
                <line 
                    key={`l-${i}`}
                    x1={p1.x} y1={p1.y}
                    x2={p2.x} y2={p2.y}
                    className="face-mesh-line"
                    style={{ 
                        animationDelay: `${i * 0.04}s` 
                    } as React.CSSProperties}
                />
            );
        })}
        {nodes.map((node, i) => (
            <g key={`n-${i}`} className="face-mesh-node-group" style={{ animationDelay: `${i * 0.04 + 0.1}s` }}>
                <circle 
                    cx={node.x} cy={node.y} r="1.5"
                    className="face-mesh-node"
                />
                {/* Add pulsing markers to specific nodes for effect */}
                {[0, 9, 10, 15, 3, 4].includes(i) && (
                    <circle 
                        cx={node.x} cy={node.y} r="3"
                        className="face-mesh-node-pulse"
                    />
                )}
            </g>
        ))}
      </g>
    </svg>
  );
};

export const AmlPassedIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
    {...props}
  >
    <path
      className="aml-icon-shield"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"
    />
    <path
      className="aml-icon-checkmark"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.5l2 2 4-4"
    />
  </svg>
);

export const WorldCheckIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
    {...props}
  >
    <path
      className="world-check-icon-globe"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9 9 0 100-18 9 9 0 000 18z M3.6 9h16.8 M3.6 15h16.8 M11.25 3c1.13 4.2 1.13 13.8 0 18 M12.75 3c-1.13 4.2-1.13 13.8 0 18"
    />
    <path
      className="world-check-icon-checkmark"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4"
    />
  </svg>
);

export const EkycIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        className="ekyc-icon-card"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 3.75h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18V6A2.25 2.25 0 014.5 3.75z"
      />
      <path
        className="ekyc-icon-checkmark"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.5l2 2 4-4"
      />
      <path
        className="ekyc-icon-card"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.25 8.75a2 2 0 114 0 2 2 0 01-4 0zM6.25 15.75h8"
      />
    </svg>
);