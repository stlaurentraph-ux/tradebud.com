// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlotGeometryHistoryPanel } from './plot-geometry-history-panel';
import type { PlotGeometryHistoryEvent } from '@/lib/use-plot-geometry-history';

const hookState = vi.hoisted(() => ({
  events: [] as PlotGeometryHistoryEvent[],
  total: 0,
  page: 1,
  pageSize: 20,
  clampPage: (candidate: number) =>
    Math.min(Math.max(1, Math.trunc(candidate)), Math.max(1, Math.ceil(hookState.total / hookState.pageSize))),
  setPage: vi.fn(),
  sort: 'desc' as 'desc' | 'asc',
  setSort: vi.fn(),
  anomalyProfile: 'balanced' as 'strict' | 'balanced' | 'lenient',
  setAnomalyProfile: vi.fn(),
  signalsOnly: false,
  setSignalsOnly: vi.fn(),
  viewPageMemory: {
    'all|mixed': 1,
    'all|signals': 1,
    'plot_created|mixed': 1,
    'plot_created|signals': 1,
    'plot_geometry_superseded|mixed': 1,
    'plot_geometry_superseded|signals': 1,
  },
  setViewPageMemory: vi.fn(),
  filter: 'all' as 'all' | 'plot_created' | 'plot_geometry_superseded',
  setFilter: vi.fn(),
  anomalies: [] as Array<{ eventId: string; message: string }>,
  anomalySummary: {
    total: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    byType: { largeRevisionJump: 0, frequentSupersession: 0 },
  },
  anomalySummaryScope: 'current_page' as 'current_page' | 'full_filtered_set',
  isLoading: false,
  error: null as string | null,
  legacyViewFallbackCount: 0,
  resetLegacyViewFallbackCount: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@/lib/use-plot-geometry-history', () => ({
  usePlotGeometryHistory: () => hookState,
}));

describe('PlotGeometryHistoryPanel', () => {
  beforeEach(() => {
    hookState.events = [];
    hookState.total = 0;
    hookState.page = 1;
    hookState.pageSize = 20;
    hookState.clampPage = (candidate: number) =>
      Math.min(Math.max(1, Math.trunc(candidate)), Math.max(1, Math.ceil(hookState.total / hookState.pageSize)));
    hookState.setPage = vi.fn();
    hookState.sort = 'desc';
    hookState.setSort = vi.fn();
    hookState.anomalyProfile = 'balanced';
    hookState.setAnomalyProfile = vi.fn();
    hookState.signalsOnly = false;
    hookState.setSignalsOnly = vi.fn();
    hookState.viewPageMemory = {
      'all|mixed': 1,
      'all|signals': 1,
      'plot_created|mixed': 1,
      'plot_created|signals': 1,
      'plot_geometry_superseded|mixed': 1,
      'plot_geometry_superseded|signals': 1,
    };
    hookState.setViewPageMemory = vi.fn();
    hookState.filter = 'all';
    hookState.setFilter = vi.fn();
    hookState.anomalies = [];
    hookState.anomalySummary = {
      total: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      byType: { largeRevisionJump: 0, frequentSupersession: 0 },
    };
    hookState.anomalySummaryScope = 'current_page';
    hookState.isLoading = false;
    hookState.error = null;
    hookState.legacyViewFallbackCount = 0;
    hookState.resetLegacyViewFallbackCount = vi.fn();
    hookState.reload = vi.fn();
  });

  it('renders loading state', () => {
    hookState.isLoading = true;
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('Loading geometry history...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    hookState.error = 'Plot scope violation';
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('Geometry history unavailable')).toBeInTheDocument();
    expect(screen.getByText('Plot scope violation')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('No geometry revisions yet')).toBeInTheDocument();
  });

  it('renders rows when history exists', () => {
    hookState.events = [
      {
        id: 'evt_1',
        timestamp: '2026-04-16T10:45:33.000Z',
        userId: 'user_1',
        deviceId: 'device_1',
        eventType: 'plot_geometry_superseded',
        payload: {
          plotId: 'plot_1',
          details: { reason: 'boundary correction after resurvey' },
        },
      },
    ];

    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('plot_geometry_superseded')).toBeInTheDocument();
    expect(screen.getByText('user_1')).toBeInTheDocument();
    expect(screen.getByText('boundary correction after resurvey')).toBeInTheDocument();
    hookState.total = 1;
    expect(screen.getByText('Showing 1 of 1 events (page 1, sort desc)')).toBeInTheDocument();
  });

  it('filters rows by event type', async () => {
    const user = userEvent.setup();
    hookState.events = [
      {
        id: 'evt_1',
        timestamp: '2026-04-16T10:45:33.000Z',
        userId: 'user_1',
        deviceId: 'device_1',
        eventType: 'plot_geometry_superseded',
        payload: {
          plotId: 'plot_1',
          details: { reason: 'boundary correction after resurvey' },
        },
      },
      {
        id: 'evt_2',
        timestamp: '2026-04-16T09:45:33.000Z',
        userId: 'user_1',
        deviceId: null,
        eventType: 'plot_created',
        payload: {
          plotId: 'plot_1',
          details: {},
        },
      },
    ];
    hookState.total = 2;

    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('Showing 2 of 2 events (page 1, sort desc)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Created' }));
    expect(hookState.setFilter).toHaveBeenCalledWith('plot_created');
    expect(hookState.setViewPageMemory).toHaveBeenCalledWith({
      'all|mixed': 1,
      'all|signals': 1,
      'plot_created|mixed': 1,
      'plot_created|signals': 1,
      'plot_geometry_superseded|mixed': 1,
      'plot_geometry_superseded|signals': 1,
    });
    expect(hookState.setPage).toHaveBeenCalledWith(1);
  });

  it('restores previous page when switching back to a filter', async () => {
    const user = userEvent.setup();
    hookState.page = 4;
    hookState.total = 100;
    hookState.pageSize = 20;
    const { rerender } = render(<PlotGeometryHistoryPanel plotId="plot_1" />);

    await user.click(screen.getByRole('button', { name: 'Created' }));
    expect(hookState.setFilter).toHaveBeenCalledWith('plot_created');
    expect(hookState.setPage).toHaveBeenCalledWith(1);

    hookState.filter = 'plot_created';
    hookState.page = 1;
    hookState.viewPageMemory = {
      'all|mixed': 4,
      'all|signals': 1,
      'plot_created|mixed': 2,
      'plot_created|signals': 1,
      'plot_geometry_superseded|mixed': 1,
      'plot_geometry_superseded|signals': 1,
    };
    rerender(<PlotGeometryHistoryPanel plotId="plot_1" />);

    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(hookState.setFilter).toHaveBeenCalledWith('all');
    expect(hookState.setPage).toHaveBeenLastCalledWith(4);
  });

  it('allows switching to oldest sort', async () => {
    const user = userEvent.setup();
    hookState.page = 3;
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    await user.click(screen.getByRole('button', { name: 'Oldest' }));
    expect(hookState.setSort).toHaveBeenCalledWith('asc');
    expect(hookState.setPage).toHaveBeenCalledWith(1);
  });

  it('allows switching anomaly sensitivity profile', async () => {
    const user = userEvent.setup();
    hookState.page = 4;
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    await user.click(screen.getByRole('button', { name: 'Strict' }));
    expect(hookState.setAnomalyProfile).toHaveBeenCalledWith('strict');
    expect(hookState.setPage).toHaveBeenCalledWith(1);
  });

  it('renders grouped timeline rows and anomaly signals', () => {
    hookState.events = [
      {
        id: 'evt_1',
        timestamp: '2026-04-16T10:45:33.000Z',
        userId: 'user_1',
        deviceId: 'device_1',
        eventType: 'plot_geometry_superseded',
        payload: {
          plotId: 'plot_1',
          details: { reason: 'boundary correction after resurvey' },
        },
      },
    ];
    hookState.total = 1;
    hookState.anomalies = [
      {
        eventId: 'evt_1',
        message: 'Large revision jump: 4.10% area correction variance.',
      },
    ];
    hookState.anomalySummary = {
      total: 1,
      highSeverity: 1,
      mediumSeverity: 0,
      byType: { largeRevisionJump: 1, frequentSupersession: 0 },
    };
    hookState.anomalySummaryScope = 'full_filtered_set';

    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('1 anomaly flag')).toBeInTheDocument();
    expect(screen.getByText('High 1 / Medium 0')).toBeInTheDocument();
    expect(screen.getByText('Jump 1 / Frequent 0')).toBeInTheDocument();
    expect(screen.getByText('Summary scope: full filtered set')).toBeInTheDocument();
    expect(screen.getByText('Large revision jump: 4.10% area correction variance.')).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-04-16T10:45:33.000Z').toLocaleDateString())).toBeInTheDocument();
  });

  it('can toggle signals-only mode to hide non-flagged rows', async () => {
    const user = userEvent.setup();
    hookState.page = 5;
    hookState.total = 200;
    hookState.pageSize = 20;
    hookState.events = [
      {
        id: 'evt_1',
        timestamp: '2026-04-16T10:45:33.000Z',
        userId: 'user_1',
        deviceId: 'device_1',
        eventType: 'plot_geometry_superseded',
        payload: {
          plotId: 'plot_1',
          details: { reason: 'boundary correction after resurvey' },
        },
      },
      {
        id: 'evt_2',
        timestamp: '2026-04-16T08:45:33.000Z',
        userId: 'user_2',
        deviceId: null,
        eventType: 'plot_created',
        payload: {
          plotId: 'plot_1',
          details: {},
        },
      },
    ];
    hookState.total = 200;
    hookState.anomalies = [{ eventId: 'evt_1', message: 'Large revision jump: 4.10% area correction variance.' }];

    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('plot_created')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Signals only' }));
    expect(hookState.setSignalsOnly).toHaveBeenCalledWith(true);
    expect(hookState.setPage).toHaveBeenCalledWith(1);
    expect(hookState.setViewPageMemory).toHaveBeenCalledWith({
      'all|mixed': 5,
      'all|signals': 1,
      'plot_created|mixed': 1,
      'plot_created|signals': 1,
      'plot_geometry_superseded|mixed': 1,
      'plot_geometry_superseded|signals': 1,
    });
  });

  it('restores previous mixed-mode page when leaving signals-only mode', async () => {
    const user = userEvent.setup();
    hookState.page = 3;
    hookState.total = 100;
    hookState.pageSize = 20;
    const { rerender } = render(<PlotGeometryHistoryPanel plotId="plot_1" />);

    await user.click(screen.getByRole('button', { name: 'Signals only' }));
    expect(hookState.setSignalsOnly).toHaveBeenCalledWith(true);
    expect(hookState.setPage).toHaveBeenCalledWith(1);

    hookState.signalsOnly = true;
    hookState.page = 1;
    hookState.viewPageMemory = {
      'all|mixed': 3,
      'all|signals': 1,
      'plot_created|mixed': 1,
      'plot_created|signals': 1,
      'plot_geometry_superseded|mixed': 1,
      'plot_geometry_superseded|signals': 1,
    };
    rerender(<PlotGeometryHistoryPanel plotId="plot_1" />);

    await user.click(screen.getByRole('button', { name: 'Signals only' }));
    expect(hookState.setSignalsOnly).toHaveBeenCalledWith(false);
    expect(hookState.setPage).toHaveBeenLastCalledWith(3);
  });

  it('clamps restored mode page to current max page bounds', async () => {
    const user = userEvent.setup();
    hookState.signalsOnly = true;
    hookState.page = 6;
    hookState.total = 25;
    hookState.pageSize = 20;
    hookState.viewPageMemory = {
      'all|mixed': 9,
      'all|signals': 6,
      'plot_created|mixed': 1,
      'plot_created|signals': 1,
      'plot_geometry_superseded|mixed': 1,
      'plot_geometry_superseded|signals': 1,
    };

    render(<PlotGeometryHistoryPanel plotId="plot_1" />);

    await user.click(screen.getByRole('button', { name: 'Signals only' }));
    expect(hookState.setSignalsOnly).toHaveBeenCalledWith(false);
    expect(hookState.setPage).toHaveBeenLastCalledWith(2);
  });

  it('renders signals-only filtered list when enabled in hook state', () => {
    hookState.signalsOnly = true;
    hookState.events = [
      {
        id: 'evt_1',
        timestamp: '2026-04-16T10:45:33.000Z',
        userId: 'user_1',
        deviceId: 'device_1',
        eventType: 'plot_geometry_superseded',
        payload: {
          plotId: 'plot_1',
          details: { reason: 'boundary correction after resurvey' },
        },
      },
      {
        id: 'evt_2',
        timestamp: '2026-04-16T08:45:33.000Z',
        userId: 'user_2',
        deviceId: null,
        eventType: 'plot_created',
        payload: { plotId: 'plot_1', details: {} },
      },
    ];
    hookState.anomalies = [{ eventId: 'evt_1', message: 'Large revision jump: 4.10% area correction variance.' }];

    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.queryByText('plot_created')).not.toBeInTheDocument();
    expect(screen.getByText('plot_geometry_superseded')).toBeInTheDocument();
  });

  it('matches lightweight visual snapshots for core states', () => {
    const { rerender, container } = render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(container.firstChild).toMatchSnapshot('empty-state');

    hookState.isLoading = true;
    rerender(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(container.firstChild).toMatchSnapshot('loading-state');

    hookState.isLoading = false;
    hookState.error = 'Geometry history unavailable.';
    rerender(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(container.firstChild).toMatchSnapshot('error-state');
  });

  it('shows legacy fallback migration counter when present', () => {
    hookState.legacyViewFallbackCount = 3;
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    expect(screen.getByText('Legacy preset fallback migrations: 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset migration counter' })).toBeInTheDocument();
  });

  it('can reset legacy fallback migration counter', async () => {
    const user = userEvent.setup();
    hookState.legacyViewFallbackCount = 2;
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    await user.click(screen.getByRole('button', { name: 'Reset migration counter' }));
    expect(screen.getByRole('button', { name: 'Confirm reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(hookState.resetLegacyViewFallbackCount).toHaveBeenCalledTimes(1);
  });

  it('can cancel migration counter reset confirmation', async () => {
    const user = userEvent.setup();
    hookState.legacyViewFallbackCount = 2;
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    await user.click(screen.getByRole('button', { name: 'Reset migration counter' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(hookState.resetLegacyViewFallbackCount).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Reset migration counter' })).toBeInTheDocument();
  });

  it('requires typed confirmation for high migration counter resets', async () => {
    const user = userEvent.setup();
    hookState.legacyViewFallbackCount = 12;
    render(<PlotGeometryHistoryPanel plotId="plot_1" />);
    await user.click(screen.getByRole('button', { name: 'Reset migration counter' }));
    expect(screen.getByLabelText('Type RESET to confirm counter reset')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(hookState.resetLegacyViewFallbackCount).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Type RESET to confirm counter reset'), 'RESET');
    await user.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(hookState.resetLegacyViewFallbackCount).toHaveBeenCalledTimes(1);
  });
});
