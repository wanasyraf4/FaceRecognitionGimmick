import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScannerStatus } from '../types';
import { CheckIcon, ErrorIcon, FaceMeshIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';

const STATUS_MESSAGES: { [key in ScannerStatus]: string } = {
  [ScannerStatus.IDLE]: 'Awaiting Initialization',
  [ScannerStatus.INITIALIZING]: 'Initializing Camera...',
  [ScannerStatus.DETECTING]: 'Searching for Biometric Signature...',
  [ScannerStatus.CAPTURED]: 'Signature Locked. Preparing Scan.',
  [ScannerStatus.SCANNING]: 'Analyzing Biometric Data...',
  [ScannerStatus.SCAN_PASSED]: 'Biometric Signature Confirmed',
  [ScannerStatus.SUCCESS]: 'Access Granted',
  [ScannerStatus.ERROR]: 'Access Denied. System Error.',
};

const SCANNING_TEXTS = [
  'Calibrating Quantum Sensors...',
  'Analyzing Retinal Patterns...',
  'Cross-Referencing Neural Signatures...',
  'Verifying DNA Markers...',
  'Decompressing Biometric Hash...',
];

const FaceScanner: React.FC = () => {
  const [status, setStatus] = useState<ScannerStatus>(ScannerStatus.IDLE);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanningMessage, setScanningMessage] = useState<string>(SCANNING_TEXTS[0]);
  const [detectionBox, setDetectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
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

      const detectFace = async () => {
        if (
          !detectionActive.current ||
          !videoRef.current ||
          !canvasRef.current ||
          videoRef.current.paused ||
          videoRef.current.videoWidth === 0
        ) {
          if (detectionActive.current) setTimeout(detectFace, 500);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) {
          setErrorMessage('Failed to get canvas context for analysis.');
          setStatus(ScannerStatus.ERROR);
          return;
        }

        // Capture mirrored frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];

        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const imagePart = {
            inlineData: { mimeType: 'image/jpeg', data: base64Data },
          };
          const textPart = {
            text: "Is there a FRONT FACING human face clearly visible in this image? Respond with only 'YES' or 'NO'.",
          };

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
          });

          const resultText = response.text.trim().toUpperCase();

          if (resultText === 'YES') {
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
          } else {
            setDetectionBox(null);
            if (detectionActive.current) setTimeout(detectFace, 1500);
          }
        } catch (err) {
          console.error('Gemini API error:', err);
          if (detectionActive.current) {
            setErrorMessage('Biometric analysis service failed. Please try again.');
            setStatus(ScannerStatus.ERROR);
          }
          detectionActive.current = false;
        }
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

    if (status === ScannerStatus.SUCCESS || status === ScannerStatus.ERROR) {
      stopCamera();
    }
  }, [status, stopCamera, captureSnapshot]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleStart = () => {
    setSnapshot(null);
    setErrorMessage(null);
    setDetectionBox(null);
    setStatus(ScannerStatus.INITIALIZING);
  };

  const handleReset = () => {
    setSnapshot(null);
    setErrorMessage(null);
    setDetectionBox(null);
    setStatus(ScannerStatus.IDLE);
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
          <div className="relative w-full aspect-square max-w-md mx-auto overflow-hidden rounded-2xl border-4 border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.5)] bg-black">
            {snapshot ? (
              <img src={snapshot} alt="Biometric snapshot" className="w-full h-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
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
              <div className="absolute inset-0 overflow-visible">
                {/* Main Scan Pass banner */}
                <div className="absolute inset-0 flex items-end justify-center pb-8">
                  <div className="bg-black/70 backdrop-blur-sm py-3 px-6 rounded-md border border-green-500/50 shadow-[0_0_20px_rgba(74,222,128,0.7)] animate-pulse">
                    <p className="text-xl font-bold text-green-300 tracking-widest uppercase">
                      Scan Pass
                    </p>
                  </div>
                </div>

                              {/* 🟣 AML Passed floating tag - OUTSIDE frame */}
                <div className="absolute top-1/2 translate-y-[-50%] right-[-7rem] flex items-center pointer-events-none overflow-visible animate-fade-in">
                  {/* Connecting line */}
                  <div className="w-10 border-t-2 border-pink-500"></div>
                
                  {/* Tag box */}
                  <div className="ml-2 px-3 py-1 border border-pink-500 text-pink-400 font-bold rounded-md text-sm bg-black/70 backdrop-blur-md shadow-[0_0_12px_rgba(236,72,153,0.7)]">
                    AML&nbsp;Passed
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-full p-4 bg-slate-800/20 border border-cyan-500/20 rounded-lg backdrop-blur-md">
      <div className="w-full aspect-square flex items-center justify-center">{renderContent()}</div>
      
      {status === ScannerStatus.SCAN_PASSED && (
        <div className="flex justify-center mt-4">
            <button
                onClick={() => setStatus(ScannerStatus.SUCCESS)}
                className="px-8 py-3 bg-green-500 text-slate-900 font-bold uppercase tracking-widest rounded-md hover:bg-green-400 transition-all duration-300 shadow-[0_0_15px_rgba(74,222,128,0.6)] hover:shadow-[0_0_25px_rgba(74,222,128,0.9)]"
            >
                Proceed
            </button>
        </div>
      )}

      <div className="h-12 flex items-center justify-center text-center px-4 py-2 mt-4 border-t border-cyan-500/20">
        <p className="text-lg font-medium tracking-wider uppercase">{STATUS_MESSAGES[status]}</p>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default FaceScanner;