import React, { useEffect, useState, useRef, useContext } from 'react';
import { LanguageContext } from '../App';

// The Html5Qrcode will be available globally from the script in index.html
declare var Html5Qrcode: any;

interface ScannerProps {
  onSingleScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const Scanner: React.FC<ScannerProps> = ({ onSingleScanSuccess, onClose }) => {
  const { t } = useContext(LanguageContext);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success'>('scanning');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const isThrottled = useRef(false);

  useEffect(() => {
    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
        if (isThrottled.current) {
            return;
        }

        isThrottled.current = true;
        onSingleScanSuccess(decodedText);
        setScanStatus('success');

        setTimeout(() => {
            setScanStatus('scanning');
            isThrottled.current = false;
        }, 2000);
    };

    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    const startScanner = async () => {
        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length) {
                scannerRef.current = new Html5Qrcode("reader");
                await scannerRef.current.start(
                    { facingMode: "environment" },
                    config,
                    qrCodeSuccessCallback,
                    (errorMessage: string) => { /* Optional: handle scan error */ }
                );
            } else {
                setCameraError(t('noCamerasFound'));
            }
        } catch (err: any) {
            console.error("Camera initialization error:", err);
            let errorMessage = t('failedToStartCamera');
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                errorMessage = t('cameraPermissionDenied');
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                errorMessage = t('noCamerasFound');
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                errorMessage = t('cameraInUse');
            } else {
                errorMessage = `${t('cameraErrorPrefix')} ${err.message || err}`;
            }
            setCameraError(errorMessage);
        }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err: any) => {
          console.error("Failed to stop scanner cleanly", err);
        });
      }
    };
  }, [onSingleScanSuccess, t]);
  
  const boxClassName = `relative w-[300px] h-[200px] before:absolute before:border-4 before:w-8 before:h-8 before:left-[-6px] before:top-[-6px] before:border-r-0 before:border-b-0 after:absolute after:border-4 after:w-8 after:h-8 after:right-[-6px] after:top-[-6px] after:border-l-0 after:border-b-0 transition-all duration-300 ${scanStatus === 'success' ? 'border-green-500' : 'border-white'}`;
  const cornerBottomLeft = `absolute border-4 w-8 h-8 left-[-6px] bottom-[-6px] border-r-0 border-t-0 transition-all duration-300 ${scanStatus === 'success' ? 'border-green-500' : 'border-white'}`;
  const cornerBottomRight = `absolute border-4 w-8 h-8 right-[-6px] bottom-[-6px] border-l-0 border-t-0 transition-all duration-300 ${scanStatus === 'success' ? 'border-green-500' : 'border-white'}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
        <h2 className="text-white text-2xl font-bold mb-4">{t('scanBarcodeQr')}</h2>
        <div id="reader-container" className="relative w-[90vw] max-w-[500px] aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
          {cameraError ? (
              <div className="text-center text-red-400 p-4">
                  <p className="font-bold text-lg">{t('cameraError')}</p>
                  <p>{cameraError}</p>
              </div>
          ) : (
              <>
                  <div id="reader" className="w-full h-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={boxClassName}>
                          <div className={cornerBottomLeft}></div>
                          <div className={cornerBottomRight}></div>
                          {scanStatus === 'scanning' && 
                            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-scan"></div>
                          }
                      </div>
                  </div>
                  {scanStatus === 'success' && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-50 flex flex-col items-center justify-center text-white pointer-events-none">
                          <CheckIcon className="w-24 h-24"/>
                          <p className="text-2xl font-bold mt-4">{t('productAdded')}</p>
                      </div>
                  )}
              </>
          )}
        </div>
         <p className="text-slate-300 mt-4 text-center">{t('alignQrBarcode')}</p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-black"
        >
          {t('done')}
        </button>
      </div>
      <style>{`
        #reader video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        #reader__dashboard_section_csr, #reader__dashboard_section_swaplink, #reader__dashboard_section_fs { display: none !important; }
        @keyframes scan {
            0% { transform: translateY(-10px); }
            100% { transform: translateY(190px); }
        }
        .animate-scan {
            animation: scan 2.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Scanner;