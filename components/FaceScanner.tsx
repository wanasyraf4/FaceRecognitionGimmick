import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScannerStatus } from '../types';
import { CheckIcon, ErrorIcon, FaceMeshIcon, AmlPassedIcon, WorldCheckIcon, EkycIcon } from './Icons';

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
  [ScannerStatus.WELCOME]: 'Welcome Aboard',
};

const SCANNING_TEXTS = [
  'Calibrating Quantum Sensors...',
  'Analyzing Retinal Patterns...',
  'Cross-Referencing Neural Signatures...',
  'Verifying DNA Markers...',
  'Decompressing Biometric Hash...',
];

const fullFsaText = "Labuan Financial Services Authority (Labuan FSA) was established on 15 February 1996 under the Labuan Financial Services Authority Act 1996, governed by the Ministry of Finance (MOF), Malaysia. Labuan FSA is the statutory body responsible for the development and administration of the Labuan International Business and Financial Centre (Labuan IBFC).";

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleReset = useCallback(() => {
    setSnapshot(null);
    setErrorMessage(null);
    setDetectionBox(null);
    setShowFsaPopup(false);
    setStatus(ScannerStatus.IDLE);
  }, []);

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
        stopCamera();
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (status === ScannerStatus.INITIALIZING) {
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
        // This removes the dependency on the Gemini API for a more stable demo.
        setTimeout(() => {
          if (!detectionActive.current) return;

          detectionActive.current = false;

          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          const boxWidth = videoWidth * 0.25;
          const boxHeight = videoHeight * 0.25;

          setDetectionBox({
            x: (videoWidth - boxWidth) / 2,
            y: (videoHeight - boxHeight) / 2,
            width: boxWidth,
            height: boxHeight,
          });

          setTimeout(() => captureSnapshot(), 1000);
        }, 2500); // Simulate a 2.5-second detection period.
      };

      detectFace();
      return () => {
        detectionActive.current = false;
      };
    }

    if (status === ScannerStatus.CAPTURED) {
      const timer = setTimeout(() => setStatus(ScannerStatus.SCANNING), 1000);
      return () => clearTimeout(timer);
    }

    if (status === ScannerStatus.SCANNING) {
      setScanningMessage(SCANNING_TEXTS[0]);
      let textIndex = 0;
      const textInterval = setInterval(() => {
        textIndex = (textIndex + 1) % SCANNING_TEXTS.length;
        setScanningMessage(SCANNING_TEXTS[textIndex]);
      }, 800);
      const timer = setTimeout(() => setStatus(ScannerStatus.SCAN_PASSED), 4000);
      return () => {
        clearTimeout(timer);
        clearInterval(textInterval);
      };
    }
    
    if (status === ScannerStatus.SCAN_PASSED) {
        // Timer to show the popup after the risk animation
        const showPopupTimer = setTimeout(() => {
            setShowFsaPopup(true);
        }, 15600); // 13.6s (animation delay) + 2s (animation duration)

        // Timer to hide the popup after 11 seconds
        const hidePopupTimer = setTimeout(() => {
            setShowFsaPopup(false);
        }, 15600 + 11000); // Show for 11 seconds

        const timer = setTimeout(() => {
            setStatus(ScannerStatus.FINALIZING);
        }, 29000); // Auto-proceed after popup sequence
        
        return () => {
            clearTimeout(showPopupTimer);
            clearTimeout(hidePopupTimer);
            clearTimeout(timer);
        };
    }

    if (status === ScannerStatus.FINALIZING) {
      const timer = setTimeout(() => {
        setCountdown(5);
        setStatus(ScannerStatus.COUNTDOWN);
      }, 4000);
      return () => clearTimeout(timer);
    }

    if (status === ScannerStatus.COUNTDOWN) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setStatus(ScannerStatus.ONBOARDED);
      }
    }
    
    if (status === ScannerStatus.ONBOARDED) {
      const timer = setTimeout(() => {
          setStatus(ScannerStatus.WELCOME);
      }, 3000); // 3 seconds for "Onboarded!!!"
      return () => clearTimeout(timer);
    }

    if (status === ScannerStatus.WELCOME) {
        // Stays on this screen until "Proceed" is clicked.
        return;
    }

    if (status === ScannerStatus.SUCCESS || status === ScannerStatus.ERROR) {
      stopCamera();
    }
  }, [status, stopCamera, captureSnapshot, countdown, handleReset]);

  useEffect(() => {
    if (showFsaPopup) {
      setIsTyping(true);
      let index = 0;
      const intervalId = setInterval(() => {
        setDisplayedFsaText(fullFsaText.substring(0, index));
        index++;
        if (index > fullFsaText.length) {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, 15); // Typing speed in ms

      return () => {
        clearInterval(intervalId);
        setIsTyping(false);
        setDisplayedFsaText('');
      };
    }
  }, [showFsaPopup]);


  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleStart = () => {
    setSnapshot(null);
    setErrorMessage(null);
    setDetectionBox(null);
    setShowFsaPopup(false);
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
          <div className="relative w-full aspect-square max-w-md mx-auto">
            {/* PEP DETECTED TAG */}
            {status === ScannerStatus.SCAN_PASSED && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10 animate-pep-tag">
                <div className="px-4 py-2 border border-yellow-500 text-yellow-400 font-bold rounded-md text-xl bg-black/70 backdrop-blur-md whitespace-nowrap">
                  <span>[PEP-DETECTED]</span>
                </div>
              </div>
            )}
            
            {/* Main camera/image frame with overflow hidden */}
            <div className="relative w-full h-full overflow-hidden rounded-2xl border-4 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.5)] bg-black">
              {snapshot ? (
                <img src={snapshot} alt="Biometric snapshot" className="w-full h-full object-cover" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              )}
              
              {/* Risk High Overlay */}
              {status === ScannerStatus.SCAN_PASSED && (
                <div className="risk-high-overlay">
                  RISK SCORING: HIGH
                </div>
              )}

              {status === ScannerStatus.DETECTING && (
                <div className="absolute inset-0 bg-black/30">
                  {detectionBox ? (
                    <div
                      className="absolute border-2 border-cyan-400 rounded-lg transition-all duration-100"
                      style={{
                        left: `${(detectionBox.x / videoRef.current!.videoWidth) * 100}%`,
                        top: `${(detectionBox.y / videoRef.current!.videoHeight) * 100}%`,
                        width: `${(detectionBox.width / videoRef.current!.videoWidth) * 100}%`,
                        height: `${(detectionBox.height / videoRef.current!.videoHeight) * 100}%`,
                        boxShadow: '0 0 15px rgba(0, 255, 255, 0.7)',
                      }}
                    ></div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                      <div className="w-48 h-64 border-2 border-dashed border-cyan-400 rounded-lg"></div>
                    </div>
                  )}
                </div>
              )}

              {status === ScannerStatus.SCANNING && (
                <div className="absolute inset-0">
                  <div className="scan-grid absolute inset-0"></div>
                  <div className="corner-bracket top-left"></div>
                  <div className="corner-bracket top-right"></div>
                  <div className="corner-bracket bottom-left"></div>
                  <div className="corner-bracket bottom-right"></div>
                  <FaceMeshIcon className="absolute inset-0 w-full h-full opacity-80" />
                  <div className="scanner-bar"></div>
                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="font-mono text-sm uppercase tracking-widest text-cyan-300 flicker-text">
                      {scanningMessage}
                    </p>
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
                {/* 🟣 AML Passed Tag (Right) */}
                <div className="absolute top-1/4 -translate-y-1/2 left-full flex items-center pointer-events-none animate-aml-tag">
                  <div className="connecting-line border-t-2 border-pink-500"></div>
                  <div className="ml-3 relative flex flex-col items-center">
                    <AmlPassedIcon className="tag-icon w-16 h-16 mb-2 text-pink-400" />
                    <div className="tag-box px-3 py-1 flex items-center justify-center border border-pink-500 text-pink-400 font-bold rounded-md text-xl bg-black/70 backdrop-blur-md shadow-[0_0_12px_rgba(236,72,153,0.7)]">
                      <span>AML&nbsp;Passed</span>
                    </div>
                  </div>
                </div>
                
                {/* 🟢 eKYC Tag (Right) */}
                <div className="absolute top-3/5 -translate-y-1/2 left-full flex items-center pointer-events-none animate-ekyc-tag">
                    <div className="connecting-line border-t-2 border-green-500"></div>
                    <div className="ml-2 relative flex flex-col items-center">
                        <EkycIcon className="tag-icon w-16 h-16 mb-2 text-green-400" />
                        <div className="tag-box px-3 py-1 flex items-center justify-center border border-green-500 text-green-400 font-bold rounded-md text-xl bg-black/70 backdrop-blur-md shadow-[0_0_12px_rgba(74,222,128,0.7)]">
                           <span>eKYC</span>
                        </div>
                    </div>
                </div>


                {/* 🔵 World Check Tag (Left) */}
                <div className="absolute top-3/4 -translate-y-1/2 right-full flex flex-row-reverse items-center pointer-events-none animate-world-check-tag">
                  <div className="connecting-line border-t-2 border-cyan-500"></div>
                  <div className="mr-3 relative flex flex-col items-center">
                    <WorldCheckIcon className="tag-icon w-16 h-16 mb-2 text-cyan-400" />
                    <div className="tag-box px-3 py-1 flex items-center justify-center border border-cyan-500 text-cyan-400 font-bold rounded-md text-xl bg-black/70 backdrop-blur-md shadow-[0_0_12px_rgba(34,211,238,0.7)]">
                      <span>World&nbsp;Check</span>
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
                      <div className="text-center">
                          <h2 className="text-7xl md:text-8xl font-bold text-cyan-300 animate-onboard-glow">ONBOARDED!</h2>
                      </div>
                    )}
                    {status === ScannerStatus.WELCOME && (
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="welcome-text-container">
                                <p className="text-xl md:text-2xl font-semibold text-slate-300 mb-4">WELCOME TO</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-cyan-300 leading-tight">
                                    INTERNATIONAL CONFERENCE 
                                    <br/>
                                    ON 
                                    <br/>
                                    FINANCIAL CRIME 
                                    <br/>
                                    AND 
                                    <br/>
                                    COUNTER TERRORISM FINANCING 
                                    <br/>
                                    2025
                                </h2>
                            </div>
                            <div className="mt-12 animate-proceed-button-welcome">
                                <button
                                    onClick={handleReset}
                                    className="px-8 py-3 bg-cyan-500 text-slate-900 font-bold uppercase tracking-widest rounded-md hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.7)]"
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
          <div className="text-center mt-3">
              <div className="risk-high-text">
                RISK SCORING: HIGH
              </div>
              <div className="animate-name-position">
                <p className="text-2xl font-bold text-slate-100">Name: AFFENDI RASHDI</p>
                <p className="text-2xl text-cyan-400">Position: DIRECTOR GENERAL LABUAN FSA</p>
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
            <p className="text-slate-300 text-base md:text-lg text-center md:text-left min-h-40 md:min-h-0">
              {displayedFsaText}
              {isTyping && <span className="typing-cursor"></span>}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FaceScanner;