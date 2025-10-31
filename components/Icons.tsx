import React from 'react';

interface IconProps {
  className?: string;
}

export const ScanIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
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

export const CheckIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ErrorIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const FaceMeshIcon: React.FC<IconProps> = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <g className="face-mesh-group" fill="none" stroke="currentColor" strokeWidth="0.4" strokeLinejoin='round'>
        {/* Main structure polygons */}
        <polygon className="face-mesh-poly" points="50,10 30,30 70,30" />
        <polygon className="face-mesh-poly" points="30,30 15,50 50,50" />
        <polygon className="face-mesh-poly" points="70,30 85,50 50,50" />
        <polygon className="face-mesh-poly" points="15,50 30,80 50,70" />
        <polygon className="face-mesh-poly" points="85,50 70,80 50,70" />
        <polygon className="face-mesh-poly" points="30,80 50,90 50,70" />
        <polygon className="face-mesh-poly" points="70,80 50,90 50,70" />
        
        {/* Eye sockets */}
        <polygon className="face-mesh-poly" points="30,30 50,50 35,45" />
        <polygon className="face-mesh-poly" points="70,30 50,50 65,45" />

        {/* Nose */}
        <polygon className="face-mesh-poly" points="50,50 45,60 55,60" />
        <polygon className="face-mesh-poly" points="50,70 45,60 55,60" />

        {/* Cheekbones */}
        <polygon className="face-mesh-poly" points="15,50 35,45 30,80" />
        <polygon className="face-mesh-poly" points="85,50 65,45 70,80" />
        <polygon className="face-mesh-poly" points="35,45 50,50 50,70" />
        <polygon className="face-mesh-poly" points="65,45 50,50 50,70" />
        <polygon className="face-mesh-poly" points="35,45 50,70 30,80" />
        <polygon className="face-mesh-poly" points="65,45 50,70 70,80" />


        <g fill="currentColor" stroke="none">
          <circle className="face-mesh-dot" cx="50" cy="10" r="1"/>
          <circle className="face-mesh-dot" cx="30" cy="30" r="1"/>
          <circle className="face-mesh-dot" cx="70" cy="30" r="1"/>
          <circle className="face-mesh-dot" cx="15" cy="50" r="1"/>
          <circle className="face-mesh-dot" cx="85" cy="50" r="1"/>
          <circle className="face-mesh-dot" cx="35" cy="45" r="1"/>
          <circle className="face-mesh-dot" cx="65" cy="45" r="1"/>
          <circle className="face-mesh-dot" cx="50" cy="50" r="1"/>
          <circle className="face-mesh-dot" cx="45" cy="60" r="1"/>
          <circle className="face-mesh-dot" cx="55" cy="60" r="1"/>
          <circle className="face-mesh-dot" cx="50" cy="70" r="1"/>
          <circle className="face-mesh-dot" cx="30" cy="80" r="1"/>
          <circle className="face-mesh-dot" cx="70" cy="80" r="1"/>
          <circle className="face-mesh-dot" cx="50" cy="90" r="1"/>
        </g>
      </g>
    </svg>
);