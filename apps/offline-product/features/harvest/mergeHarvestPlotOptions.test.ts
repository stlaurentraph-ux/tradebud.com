import { describe, expect, it } from 'vitest';
import {
  buildMergedHarvestPlots,
  findHarvestPlotOption,
  resolveHarvestPlotPickerId,
  resolveLocalPlotsForFarmer,
} from './mergeHarvestPlotOptions';

describe('mergeHarvestPlotOptions', () => {
  const localPlots = [
    {
      id: 'local-a',
      farmerId: 'farmer-old',
      name: 'Hill plot',
      areaHectares: 2,
      kind: 'polygon' as const,
    },
    {
      id: 'local-b',
      farmerId: 'farmer-old',
      name: 'Valley plot',
      areaHectares: 1.5,
      kind: 'polygon' as const,
    },
  ];

  it('falls back to all device plots when farmer id does not match', () => {
    expect(resolveLocalPlotsForFarmer(localPlots, 'farmer-new')).toHaveLength(2);
    expect(buildMergedHarvestPlots({ backendPlots: [], localPlots, farmerId: 'farmer-new' })).toHaveLength(
      2,
    );
  });

  it('dedupes local rows already represented on the server', () => {
    const merged = buildMergedHarvestPlots({
      farmerId: 'farmer-old',
      localPlots,
      backendPlots: [
        { id: 'server-1', name: 'local-a', area_ha: 2, kind: 'polygon' },
      ],
    });
    expect(merged).toHaveLength(2);
    expect(merged.find((p) => p.id === 'server-1')?.name).toBe('Hill plot');
    expect(merged.find((p) => p.id === 'local-b')?.localOnly).toBe(true);
  });

  it('resolves harvest picker id from local plot when server-linked', () => {
    const backendPlots = [{ id: 'server-1', name: 'local-a', area_ha: 2, kind: 'polygon' }];
    expect(
      resolveHarvestPlotPickerId(
        { id: 'local-a', areaHectares: 2, kind: 'polygon' },
        backendPlots,
      ),
    ).toBe('server-1');
  });

  it('finds merged harvest row by local plot id after auth rekey', () => {
    const backendPlots = [{ id: 'server-1', name: 'local-a', area_ha: 2, kind: 'polygon' }];
    const merged = buildMergedHarvestPlots({ backendPlots, localPlots, farmerId: 'farmer-old' });
    const found = findHarvestPlotOption({
      plotId: 'local-a',
      mergedPlots: merged,
      localPlots,
      backendPlots,
    });
    expect(found?.id).toBe('server-1');
  });

  it('uses GPS area for mapped polygons and declared area for point plots', () => {
    const merged = buildMergedHarvestPlots({
      backendPlots: [],
      farmerId: 'farmer-old',
      localPlots: [
        {
          id: 'poly-1',
          farmerId: 'farmer-old',
          name: 'Walked',
          areaHectares: 2.1,
          declaredAreaHectares: 3,
          kind: 'polygon',
        },
        {
          id: 'point-1',
          farmerId: 'farmer-old',
          name: 'Pin only',
          areaHectares: 0,
          declaredAreaHectares: 3,
          kind: 'point',
        },
      ],
    });
    expect(merged.find((p) => p.id === 'poly-1')?.area_ha).toBe(2.1);
    expect(merged.find((p) => p.id === 'point-1')?.area_ha).toBe(3);
  });
});
