'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface BulkReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staleCount: number;
  defaultStaleMinutes: number;
  defaultLimit: number;
  isLoading?: boolean;
  onConfirm: (staleMinutes: number, limit: number) => void;
}

export function BulkReleaseModal({
  open,
  onOpenChange,
  staleCount,
  defaultStaleMinutes,
  defaultLimit,
  isLoading = false,
  onConfirm,
}: BulkReleaseModalProps) {
  const [staleMinutes, setStaleMinutes] = useState(defaultStaleMinutes);
  const [limit, setLimit] = useState(defaultLimit);

  const handleConfirm = () => {
    onConfirm(staleMinutes, limit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Release Stale Claims</DialogTitle>
              <DialogDescription className="mt-2">
                This will release runs that have been claimed for longer than the specified
                threshold. Currently {staleCount} stale claim{staleCount !== 1 ? 's' : ''} detected.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staleMinutes">Stale Threshold (minutes)</Label>
            <Input
              id="staleMinutes"
              type="number"
              min={1}
              max={1440}
              value={staleMinutes}
              onChange={(e) => setStaleMinutes(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Claims older than this will be released
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Maximum to Release</Label>
            <Input
              id="limit"
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Limit the number of claims released in one operation
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading || staleMinutes < 1 || limit < 1}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Release Stale Claims
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
