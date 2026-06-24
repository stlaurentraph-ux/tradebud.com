'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { parseDeliveryIntakeRef } from '@/lib/delivery-intake-qr';
import { LocaleContext } from '@/lib/locale-context';
import { getHarvestReceiveDeliveryCopy } from '@/lib/workflow-terminology-labels';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';
import { cn } from '@/lib/utils';

type VoucherQrScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (intakeRef: string) => void;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

const DUPLICATE_SCAN_MS = 2000;

function getBarcodeDetectorCtor(): (new (options: { formats: string[] }) => BarcodeDetectorLike) | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as Window & { BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector;
  return ctor ?? null;
}

export function VoucherQrScannerDialog({ open, onOpenChange, onDetected }: VoucherQrScannerDialogProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const copy = useCallback(
    (field: Parameters<typeof getHarvestReceiveDeliveryCopy>[0], values?: Record<string, string | number>) =>
      getHarvestReceiveDeliveryCopy(field, t, values),
    [t],
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const lastDetectionRef = useRef<{ ref: string; at: number } | null>(null);
  const bulkModeRef = useRef(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'unsupported' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [flashActive, setFlashActive] = useState(false);

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

  const triggerSuccessFeedback = useCallback(
    (intakeRef: string) => {
      setFlashActive(true);
      window.setTimeout(() => setFlashActive(false), 500);
      toast.success(copy('scan_detected_toast', { ref: intakeRef }));
    },
    [copy],
  );

  useEffect(() => {
    bulkModeRef.current = bulkMode;
  }, [bulkMode]);

  const emitDetection = useCallback(
    (raw: string) => {
      const parsed = parseDeliveryIntakeRef(raw);
      if (!parsed) return false;

      const now = Date.now();
      const last = lastDetectionRef.current;
      if (last && last.ref === parsed.ref && now - last.at < DUPLICATE_SCAN_MS) {
        return false;
      }
      lastDetectionRef.current = { ref: parsed.ref, at: now };

      const isBulk = bulkModeRef.current;
      trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_SCAN_SUCCESS, {
        intakeRef: parsed.ref,
        intakeKind: parsed.kind,
        bulkMode: isBulk,
      });
      triggerSuccessFeedback(parsed.ref);
      onDetected(parsed.ref);
      setScanCount((count) => count + 1);
      if (!isBulk) {
        onOpenChange(false);
      }
      return true;
    },
    [onDetected, onOpenChange, triggerSuccessFeedback],
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      setStatus('idle');
      setErrorMessage(null);
      setScanCount(0);
      setFlashActive(false);
      setBulkMode(false);
      lastDetectionRef.current = null;
      return;
    }

    let cancelled = false;
    setStatus('starting');
    trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_SCAN_STARTED, { bulkMode: bulkModeRef.current });

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
          setErrorMessage(copy('scan_camera_error'));
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [copy, emitDetection, open, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {bulkMode ? copy('scan_bulk_title') : copy('scan_title')}
          </DialogTitle>
          <DialogDescription>
            {bulkMode ? copy('scan_bulk_description') : copy('scan_description')}
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={bulkMode}
            onChange={(event) => setBulkMode(event.target.checked)}
          />
          <span>{copy('scan_bulk_toggle')}</span>
        </label>

        {status === 'unsupported' ? (
          <p className="text-sm text-muted-foreground">{copy('scan_unsupported')}</p>
        ) : status === 'error' ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : (
          <div className="relative overflow-hidden rounded-lg border border-border bg-black">
            <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
            {status === 'scanning' ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="relative h-44 w-44 rounded-lg border-2 border-white/90"
                  style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.42)' }}
                  aria-hidden="true"
                >
                  <span className="absolute -left-px -top-px h-5 w-5 border-l-4 border-t-4 border-white" />
                  <span className="absolute -right-px -top-px h-5 w-5 border-r-4 border-t-4 border-white" />
                  <span className="absolute -bottom-px -left-px h-5 w-5 border-b-4 border-l-4 border-white" />
                  <span className="absolute -bottom-px -right-px h-5 w-5 border-b-4 border-r-4 border-white" />
                </div>
              </div>
            ) : null}
            {status === 'starting' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : null}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 bg-emerald-400/35 transition-opacity duration-300',
                flashActive ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden="true"
            />
          </div>
        )}

        {bulkMode && scanCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy('scan_session_count', { count: scanCount })}
          </p>
        ) : null}

        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          <X className="mr-2 h-4 w-4" />
          {copy('scan_close')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
