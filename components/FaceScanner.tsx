
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScannerStatus } from '../types';
import { CheckIcon, ErrorIcon, FaceMeshIcon, WorldCheckIcon, EkycIcon } from './Icons';
import { SoundEffects } from '../utils/SoundEffects';

const STATUS_MESSAGES: { [key in ScannerStatus]: string } = {
  [ScannerStatus.IDLE]: 'Awaiting Initialization',
  [ScannerStatus.INITIALIZING]: 'Initializing Camera...',
  [ScannerStatus.DETECTING]: 'Searching for Biometric Signature...',
  [ScannerStatus.CAPTURED]: 'Signature Locked. Preparing Scan.',
  [ScannerStatus.SCANNING]: 'Analyzing Biometric Data...',
  [ScannerStatus.SCAN_PASSED]: 'Biometric Signature Confirmed',
  [ScannerStatus.SUCCESS]: 'Access Granted',
  [ScannerStatus.ERROR]: 'Access Denied. System Error.',
  [ScannerStatus.FINALIZING]: 'Finalizing Session...',
  [ScannerStatus.COUNTDOWN]: 'System Resetting...',
  [ScannerStatus.ONBOARDED]: 'Onboarding Complete',
  [ScannerStatus.WELCOME]: '',
};

const SCANNING_TEXTS = [
  'Calibrating Quantum Sensors...',
  'Mapping Facial Topography...',
  'Acquiring Depth Map...',
  ' analyzing_geometry_mesh_v2...',
  'Cross-Referencing Neural Signatures...',
  'Verifying DNA Markers...',
  'Calculating Cranial Ratios...',
  'Accessing Interpol-V Database...',
  'Handshake Protocol Initiated...',
  'Decompressing Biometric Hash...',
  'Decrypting Identity Token...',
  'Matching Facial Nodes...',
  'Compiling Final Report...',
];

const fullFsaText = "Labuan FSA is the statutory body responsible for the development and administration of the Labuan International Business and Financial Centre (Labuan IBFC)";

const playCountdownVoice = (num: number) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Cancel any ongoing speech to keep timing tight
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(num.toString());
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Attempt to select a standard English voice if available, otherwise default
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
};

// Helper component for the scrolling matrix data
const RandomDataStream: React.FC<{ align?: 'left' | 'right' }> = ({ align = 'left' }) => {
  const [text, setText] = useState<string[]>([]);
  
  useEffect(() => {
    let mounted = true;
    const chars = ['0X1', '1F4', 'A09', 'BN2', '77X', '001', '110', 'F3A', '9C2', 'GEO', 'MSH', 'DAT'];
    
    const update = () => {
      if (!mounted) return;
      const rows = 20;
      const newLines = [];
      for(let i=0; i<rows; i++) {
        newLines.push(
            Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join(' ')
        );
      }
      setText(newLines);
    };

    const interval = setInterval(update, 60); // Fast update for dramatic effect
    update();
    return () => { 
        mounted = false; 
        clearInterval(interval);
    };
  }, []);
  
  return (
    <div className={`flex flex-col text-[10px] text-cyan-500/60 leading-[1.2] whitespace-nowrap ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
      {text.map((line, i) => (
        <span key={i} style={{ opacity: Math.random() > 0.5 ? 1 : 0.5 }}>{line}</span>
      ))}
    </div>
  );
};

const FaceScanner: React.FC = () => {
  const [status, setStatus] = useState<ScannerStatus>(ScannerStatus.IDLE);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanningMessage, setScanningMessage] = useState<string>(SCANNING_TEXTS[0]);
  const [detectionBox, setDetectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [showFsaPopup, setShowFsaPopup] = useState(false);
  const [displayedFsaText, setDisplayedFsaText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [matchConfidence, setMatchConfidence] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Audio loop cleanups & Timer refs
  const stopScanLoopRef = useRef<() => void>(() => {});
  const soundTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearSoundTimeouts = useCallback(() => {
      soundTimeouts.current.forEach(clearTimeout);
      soundTimeouts.current = [];
  }, []);

  const handleReset = useCallback(() => {
    clearSoundTimeouts();
    setSnapshot(null);
    setErrorMessage(null);
    setDetectionBox(null);
    setShowFsaPopup(false);
    setMatchConfidence(0);
    setStatus(ScannerStatus.IDLE);
  }, [clearSoundTimeouts]);

  const captureSnapshot = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip horizontally for mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setSnapshot(dataUrl);
        setStatus(ScannerStatus.CAPTURED);
        SoundEffects.playLockOn(); // SOUND EFFECT: Capture
        stopCamera();
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    // === STATUS: INITIALIZING ===
    if (status === ScannerStatus.INITIALIZING) {
      SoundEffects.playPowerUp(); // SOUND EFFECT: Init
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setStatus(ScannerStatus.DETECTING);
            };
          }
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setErrorMessage('Camera access denied. Please enable camera permissions in your browser settings.');
          setStatus(ScannerStatus.ERROR);
        });
    }

    // === STATUS: DETECTING ===
    if (status === ScannerStatus.DETECTING) {
      const detectionActive = { current: true };

      const detectFace = () => {
        if (
          !detectionActive.current ||
          !videoRef.current ||
          videoRef.current.paused ||
          videoRef.current.videoWidth === 0
        ) {
          if (detectionActive.current) setTimeout(detectFace, 500);
          return;
        }

        const video = videoRef.current;

        // MOCK AI DETECTION: Simulate a successful face detection after a delay.
        setTimeout(() => {
          if (!detectionActive.current) return;

          detectionActive.current = false;

          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          const boxWidth = videoWidth * 0.3; // Slightly larger for better framing
          const boxHeight = videoHeight * 0.4;

          setDetectionBox({
            x: (videoWidth - boxWidth) / 2,
            y: (videoHeight - boxHeight) / 2,
            width: boxWidth,
            height: boxHeight,
          });

          // Brief pause to show "Locked" state before capture
          setTimeout(() => captureSnapshot(), 1200); // Extended lock time slightly
        }, 10000); 
      };

      detectFace();
      return () => {
        detectionActive.current = false;
      };
    }

    // === STATUS: CAPTURED ===
    if (status === ScannerStatus.CAPTURED) {
      const timer = setTimeout(() => setStatus(ScannerStatus.SCANNING), 1000);
      return () => clearTimeout(timer);
    }

    // === STATUS: SCANNING ===
    if (status === ScannerStatus.SCANNING) {
      // SOUND EFFECT: Start Loop
      stopScanLoopRef.current = SoundEffects.playScanLoop();
      
      setScanningMessage(SCANNING_TEXTS[0]);
      setMatchConfidence(0);
      let textIndex = 0;
      
      // Change text rapidly
      const textInterval = setInterval(() => {
        textIndex = (textIndex + 1) % SCANNING_TEXTS.length;
        setScanningMessage(SCANNING_TEXTS[textIndex]);
        SoundEffects.playDataTick(); // SOUND EFFECT: Data tick
      }, 600); 

      // Confidence counter
      const confidenceInterval = setInterval(() => {
        setMatchConfidence(prev => {
            if (prev >= 99) return 99;
            return prev + 1;
        });
      }, 80); 

      const timer = setTimeout(() => {
          setMatchConfidence(100);
          setStatus(ScannerStatus.SCAN_PASSED);
      }, 8000); 
      
      return () => {
        stopScanLoopRef.current(); // SOUND EFFECT: Stop Loop
        clearTimeout(timer);
        clearInterval(textInterval);
        clearInterval(confidenceInterval);
      };
    }
    
    // === STATUS: SCAN_PASSED (Orchestrated Sequence) ===
    if (status === ScannerStatus.SCAN_PASSED) {
        SoundEffects.playSuccess(); // SOUND EFFECT: Success

        // Clear any previous sound timeouts just in case
        clearSoundTimeouts();

        // 1. eKYC Tag
        soundTimeouts.current.push(
            setTimeout(() => SoundEffects.playTagAppear(), 1200)
        );

        // 2. World Check Tag
        soundTimeouts.current.push(
            setTimeout(() => SoundEffects.playTagAppear(), 4200)
        );

        // 3. Name Reveal
        soundTimeouts.current.push(
            setTimeout(() => SoundEffects.playDataReveal(), 5500)
        );

        // 4. PEP Tag
        soundTimeouts.current.push(
            setTimeout(() => SoundEffects.playPepAlert(), 8100)
        );

        // 5. Risk High Text
        soundTimeouts.current.push(
            setTimeout(() => SoundEffects.playRiskAlert(), 10600)
        );

        // Timer to show the popup after the risk animation
        const showPopupTimer = setTimeout(() => {
            setShowFsaPopup(true);
        }, 12600); 

        // Timer to hide the popup
        const hidePopupTimer = setTimeout(() => {
            setShowFsaPopup(false);
        }, 23600); 

        // Finalize
        const timer = setTimeout(() => {
            setStatus(ScannerStatus.FINALIZING);
        }, 26000); 
        
        return () => {
            clearSoundTimeouts();
            clearTimeout(showPopupTimer);
            clearTimeout(hidePopupTimer);
            clearTimeout(timer);
        };
    }

    // === STATUS: FINALIZING ===
    if (status === ScannerStatus.FINALIZING) {
      const timer = setTimeout(() => {
        setCountdown(5);
        setStatus(ScannerStatus.COUNTDOWN);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // === STATUS: COUNTDOWN ===
    if (status === ScannerStatus.COUNTDOWN) {
      if (countdown > 0) {
        playCountdownVoice(countdown);
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setStatus(ScannerStatus.ONBOARDED); // Skip APPROVAL_CHECKS, go directly to ONBOARDED
      }
    }
    
    // === STATUS: ONBOARDED ===
    if (status === ScannerStatus.ONBOARDED) {
      SoundEffects.playSuccess(); // Final success sound
      const timer = setTimeout(() => {
          setStatus(ScannerStatus.WELCOME);
      }, 3000); 
      return () => clearTimeout(timer);
    }

    // === STATUS: WELCOME ===
    if (status === ScannerStatus.WELCOME) {
        const audio = new Audio('/sounds/welcome.mp3');
        audio.play().catch(e => console.log("Audio playback failed. Ensure 'sounds/welcome.mp3' exists.", e));
        
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }

    if (status === ScannerStatus.SUCCESS || status === ScannerStatus.ERROR) {
      stopCamera();
    }
  }, [status, stopCamera, captureSnapshot, countdown, handleReset, clearSoundTimeouts]);

  // === FSA Popup Typing Logic ===
  useEffect(() => {
    if (showFsaPopup) {
      setIsTyping(true);
      let index = 0;
      const intervalId = setInterval(() => {
        setDisplayedFsaText(fullFsaText.substring(0, index));
        SoundEffects.playDataTick(); // SOUND EFFECT: Typing
        index++;
        if (index > fullFsaText.length) {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, 15);

      return () => {
        clearInterval(intervalId);
        setIsTyping(false);
        setDisplayedFsaText('');
      };
    }
  }, [showFsaPopup]);


  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleStart = () => {
    SoundEffects.init(); // Initialize Audio Context on user interaction
    handleReset();
    setStatus(ScannerStatus.INITIALIZING);
  };

  const renderContent = () => {
    switch (status) {
      case ScannerStatus.IDLE:
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <p className="mb-6">System ready for biometric verification.</p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-cyan-500 text-slate-900 font-bold uppercase tracking-widest rounded-md hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.7)]"
            >
              Start Scan
            </button>
          </div>
        );

      case ScannerStatus.SUCCESS:
        return (
          <div className="relative w-full aspect-square max-w-md mx-auto">
            {snapshot ? (
              <img src={snapshot} alt="Biometric snapshot" className="w-full h-full object-cover rounded-2xl shadow-[0_0_25px_rgba(74,222,128,0.7)]" />
            ) : (
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                <CheckIcon className="w-24 h-24 text-green-400" />
              </div>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-slate-900/70 backdrop-blur-sm border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-widest rounded-md hover:bg-slate-800/80 transition-all duration-300 shadow-lg"
              >
                New Scan
              </button>
            </div>
          </div>
        );

      case ScannerStatus.ERROR:
        return (
          <div className="flex flex-col items-center justify-center text-center text-red-400">
            <ErrorIcon className="w-24 h-24 mb-4" />
            <h2 className="text-2xl font-bold mb-4">SYSTEM ERROR</h2>
            <p className="mb-6 max-w-sm">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-slate-700 text-cyan-300 font-bold uppercase tracking-widest rounded-md hover:bg-slate-600 transition-all duration-300"
            >
              Retry
            </button>
          </div>
        );

      default:
        return (
          <div className="relative w-full aspect-square max-w-md mx-auto group">
            
            {/* RISK SCORING: HIGH (Moved to Top) */}
            {status === ScannerStatus.SCAN_PASSED && (
              <div className="absolute -top-16 left-0 right-0 z-10 flex justify-center">
                <div className="risk-high-text text-3xl md:text-3xl font-extrabold text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  RISK SCORING: HIGH
                </div>
              </div>
            )}
            
            {/* Main camera/image frame */}
            <div className="relative w-full h-full overflow-hidden rounded-2xl border-4 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.5)] bg-black">
              
              {/* Image Layer - with dynamic filters */}
              {snapshot ? (
                <img 
                  src={snapshot} 
                  alt="Biometric snapshot" 
                  className={`w-full h-full object-cover transition-all duration-500 ${status === ScannerStatus.SCANNING ? 'filter-scanning scale-105' : ''}`} 
                />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              )}
              
              {/* Detection Box Animation (Pre-Capture) */}
              {status === ScannerStatus.DETECTING && (
                <div className="absolute inset-0 bg-black/10">
                  {detectionBox ? (
                    <div
                      className="absolute border-2 border-green-400 transition-all duration-200 animate-pulse"
                      style={{
                        left: `${(detectionBox.x / videoRef.current!.videoWidth) * 100}%`,
                        top: `${(detectionBox.y / videoRef.current!.videoHeight) * 100}%`,
                        width: `${(detectionBox.width / videoRef.current!.videoWidth) * 100}%`,
                        height: `${(detectionBox.height / videoRef.current!.videoHeight) * 100}%`,
                        boxShadow: '0 0 30px rgba(74, 222, 128, 0.5), inset 0 0 10px rgba(74, 222, 128, 0.3)',
                      }}
                    >
                        {/* Targeting Corners */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                        
                        {/* Lock-on Text */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-900/80 text-green-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-green-500/50 shadow-lg">
                            Face Detected!
                        </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Searching reticle */}
                      <div className="w-64 h-64 border border-cyan-500/30 rounded-full animate-ping opacity-20 absolute"></div>
                      <div className="w-48 h-48 border-2 border-dashed border-cyan-400/50 rounded-full animate-spin-slow-right"></div>
                      <div className="absolute text-cyan-400 text-xs tracking-widest uppercase animate-pulse">
                          Searching...
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Captured Moment - Freeze Frame Effect */}
               {status === ScannerStatus.CAPTURED && detectionBox && (
                 <div 
                    className="absolute border-2 border-white bg-white/20 backdrop-blur-[2px]"
                    style={{
                        left: `${(detectionBox.x / videoRef.current!.videoWidth) * 100}%`,
                        top: `${(detectionBox.y / videoRef.current!.videoHeight) * 100}%`,
                        width: `${(detectionBox.width / videoRef.current!.videoWidth) * 100}%`,
                        height: `${(detectionBox.height / videoRef.current!.videoHeight) * 100}%`,
                        boxShadow: '0 0 50px rgba(255, 255, 255, 0.8)',
                      }}
                 >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-white animate-ping"></div>
                    </div>
                 </div>
               )}

              {/* SCANNING OVERLAY - DRAMATIC EFFECT */}
              {status === ScannerStatus.SCANNING && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* 1. Grid Background with movement */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[length:30px_30px] opacity-30"></div>
                  
                  {/* 2. Rotating Reticles */}
                  <div className="absolute inset-0 flex items-center justify-center">
                     {/* Outer Ring */}
                     <div className="w-[90%] aspect-square rounded-full border border-cyan-500/30 border-dashed animate-spin-slow-right shadow-[0_0_30px_rgba(0,255,255,0.1)]"></div>
                     {/* Middle Ring */}
                     <div className="absolute w-[70%] aspect-square rounded-full border-t-2 border-b-2 border-cyan-400/40 animate-spin-slow-left"></div>
                     {/* Target Crosshairs */}
                     <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
                     <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>
                     
                     {/* Match Confidence Display */}
                     <div className="absolute top-[20%] left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
                         <div className="text-[10px] text-cyan-400 uppercase tracking-widest mb-1">Match Probability</div>
                         <div className="text-3xl font-bold text-cyan-200 shadow-cyan-500/50 drop-shadow-md">
                            {matchConfidence}%
                         </div>
                     </div>
                  </div>

                  {/* 3. Face Geometry Scanning Overlay with 3D Movement */}
                  <div className="absolute inset-0 flex items-center justify-center">
                      {/* Primary Face Mesh with new 3D animation */}
                      <FaceMeshIcon className="w-[85%] h-[85%] text-cyan-300 animate-face-3d-scan" />
                      
                      {/* Secondary "Ghost" Mesh for depth/hologram effect - staggered animation */}
                      <FaceMeshIcon 
                          className="absolute w-[88%] h-[88%] text-blue-500 opacity-30 mix-blend-screen animate-face-3d-scan" 
                          style={{ animationDelay: '0.2s', filter: 'blur(2px)' }} 
                       />
                      
                      {/* Scanning Grid on face */}
                      <div className="absolute w-[60%] h-[60%] rounded-full overflow-hidden opacity-30 mix-blend-overlay">
                        <div className="w-full h-full bg-[linear-gradient(0deg,transparent_95%,#0ff_100%)] bg-[length:100%_20px] animate-scan-down"></div>
                      </div>
                  </div>
                  
                  {/* 4. Laser Scan Beams */}
                  <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_30px_rgba(0,255,255,1)] z-20 animate-scan-beam"></div>
                  {/* Vertical beam for grid effect */}
                  <div className="absolute inset-y-0 w-1 bg-cyan-400 shadow-[0_0_30px_rgba(0,255,255,1)] z-20 animate-scan-beam-vertical opacity-60"></div>

                  {/* 5. Side Data Streams */}
                  <div className="absolute top-12 bottom-12 left-2 w-12 hidden md:flex items-center justify-center overflow-hidden border-r border-cyan-500/20 pr-1">
                      <RandomDataStream align="left" />
                  </div>
                  <div className="absolute top-12 bottom-12 right-2 w-12 hidden md:flex items-center justify-center overflow-hidden border-l border-cyan-500/20 pl-1">
                      <RandomDataStream align="right" />
                  </div>

                  {/* 6. Scanner Frame Tech Deco */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg opacity-80"></div>
                  <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg opacity-80"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg opacity-80"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-cyan-500 rounded-br-lg opacity-80"></div>
                  
                  {/* Corner Text Info */}
                  <div className="absolute top-6 left-6 text-[10px] text-cyan-500">
                      <div>SYS: ONLINE</div>
                      <div>ISO: 400</div>
                  </div>
                  <div className="absolute top-6 right-6 text-[10px] text-cyan-500 text-right">
                      <div>BAT: 98%</div>
                      <div>NET: SECURE</div>
                  </div>

                  {/* 7. Bottom Status Bar */}
                  <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                    <div className="bg-black/80 backdrop-blur-md border-x border-cyan-500/50 px-8 py-2 shadow-[0_0_15px_rgba(0,255,255,0.2)] skew-x-12 transform">
                        <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-cyan-300 flicker-text min-w-[220px] text-center -skew-x-12">
                        {scanningMessage}
                        </p>
                    </div>
                  </div>
                </div>
              )}

              {status === ScannerStatus.SCAN_PASSED && detectionBox && (
                <div className="absolute inset-0 flex items-end justify-center pb-8">
                  <div className="bg-black/70 backdrop-blur-sm py-3 px-6 rounded-md border border-green-500/50 shadow-[0_0_20px_rgba(74,222,128,0.7)] animate-pulse">
                    <p className="text-xl font-bold text-green-300 tracking-widest uppercase">
                      Scan Pass
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Floating tags - OUTSIDE frame */}
            {status === ScannerStatus.SCAN_PASSED && detectionBox && (
              <>
                {/* 🟢 eKYC Tag */}
                <div className="absolute top-[35%] -translate-y-1/2 left-full flex items-center pointer-events-none animate-ekyc-tag z-50 pl-1">
                    <div className="connecting-line border-t-2 border-green-500 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                    <div className="ml-3 relative flex flex-col items-center">
                        <EkycIcon className="tag-icon w-16 h-16 mb-2 text-green-400 filter drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                        <div className="tag-box px-4 py-1.5 flex items-center justify-center border border-green-500 text-green-400 font-bold rounded-md text-lg bg-black/80 backdrop-blur-md shadow-[0_0_15px_rgba(74,222,128,0.5)] whitespace-nowrap">
                           <span>eKYC</span>
                        </div>
                    </div>
                </div>

                {/* 🔵 World Check Tag */}
                <div className="absolute top-[65%] -translate-y-1/2 right-full flex flex-row-reverse items-center pointer-events-none animate-world-check-tag z-50 pr-1">
                  <div className="connecting-line border-t-2 border-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                  <div className="mr-3 relative flex flex-col items-center">
                    <WorldCheckIcon className="tag-icon w-16 h-16 mb-2 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    <div className="tag-box px-4 py-1.5 flex items-center justify-center border border-cyan-500 text-cyan-400 font-bold rounded-md text-lg bg-black/80 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.5)] whitespace-nowrap">
                      <span>World Check</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
    }
  };

  const renderMainContent = () => {
    if (
      status === ScannerStatus.FINALIZING ||
      status === ScannerStatus.COUNTDOWN ||
      status === ScannerStatus.ONBOARDED ||
      status === ScannerStatus.WELCOME
    ) {
        return (
            <div className="w-full p-4 bg-slate-800/20 border border-cyan-500/20 rounded-lg backdrop-blur-md">
                <div className="w-full aspect-square flex items-center justify-center">
                    {status === ScannerStatus.FINALIZING && (
                        <div className="flex flex-col items-center justify-center text-center animate-pulse">
                            <p className="text-2xl text-cyan-300">Finalizing Session...</p>
                            <p className="text-lg text-cyan-500">Please wait.</p>
                        </div>
                    )}
                    {status === ScannerStatus.COUNTDOWN && (
                        <div className="flex flex-col items-center justify-center text-center">
                            <p className="text-2xl text-cyan-300 mb-4">System Processing</p>
                            <div className="text-9xl font-bold text-cyan-400 animate-pulse" style={{textShadow: '0 0 15px rgba(0,255,255,0.7)'}}>
                                {countdown}
                            </div>
                        </div>
                    )}

                      {status === ScannerStatus.ONBOARDED && (
                          <div className="flex flex-col items-center justify-center text-center animate-onboard-glow">
                              <div className="mb-8 p-6 rounded-full border-4 border-green-400 bg-green-500/10 shadow-[0_0_50px_rgba(74,222,128,0.4)]">
                                  <CheckIcon className="w-24 h-24 text-green-400" strokeWidth={3} />
                              </div>
                              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-widest uppercase">
                                  APPROVED
                              </h2>
                              <p className="mt-6 text-cyan-300 text-sm md:text-base tracking-[0.4em] uppercase">
                                  Access Privileges Granted
                              </p>
                          </div>
                      )}

                      {status === ScannerStatus.WELCOME && (
                          <div className="flex flex-col items-center justify-center text-center">
                              <div className="welcome-text-container">
                                  <p className="text-2xl md:text-3xl font-semibold text-slate-300 mb-4">WELCOME TO</p>
                                  <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 leading-tight">
                                      LABUAN INTERNATIONAL COMPLIANCE CONFERENCE
                                      <br/>
                                      2025
                                  </h2>
                              </div>
                              <div className="mt-14 animate-proceed-button-welcome">
                                  <button
                                      onClick={handleReset}
                                      className="px-10 py-4 bg-cyan-500 text-slate-900 font-bold uppercase tracking-widest rounded-lg hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_18px_rgba(0,255,255,0.4)] hover:shadow-[0_0_28px_rgba(0,255,255,0.7)] text-xl"
                                  >
                                      Proceed
                                  </button>
                              </div>
                          </div>
                      )}
                      
                </div>
                <div className="h-12 flex items-center justify-center text-center px-4 py-2 mt-4 border-t border-cyan-500/20">
                    <p className="text-lg font-medium tracking-wider uppercase">{STATUS_MESSAGES[status]}</p>
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        );
    }
  
    return (
      <div className="w-full p-4 bg-slate-800/20 border border-cyan-500/20 rounded-lg backdrop-blur-md">
        <div className="w-full aspect-square flex items-center justify-center">{renderContent()}</div>
        
        {status === ScannerStatus.SCAN_PASSED && (
          <div className="text-center mt-3 flex flex-col items-center">
              {/* PEP DETECTED TAG (Moved to Bottom) */}
              <div className="mb-2 animate-pep-tag">
                <div className="px-4 py-2 border border-yellow-500 text-yellow-400 font-bold rounded-md text-xl bg-black/70 backdrop-blur-md whitespace-nowrap shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                  <span>PEP-DETECTED</span>
                </div>
              </div>

              <div className="animate-name-position">
                <p className="text-2xl font-bold text-slate-100">Name: AFFENDI RASHDI</p>
                <p className="text-2xl font-bold text-slate-100">Position: DIRECTOR GENERAL LABUAN FSA</p>
              </div>
            </div>
        )}
  
        <div className="h-12 flex items-center justify-center text-center px-4 py-2 mt-4 border-t border-cyan-500/20">
          <p className="text-lg font-medium tracking-wider uppercase">{STATUS_MESSAGES[status]}</p>
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    );
  }

  return (
    <>
      {renderMainContent()}
      {showFsaPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-800 border border-cyan-500/50 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.5)] max-w-3xl w-full mx-4 p-8 flex flex-col md:flex-row items-center gap-8 animate-slide-in-up">
            <img
              src="https://i.ibb.co/fYtzyJw6/logo.png"
              alt="Labuan FSA Logo"
              className="w-32 h-32 md:w-48 md:h-48 object-contain flex-shrink-0"
            />
            <div className="flex flex-col w-full">
                <h3 className="text-yellow-400 font-bold text-xl md:text-2xl mb-2 uppercase tracking-wider text-center md:text-left shadow-yellow-500/50 drop-shadow-sm">
                  Enhanced Due Diligence
                </h3>
                <p className="text-slate-300 text-base md:text-lg text-center md:text-left min-h-32 md:min-h-0">
                  {displayedFsaText}
                  {isTyping && <span className="typing-cursor"></span>}
                </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FaceScanner;
