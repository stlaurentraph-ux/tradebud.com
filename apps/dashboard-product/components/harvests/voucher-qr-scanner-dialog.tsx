'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { parseDeliveryIntakeRef } from '@/lib/delivery-intake-qr';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';

type VoucherQrScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (intakeRef: string) => void;
  bulkMode?: boolean;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

function getBarcodeDetectorCtor(): (new (options: { formats: string[] }) => BarcodeDetectorLike) | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as Window & { BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector;
  return ctor ?? null;
}

export function VoucherQrScannerDialog({
  open,
  onOpenChange,
  onDetected,
  bulkMode = false,
}: VoucherQrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'unsupported' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const emitDetection = useCallback(
    (raw: string) => {
      const parsed = parseDeliveryIntakeRef(raw);
      if (!parsed) return false;
      trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_SCAN_SUCCESS, {
        intakeRef: parsed.ref,
        intakeKind: parsed.kind,
        bulkMode,
      });
      onDetected(parsed.ref);
      setScanCount((count) => count + 1);
      if (!bulkMode) {
        onOpenChange(false);
      }
      return true;
    },
    [bulkMode, onDetected, onOpenChange],
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      setStatus('idle');
      setErrorMessage(null);
      setScanCount(0);
      return;
    }

    let cancelled = false;
    setStatus('starting');
    trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_SCAN_STARTED, { bulkMode });

    const startZxing = async (video: HTMLVideoElement) => {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
        if (!result?.getText()) return;
        emitDetection(result.getText());
      });
      zxingControlsRef.current = controls;
      setStatus('scanning');
    };

    const startNative = async (video: HTMLVideoElement) => {
      const BarcodeDetectorCtor = getBarcodeDetectorCtor();
      if (!BarcodeDetectorCtor) {
        await startZxing(video);
        return;
      }
      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      detectorRef.current = detector;
      setStatus('scanning');

      const tick = async () => {
        if (cancelled || !videoRef.current || !detectorRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          const hit = codes.find((code) => parseDeliveryIntakeRef(code.rawValue ?? ''));
          if (hit?.rawValue) {
            emitDetection(hit.rawValue);
          }
        } catch {
          // ignore frame errors
        }
        rafRef.current = requestAnimationFrame(() => void tick());
      };
      rafRef.current = requestAnimationFrame(() => void tick());
    };

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        await startNative(video);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage('Camera access failed. Paste the code manually instead.');
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [bulkMode, emitDetection, open, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {bulkMode ? 'Bulk scan delivery QR' : 'Scan delivery QR'}
          </DialogTitle>
          <DialogDescription>
            {bulkMode
              ? 'Keep scanning codes from the same truck visit. The camera stays open until you close it.'
              : 'Point the camera at the receipt QR or a shared delivery link.'}
          </DialogDescription>
        </DialogHeader>

        {status === 'unsupported' ? (
          <p className="text-sm text-muted-foreground">
            Camera scanning is not supported in this browser. Paste the voucher code instead.
          </p>
        ) : status === 'error' ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : (
          <div className="relative overflow-hidden rounded-lg border border-border bg-black">
            <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
            {status === 'starting' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : null}
          </div>
        )}

        {bulkMode && scanCount > 0 ? (
          <p className="text-sm text-muted-foreground">{scanCount} code(s) scanned this session</p>
        ) : null}

        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
