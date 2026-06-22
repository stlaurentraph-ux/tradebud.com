import { describe, expect, it } from 'vitest';
import {
  buildMergedHarvestPlots,
  findHarvestPlotOption,
  resolveHarvestPlotPickerId,
  resolveLocalPlotForHarvestSubmit,
  resolveLocalPlotIdForRoute,
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

  it('treats plot as synced when only a persisted server link exists', () => {
    const merged = buildMergedHarvestPlots({
      backendPlots: [{ id: 'server-9', name: 'Renamed plot', area_ha: 2, kind: 'polygon' }],
      localPlots: [
        {
          id: 'local-renamed',
          farmerId: 'farmer-old',
          name: 'Renamed plot',
          areaHectares: 2,
          kind: 'polygon',
        },
      ],
      farmerId: 'farmer-old',
      plotServerLinks: { 'local-renamed': 'server-9' },
    });
    expect(merged.find((p) => p.id === 'server-9')?.localOnly).toBe(false);
    expect(merged.some((p) => p.id === 'local-renamed')).toBe(false);
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

  it('resolves local plot from server picker id via persisted link when API list is empty', () => {
    const localPlots = [
      {
        id: 'local-renamed',
        farmerId: 'farmer-old',
        name: 'Plot 2',
        areaHectares: 2,
        kind: 'polygon' as const,
      },
    ];
    const plotServerLinks = { 'local-renamed': 'server-9' };

    const resolved = resolveLocalPlotForHarvestSubmit({
      selectedPlotId: 'server-9',
      localPlots,
      backendPlots: [],
      plotServerLinks,
    });

    expect(resolved?.id).toBe('local-renamed');
  });

  it('resolves local plot from server picker id when server name is display label not client id', () => {
    const localPlots = [
      {
        id: 'local-renamed',
        farmerId: 'farmer-old',
        name: 'Plot 2',
        areaHectares: 2,
        kind: 'polygon' as const,
      },
    ];
    const backendPlots = [{ id: 'server-9', name: 'Plot 2', area_ha: 2, kind: 'polygon' }];

    const resolved = resolveLocalPlotForHarvestSubmit({
      selectedPlotId: 'server-9',
      localPlots,
      backendPlots,
      plotServerLinks: { 'local-renamed': 'server-9' },
    });

    expect(resolved?.id).toBe('local-renamed');
  });

  it('resolves local plot from server id via client_plot_id after farmer rekey', () => {
    const localPlots = [
      {
        id: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168',
        farmerId: 'farmer-old',
        name: 'Plot 1',
        areaHectares: 0.35,
        kind: 'polygon' as const,
      },
    ];
    const backendPlots = [
      {
        id: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
        client_plot_id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168',
        name: 'Plot 1',
        area_ha: 0.35,
        kind: 'polygon',
      },
    ];

    expect(
      resolveLocalPlotForHarvestSubmit({
        selectedPlotId: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
        localPlots,
        backendPlots,
        plotServerLinks: {},
      })?.id,
    ).toBe('dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168');

    expect(
      resolveLocalPlotIdForRoute({
        routePlotId: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
        localPlots,
        backendPlots,
        plotServerLinks: {},
      }),
    ).toBe('dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168');
  });
});
