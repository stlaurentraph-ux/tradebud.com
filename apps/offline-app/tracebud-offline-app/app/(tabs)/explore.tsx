import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { useAppState, Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  loadPhotosForPlot,
  loadPlotCadastralKey,
  loadTitlePhotosForPlot,
  persistPlotPhoto,
  persistPlotTitlePhoto,
  savePlotCadastralKey,
  type PlotPhoto,
  type PlotTitlePhoto,
} from '@/features/state/persistence';
import * as ImagePicker from 'expo-image-picker';
import {
  createDdsPackageForFarmer,
  fetchDdsPackagesForFarmer,
  fetchPlotsForFarmer,
  fetchVouchersForFarmer,
  fetchAuditForFarmer,
  postHarvestToBackend,
  runComplianceCheckForPlot,
  submitDdsPackage,
  syncPlotPhotosToBackend,
  updatePlotMetadataOnBackend,
  fetchDdsPackageTracesJson,
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
  const { plots, farmer, renamePlot } = useAppState();
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
  const [photos, setPhotos] = useState<PlotPhoto[]>([]);
  const [titlePhotos, setTitlePhotos] = useState<PlotTitlePhoto[]>([]);
  const [cadastralKey, setCadastralKey] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editReason, setEditReason] = useState('');
  const [lowDataMap, setLowDataMap] = useState(false);

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

  useEffect(() => {
    if (!selectedPlotId) {
      setPhotos([]);
      setTitlePhotos([]);
      setCadastralKey('');
      return;
    }
    loadPhotosForPlot(selectedPlotId).then(setPhotos);
    loadTitlePhotosForPlot(selectedPlotId).then(setTitlePhotos);
    loadPlotCadastralKey(selectedPlotId).then((key) => {
      setCadastralKey(key ?? '');
    });
  }, [selectedPlotId]);

  useEffect(() => {
    if (selectedPlot) {
      setEditName(selectedPlot.name);
    } else {
      setEditName('');
    }
    setEditReason('');
  }, [selectedPlot?.id]);

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
            <>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={region}
                  mapType={lowDataMap ? 'none' : 'standard'}
                >
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
              <View style={styles.backendSection}>
                <Button
                  title={lowDataMap ? 'Show base map' : 'Low-data map mode'}
                  onPress={() => setLowDataMap((prev) => !prev)}
                />
              </View>
              <View style={styles.backendSection}>
                <ThemedText type="subtitle">Edit plot (local + audit)</ThemedText>
                <ThemedText>New name</ThemedText>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={selectedPlot.name}
                />
                <ThemedText>Reason for edit (required)</ThemedText>
                <TextInput
                  style={styles.input}
                  value={editReason}
                  onChangeText={setEditReason}
                  placeholder="e.g. corrected spelling, merged duplicate, etc."
                />
                <Button
                  title="Save name & log edit"
                  onPress={async () => {
                    if (!selectedPlot || !editName.trim() || !editReason.trim()) {
                      return;
                    }
                    // Update local offline state
                    renamePlot(selectedPlot.id, editName.trim());

                    // Best-effort backend edit with immutable audit log
                    try {
                      const matchingBackend = backendPlots.find(
                        (p) => p.name === selectedPlot.name,
                      );
                      if (matchingBackend) {
                        await updatePlotMetadataOnBackend({
                          plotId: matchingBackend.id,
                          name: editName.trim(),
                          reason: editReason.trim(),
                          deviceId: undefined,
                        });
                        const rows = await fetchPlotsForFarmer(farmer!.id);
                        setBackendPlots(rows ?? []);
                      }
                      setSyncMessage('Plot name updated locally; edit logged when online.');
                    } catch (e) {
                      setSyncMessage(
                        e instanceof Error
                          ? e.message
                          : 'Plot renamed locally. Could not reach backend to log edit.',
                      );
                    }
                  }}
                />
              </View>
              <View style={styles.backendSection}>
                <ThemedText type="subtitle">Ground-truth photos</ThemedText>
                <Button
                  title="Add ground-truth photo"
                  onPress={async () => {
                    if (!selectedPlot) return;

                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                      return;
                    }

                    const result = await ImagePicker.launchCameraAsync({
                      quality: 0.6,
                    });

                    if (result.canceled || !result.assets?.[0]?.uri) {
                      return;
                    }

                    const uri = result.assets[0].uri;
                    const firstPoint = selectedPlot.points[0];
                    const takenAt = Date.now();

                    persistPlotPhoto({
                      plotId: selectedPlot.id,
                      uri,
                      takenAt,
                      latitude: firstPoint?.latitude ?? null,
                      longitude: firstPoint?.longitude ?? null,
                    });

                    const updated = await loadPhotosForPlot(selectedPlot.id);
                    setPhotos(updated);
                  }}
                />
                {photos.length > 0 && (
                  <View style={styles.photoRow}>
                    {photos.slice(0, 4).map((p) => (
                      <Image
                        key={p.id}
                        source={{ uri: p.uri }}
                        style={styles.photoThumb}
                      />
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.backendSection}>
                <ThemedText type="subtitle">Legality / land title</ThemedText>
                <ThemedText>Clave Catastral (local only)</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 012-345-678-9"
                  value={cadastralKey}
                  onChangeText={setCadastralKey}
                  onBlur={() => {
                    if (!selectedPlot) return;
                    const value = cadastralKey.trim();
                    savePlotCadastralKey(selectedPlot.id, value || null);
                  }}
                />
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Add land title photo"
                    onPress={async () => {
                      if (!selectedPlot) return;

                      const { status } =
                        await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== 'granted') {
                        return;
                      }

                      const result = await ImagePicker.launchCameraAsync({
                        quality: 0.6,
                      });

                      if (result.canceled || !result.assets?.[0]?.uri) {
                        return;
                      }

                      const uri = result.assets[0].uri;
                      const takenAt = Date.now();

                      persistPlotTitlePhoto({
                        plotId: selectedPlot.id,
                        uri,
                        takenAt,
                      });

                      const updated = await loadTitlePhotosForPlot(
                        selectedPlot.id,
                      );
                      setTitlePhotos(updated);
                    }}
                  />
                </View>
                {titlePhotos.length > 0 && (
                  <View style={styles.photoRow}>
                    {titlePhotos.slice(0, 4).map((p) => (
                      <Image
                        key={p.id}
                        source={{ uri: p.uri }}
                        style={styles.photoThumb}
                      />
                    ))}
                  </View>
                )}
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Sync legality & photo metadata"
                    onPress={async () => {
                      if (!selectedPlot) return;
                      setSyncMessage(null);
                      try {
                        const baseMeta = {
                          cadastralKey: cadastralKey.trim() || null,
                        };
                        await syncPlotPhotosToBackend({
                          plotId: selectedPlot.id,
                          kind: 'ground_truth',
                          photos: photos.map((p) => ({
                            ...baseMeta,
                            uri: p.uri,
                            takenAt: p.takenAt,
                            latitude: p.latitude ?? null,
                            longitude: p.longitude ?? null,
                          })),
                          note: 'Ground-truth photos sync from device',
                        });
                        await syncPlotPhotosToBackend({
                          plotId: selectedPlot.id,
                          kind: 'land_title',
                          photos: titlePhotos.map((p) => ({
                            ...baseMeta,
                            uri: p.uri,
                            takenAt: p.takenAt,
                          })),
                          note: 'Land title photos sync from device',
                        });
                        setSyncMessage('Legality data synced to backend.');
                      } catch (e) {
                        setSyncMessage(
                          e instanceof Error
                            ? e.message
                            : 'Could not sync legality data.',
                        );
                      }
                    }}
                  />
                  {syncMessage ? (
                    <ThemedText>{syncMessage}</ThemedText>
                  ) : null}
                </View>
              </View>
            </>
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
          {(() => {
            const green = backendPlots.filter((p) => p.status === 'compliant').length;
            const amber = backendPlots.filter(
              (p) => p.status === 'degradation_risk',
            ).length;
            const red = backendPlots.filter(
              (p) => p.status === 'deforestation_detected',
            ).length;
            return (
              <ThemedText>
                Compliance summary – Green: {green}, Amber: {amber}, Red: {red}
              </ThemedText>
            );
          })()}
          {backendPlots.map((p) => (
            <View key={p.id} style={{ marginBottom: 8 }}>
              <View style={styles.syncedRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText>
                    {p.name}: {Number(p.area_ha).toFixed(4)} ha ({p.kind})
                  </ThemedText>
                  <ThemedText>
                    {p.sinaph_overlap ? 'Protected area overlap. ' : ''}
                    {p.indigenous_overlap ? 'Indigenous territory overlap. ' : ''}
                  </ThemedText>
                </View>
                <View style={styles.statusBadgeContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      p.status === 'compliant' && styles.statusGreen,
                      p.status === 'degradation_risk' && styles.statusAmber,
                      p.status === 'deforestation_detected' && styles.statusRed,
                    ]}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.statusBadgeText}>
                      {p.status}
                    </ThemedText>
                  </View>
                </View>
              </View>
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
            <View key={p.id} style={{ marginBottom: 4 }}>
              <ThemedText>
                {p.id.slice(0, 8)}… – {p.status}{' '}
                {p.traces_reference ? `– ${p.traces_reference}` : ''}
              </ThemedText>
            </View>
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
          {farmer && ddsPackages.length > 0 && (
            <Button
              title="Download latest DDS JSON (TRACES-style)"
              onPress={async () => {
                if (!farmer) return;
                const latest =
                  ddsPackages
                    .slice()
                    .sort((a, b) => {
                      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                      return db - da;
                    })[0] ?? ddsPackages[ddsPackages.length - 1];
                try {
                  const json = await fetchDdsPackageTracesJson(latest.id);
                  console.log('DDS TRACES JSON', json);
                  setBackendError(null);
                } catch (e) {
                  setBackendError(
                    e instanceof Error
                      ? e.message
                      : 'Could not load TRACES JSON. Please try again.',
                  );
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
  photoRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  syncedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBadgeContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#000',
  },
  statusGreen: {
    backgroundColor: '#C6F6D5',
  },
  statusAmber: {
    backgroundColor: '#FEEBC8',
  },
  statusRed: {
    backgroundColor: '#FED7D7',
  },
});
