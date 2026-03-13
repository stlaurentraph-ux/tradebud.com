import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, Pressable, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { useAppState, Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  createDdsPackageForFarmer,
  fetchDdsPackagesForFarmer,
  fetchPlotsForFarmer,
  fetchVouchersForFarmer,
  fetchAuditForFarmer,
  postHarvestToBackend,
  runComplianceCheckForPlot,
  submitDdsPackage,
} from '@/features/api/postPlot';

function computeRegionFromPlot(plot: Plot): Region | undefined {
  if (plot.points.length === 0) {
    return undefined;
  }

  const avgLat =
    plot.points.reduce((sum, p) => sum + p.latitude, 0) / plot.points.length;
  const avgLon =
    plot.points.reduce((sum, p) => sum + p.longitude, 0) / plot.points.length;

  return {
    latitude: avgLat,
    longitude: avgLon,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  };
}

export default function PlotsScreen() {
  const { plots, farmer } = useAppState();
  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [complianceBusyId, setComplianceBusyId] = useState<string | null>(null);
  const [kgInput, setKgInput] = useState('');
  const [harvestMessage, setHarvestMessage] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [ddsPackages, setDdsPackages] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | undefined>(undefined);
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>(
    plots[0]?.id,
  );
  const [submittingPackage, setSubmittingPackage] = useState(false);
  const { t } = useLanguage();

  const selectedPlot = useMemo(
    () => plots.find((p) => p.id === selectedPlotId),
    [plots, selectedPlotId],
  );

  useEffect(() => {
    if (!farmer) {
      setBackendPlots([]);
      setVouchers([]);
      setDdsPackages([]);
      setAuditEvents([]);
      setBackendError(null);
      return;
    }

    setLoadingBackend(true);
    setBackendError(null);
    Promise.all([
      fetchPlotsForFarmer(farmer.id),
      fetchVouchersForFarmer(farmer.id),
      fetchDdsPackagesForFarmer(farmer.id),
      fetchAuditForFarmer(farmer.id),
    ])
      .then(([rows, voucherRows, pkgRows, auditRows]) => {
        setBackendPlots(rows ?? []);
        setVouchers(voucherRows ?? []);
        setDdsPackages(pkgRows ?? []);
        setAuditEvents(auditRows ?? []);
      })
      .catch((err) => {
        setBackendError(
          err instanceof Error
            ? err.message
            : 'Could not reach backend. Working offline from local data.',
        );
        setBackendPlots([]);
        setVouchers([]);
        setDdsPackages([]);
        setAuditEvents([]);
      })
      .finally(() => setLoadingBackend(false));
  }, [farmer?.id]);

  const region = selectedPlot ? computeRegionFromPlot(selectedPlot) : undefined;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t('my_plots')}</ThemedText>
      {farmer ? (
        <ThemedText>
          {farmer.name ? `${farmer.name} – ` : ''}
          {farmer.id}
        </ThemedText>
      ) : (
        <ThemedText>{t('no_farmer')}</ThemedText>
      )}

      <Collapsible title="How this works">
        <ThemedText>
          1. On the Home tab, walk the plot perimeter with GPS and save the plot with a
          farmer declaration.
        </ThemedText>
        <ThemedText>
          2. Saved plots are stored offline on this device and also synced to the backend
          whenever the network is available.
        </ThemedText>
        <ThemedText>
          3. In &quot;Synced plots (backend)&quot; below you can run compliance checks,
          record harvests to create vouchers, and bundle vouchers into DDS packages for
          exporters.
        </ThemedText>
      </Collapsible>

      {backendError && (
        <ThemedView style={styles.errorBanner}>
          <ThemedText type="defaultSemiBold">{t('backend_issue_title')}</ThemedText>
          <ThemedText>{backendError}</ThemedText>
        </ThemedView>
      )}

      {plots.length === 0 ? (
        <ThemedText style={styles.emptyText}>
          No plots saved yet. Go to the Home tab and walk a perimeter to save a plot.
        </ThemedText>
      ) : (
        <>
          <View style={styles.list}>
            {plots.map((plot) => (
              <Pressable
                key={plot.id}
                onPress={() => setSelectedPlotId(plot.id)}
                style={[
                  styles.plotRow,
                  selectedPlotId === plot.id && styles.plotRowSelected,
                ]}>
                <ThemedText type="defaultSemiBold">{plot.name}</ThemedText>
                <ThemedText>
                  {plot.areaSquareMeters.toFixed(1)} m² (~
                  {plot.areaHectares.toFixed(4)} ha) – {plot.kind}
                </ThemedText>
                {plot.declaredAreaHectares != null &&
                  plot.discrepancyPercent != null && (
                    <ThemedText>
                      Declared: {plot.declaredAreaHectares.toFixed(4)} ha (
                      {plot.discrepancyPercent.toFixed(1)}% diff)
                    </ThemedText>
                  )}
              </Pressable>
            ))}
          </View>

          {selectedPlot && region && (
            <View style={styles.mapContainer}>
              <MapView style={styles.map} initialRegion={region}>
                {selectedPlot.kind === 'polygon' && selectedPlot.points.length > 2 && (
                  <Polyline
                    coordinates={[
                      ...selectedPlot.points,
                      selectedPlot.points[0],
                    ]}
                    strokeColor="#007AFF"
                    strokeWidth={3}
                  />
                )}
                <Marker
                  coordinate={selectedPlot.points[0]}
                  title={selectedPlot.name}
                />
              </MapView>
            </View>
          )}
        </>
      )}

      {farmer && backendPlots.length > 0 && (
        <View style={styles.harvestSection}>
          <ThemedText type="subtitle">{t('record_harvest_title')}</ThemedText>
          <ThemedText>{t('kg_delivered')}</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500"
            keyboardType="numeric"
            value={kgInput}
            onChangeText={setKgInput}
          />
          <Button
            title="Record harvest"
            onPress={async () => {
              if (!kgInput.trim()) return;
              const kg = Number(kgInput.trim().replace(',', '.'));
              if (!selectedPlotId || Number.isNaN(kg) || kg <= 0) {
                return;
              }
              setHarvestMessage(null);
              try {
                await postHarvestToBackend({
                  farmerId: farmer.id,
                  plotId: selectedPlotId,
                  kg,
                });
                setHarvestMessage('Harvest recorded and voucher created.');
                setKgInput('');
              } catch (e) {
                setHarvestMessage(String(e));
              }
            }}
          />
          {harvestMessage ? (
            <ThemedText>{harvestMessage}</ThemedText>
          ) : null}
        </View>
      )}

      {loadingBackend ? (
        <View style={styles.backendSection}>
          <ActivityIndicator />
          <ThemedText>Loading synced plots from backend…</ThemedText>
        </View>
      ) : backendPlots.length > 0 ? (
        <View style={styles.backendSection}>
          <ThemedText type="subtitle">{t('synced_plots')}</ThemedText>
          {backendPlots.map((p) => (
            <View key={p.id} style={{ marginBottom: 8 }}>
              <ThemedText>
                {p.name}: {Number(p.area_ha).toFixed(4)} ha ({p.kind}) – {p.status}
                {p.sinaph_overlap ? ' – Protected area overlap' : ''}
                {p.indigenous_overlap ? ' – Indigenous territory overlap' : ''}
              </ThemedText>
              <Button
                title={
                  complianceBusyId === p.id
                    ? 'Running compliance check…'
                    : 'Run compliance check'
                }
                disabled={!!complianceBusyId}
                onPress={async () => {
                  if (!farmer) return;
                  setComplianceBusyId(p.id);
                  try {
                    await runComplianceCheckForPlot(p.id);
                    const rows = await fetchPlotsForFarmer(farmer.id);
                    setBackendPlots(rows ?? []);
                    setBackendError(null);
                  } catch (e) {
                    setBackendError(
                      e instanceof Error
                        ? e.message
                        : 'Compliance check failed. Please try again later.',
                    );
                  } finally {
                    setComplianceBusyId(null);
                  }
                }}
              />
            </View>
          ))}
        </View>
      ) : null}

      {vouchers.length > 0 && (
        <View style={styles.backendSection}>
          <ThemedText type="subtitle">{t('vouchers_title')}</ThemedText>
          {vouchers.map((v) => (
            <Pressable key={v.id} onPress={() => setSelectedVoucherId(v.id)}>
              <ThemedText>
                {v.id.slice(0, 8)}… – {v.status} –{' '}
                {new Date(v.created_at).toLocaleDateString()}
              </ThemedText>
            </Pressable>
          ))}
          {selectedVoucherId && (
            <View style={{ marginTop: 8, alignItems: 'center' }}>
              <ThemedText>Voucher QR</ThemedText>
              {(() => {
                const v = vouchers.find((vv) => vv.id === selectedVoucherId);
                if (!v?.qr_code_ref) return null;
                return (
                  <QRCode value={String(v.qr_code_ref)} size={140} />
                );
              })()}
            </View>
          )}
        </View>
      )}

      {auditEvents.length > 0 && (
        <View style={styles.backendSection}>
          <ThemedText type="subtitle">{t('recent_activity')}</ThemedText>
          {auditEvents.slice(0, 10).map((e) => (
            <ThemedText key={e.id}>
              {new Date(e.timestamp).toLocaleString()} – {e.event_type}
            </ThemedText>
          ))}
        </View>
      )}

      {ddsPackages.length > 0 && (
        <View style={styles.backendSection}>
          <ThemedText type="subtitle">{t('dds_title')}</ThemedText>
          {ddsPackages.map((p) => (
            <ThemedText key={p.id}>
              {p.id.slice(0, 8)}… – {p.status}{' '}
              {p.traces_reference ? `– ${p.traces_reference}` : ''}
            </ThemedText>
          ))}
          {farmer && vouchers.length > 0 && (
            <Button
              title="Create DDS package from active vouchers"
              onPress={async () => {
                const activeIds = vouchers
                  .filter((v) => v.status === 'active')
                  .map((v) => v.id);
                if (activeIds.length === 0) {
                  return;
                }
                try {
                  await createDdsPackageForFarmer({
                    farmerId: farmer.id,
                    voucherIds: activeIds,
                    label: `Package ${new Date().toISOString().slice(0, 10)}`,
                  });
                  const pkgs = await fetchDdsPackagesForFarmer(farmer.id);
                  setDdsPackages(pkgs ?? []);
                  setBackendError(null);
                } catch (e) {
                  setBackendError(
                    e instanceof Error
                      ? e.message
                      : 'Could not create DDS package. Please try again.',
                  );
                }
              }}
            />
          )}
          {farmer && (
            <Button
              title={submittingPackage ? 'Submitting latest package…' : 'Submit latest package'}
              disabled={submittingPackage}
              onPress={async () => {
                if (!farmer) return;
                const unsent = ddsPackages.filter(
                  (p) => p.status !== 'submitted',
                );
                if (unsent.length === 0) {
                  return;
                }
                // Pick the latest by created_at if available, otherwise last in the array
                const latest =
                  unsent
                    .slice()
                    .sort((a, b) => {
                      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                      return db - da;
                    })[0] ?? unsent[unsent.length - 1];

                setSubmittingPackage(true);
                try {
                  await submitDdsPackage(latest.id);
                  const pkgs = await fetchDdsPackagesForFarmer(farmer.id);
                  setDdsPackages(pkgs ?? []);
                  setBackendError(null);
                } catch (e) {
                  setBackendError(
                    e instanceof Error
                      ? e.message
                      : 'Could not submit package. Please try again.',
                  );
                } finally {
                  setSubmittingPackage(false);
                }
              }}
            />
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  emptyText: {
    marginTop: 12,
  },
  backendSection: {
    marginTop: 16,
    gap: 4,
  },
  errorBanner: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FFB3B3',
    gap: 2,
  },
  harvestSection: {
    marginTop: 16,
    gap: 8,
  },
  list: {
    marginTop: 8,
    gap: 8,
  },
  plotRow: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  plotRowSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F0FF',
  },
  mapContainer: {
    marginTop: 12,
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
