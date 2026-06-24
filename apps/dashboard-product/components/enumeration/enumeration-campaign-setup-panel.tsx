'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlotSatelliteMap } from '@/components/plots/plot-satellite-map';
import { saveCampaignMappingRegion } from '@/lib/enumeration-campaign-client';
import {
  mappingRegionToFormState,
  parseMappingRegionForm,
  type EnumerationMappingRegion,
  type MappingRegionFormState,
} from '@/lib/enumeration-campaign-types';
import { mappingRegionCenter, mappingRegionToOverlayPolygon } from '@/lib/enumeration-map-region';
import { DASHBOARD_EVENTS, trackDashboardEvent } from '@/lib/observability/analytics';

type EnumerationCampaignSetupPanelProps = {
  campaignId: string;
  initialRegion: EnumerationMappingRegion | null;
  onSaved: (region: EnumerationMappingRegion) => void;
};

export function EnumerationCampaignSetupPanel({
  campaignId,
  initialRegion,
  onSaved,
}: EnumerationCampaignSetupPanelProps) {
  const [form, setForm] = useState<MappingRegionFormState>(() => mappingRegionToFormState(initialRegion));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(mappingRegionToFormState(initialRegion));
  }, [initialRegion]);

  const previewRegion = useMemo(() => {
    try {
      return parseMappingRegionForm(form);
    } catch {
      return null;
    }
  }, [form]);

  const handleSave = async () => {
    setError(null);
    let region: EnumerationMappingRegion;
    try {
      region = parseMappingRegionForm(form);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Invalid mapping region.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveCampaignMappingRegion(campaignId, region);
      trackDashboardEvent(DASHBOARD_EVENTS.ENUMERATION_MAPPING_REGION_SAVED, {
        campaign_id: campaignId,
      });
      onSaved(result.mappingRegion);
    } catch (nextError) {
      trackDashboardEvent(DASHBOARD_EVENTS.ENUMERATION_MAPPING_REGION_SAVE_FAILURE, {
        campaign_id: campaignId,
        reason: nextError instanceof Error ? nextError.message : 'unknown',
      });
      setError(nextError instanceof Error ? nextError.message : 'Failed to save mapping region.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapping region</CardTitle>
        <CardDescription>
          Set the district bounding box field agents confirm before downloading offline satellite tiles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="mapping-region-label">Region label</Label>
              <Input
                id="mapping-region-label"
                value={form.label}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                placeholder="Copán, Honduras"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mapping-region-west">West</Label>
                <Input
                  id="mapping-region-west"
                  inputMode="decimal"
                  value={form.west}
                  onChange={(event) => setForm((current) => ({ ...current, west: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapping-region-east">East</Label>
                <Input
                  id="mapping-region-east"
                  inputMode="decimal"
                  value={form.east}
                  onChange={(event) => setForm((current) => ({ ...current, east: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapping-region-south">South</Label>
                <Input
                  id="mapping-region-south"
                  inputMode="decimal"
                  value={form.south}
                  onChange={(event) => setForm((current) => ({ ...current, south: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapping-region-north">North</Label>
                <Input
                  id="mapping-region-north"
                  inputMode="decimal"
                  value={form.north}
                  onChange={(event) => setForm((current) => ({ ...current, north: event.target.value }))}
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? 'Saving…' : 'Save mapping region'}
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border">
            {previewRegion ? (
              <PlotSatelliteMap
                coordinates={[mappingRegionCenter(previewRegion)]}
                kind="point"
                overlayPolygons={[mappingRegionToOverlayPolygon(previewRegion)]}
                interactive
                className="h-[280px] w-full"
                ariaLabel={`Preview of ${previewRegion.label}`}
                attribution="Esri World Imagery"
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center px-4 text-sm text-muted-foreground">
                Enter valid coordinates to preview the district bbox.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
