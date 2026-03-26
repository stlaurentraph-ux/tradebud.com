import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge, ComplianceBadge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Collapsible } from '@/components/ui/collapsible';
import { useAppState, Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Brand, Spacing, Radius, Shadows } from '@/constants/theme';
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
  if (plot.points.length === 0) return undefined;

  const avgLat = plot.points.reduce((sum, p) => sum + p.latitude, 0) / plot.points.length;
  const avgLon = plot.points.reduce((sum, p) => sum + p.longitude, 0) / plot.points.length;

  return {
    latitude: avgLat,
    longitude: avgLon,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  };
}

export default function PlotsScreen() {
  const { plots, farmer, renamePlot } = useAppState();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
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
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>(plots[0]?.id);
  const [submittingPackage, setSubmittingPackage] = useState(false);
  const [photos, setPhotos] = useState<PlotPhoto[]>([]);
  const [titlePhotos, setTitlePhotos] = useState<PlotTitlePhoto[]>([]);
  const [cadastralKey, setCadastralKey] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editReason, setEditReason] = useState('');
  const [lowDataMap, setLowDataMap] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const cardBackground = useThemeColor({}, 'backgroundCard');
  const borderColor = useThemeColor({}, 'border');

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
    loadPlotCadastralKey(selectedPlotId).then((key) => setCadastralKey(key ?? ''));
  }, [selectedPlotId]);

  useEffect(() => {
    if (selectedPlot) {
      setEditName(selectedPlot.name);
    } else {
      setEditName('');
    }
    setEditReason('');
  }, [selectedPlot?.id]);

  const complianceSummary = useMemo(() => {
    const green = backendPlots.filter((p) => p.status === 'compliant').length;
    const amber = backendPlots.filter((p) => p.status === 'degradation_risk').length;
    const red = backendPlots.filter((p) => p.status === 'deforestation_detected').length;
    return { green, amber, red };
  }, [backendPlots]);

  const handleTakePhoto = async (type: 'ground_truth' | 'land_title') => {
    if (!selectedPlot) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    const uri = result.assets[0].uri;
    const takenAt = Date.now();

    if (type === 'ground_truth') {
      const firstPoint = selectedPlot.points[0];
      persistPlotPhoto({
        plotId: selectedPlot.id,
        uri,
        takenAt,
        latitude: firstPoint?.latitude ?? null,
        longitude: firstPoint?.longitude ?? null,
      });
      const updated = await loadPhotosForPlot(selectedPlot.id);
      setPhotos(updated);
    } else {
      persistPlotTitlePhoto({ plotId: selectedPlot.id, uri, takenAt });
      const updated = await loadTitlePhotosForPlot(selectedPlot.id);
      setTitlePhotos(updated);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBackground }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="map" size={24} color={Brand.primary} />
            <ThemedText type="title" style={styles.headerTitle}>{t('my_plots')}</ThemedText>
          </View>
          {farmer ? (
            <View style={styles.farmerInfo}>
              <Ionicons name="person-circle-outline" size={18} color={Brand.primary} />
              <ThemedText type="caption">
                {farmer.name ? `${farmer.name} - ` : ''}{farmer.id}
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="caption" style={styles.warningText}>{t('no_farmer')}</ThemedText>
          )}
        </View>
      </View>

      <ThemedScrollView 
        style={[styles.scrollView, { backgroundColor: backgroundSecondary }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* How it works */}
        <Collapsible title="How this works">
          <View style={styles.helpContent}>
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <ThemedText type="defaultSemiBold" style={styles.stepNumberText}>1</ThemedText>
              </View>
              <ThemedText type="caption">
                On the Home tab, walk the plot perimeter with GPS and save the plot with a farmer declaration.
              </ThemedText>
            </View>
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <ThemedText type="defaultSemiBold" style={styles.stepNumberText}>2</ThemedText>
              </View>
              <ThemedText type="caption">
                Saved plots are stored offline and synced to the backend when online.
              </ThemedText>
            </View>
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <ThemedText type="defaultSemiBold" style={styles.stepNumberText}>3</ThemedText>
              </View>
              <ThemedText type="caption">
                Run compliance checks, record harvests, and create DDS packages for exporters.
              </ThemedText>
            </View>
          </View>
        </Collapsible>

        {/* Error Banner */}
        {backendError && (
          <Card variant="outlined" style={styles.errorCard}>
            <CardContent>
              <View style={styles.errorContent}>
                <Ionicons name="cloud-offline-outline" size={24} color={Brand.warning} />
                <View style={styles.errorText}>
                  <ThemedText type="defaultSemiBold">{t('backend_issue_title')}</ThemedText>
                  <ThemedText type="caption">{backendError}</ThemedText>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Local Plots */}
        {plots.length === 0 ? (
          <Card variant="elevated">
            <CardContent>
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color={borderColor} />
                <ThemedText type="subtitle" style={styles.emptyTitle}>No plots yet</ThemedText>
                <ThemedText type="caption" style={styles.emptyDescription}>
                  Go to the Home tab and walk a perimeter to save your first plot.
                </ThemedText>
              </View>
            </CardContent>
          </Card>
        ) : (
          <>
            <SectionHeader title="Local Plots" subtitle={`${plots.length} saved on device`} />
            <View style={styles.plotList}>
              {plots.map((plot) => (
                <Pressable
                  key={plot.id}
                  onPress={() => setSelectedPlotId(plot.id)}
                >
                  <Card 
                    variant={selectedPlotId === plot.id ? 'elevated' : 'outlined'}
                    style={[
                      styles.plotCard,
                      selectedPlotId === plot.id && styles.plotCardSelected
                    ]}
                  >
                    <CardContent>
                      <View style={styles.plotCardHeader}>
                        <View style={styles.plotInfo}>
                          <ThemedText type="defaultSemiBold">{plot.name}</ThemedText>
                          <ThemedText type="caption">
                            {plot.areaSquareMeters.toFixed(1)} m² ({plot.areaHectares.toFixed(4)} ha)
                          </ThemedText>
                        </View>
                        <Badge variant={plot.kind === 'polygon' ? 'info' : 'default'} size="sm">
                          {plot.kind}
                        </Badge>
                      </View>
                      {plot.declaredAreaHectares != null && (
                        <ThemedText type="caption" style={styles.discrepancyText}>
                          Declared: {plot.declaredAreaHectares.toFixed(4)} ha 
                          ({plot.discrepancyPercent?.toFixed(1)}% diff)
                        </ThemedText>
                      )}
                    </CardContent>
                  </Card>
                </Pressable>
              ))}
            </View>

            {/* Selected Plot Details */}
            {selectedPlot && region && (
              <>
                {/* Map */}
                <Card variant="elevated" style={styles.sectionCard}>
                  <CardHeader>
                    <View style={styles.sectionHeaderRow}>
                      <ThemedText type="subtitle">Plot Map</ThemedText>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setLowDataMap((prev) => !prev)}
                      >
                        {lowDataMap ? 'Show Map' : 'Low Data'}
                      </Button>
                    </View>
                  </CardHeader>
                  <View style={styles.mapContainer}>
                    <MapView
                      style={styles.map}
                      initialRegion={region}
                      mapType={lowDataMap ? 'none' : 'standard'}
                    >
                      {selectedPlot.kind === 'polygon' && selectedPlot.points.length > 2 && (
                        <Polyline
                          coordinates={[...selectedPlot.points, selectedPlot.points[0]]}
                          strokeColor={Brand.primary}
                          strokeWidth={3}
                        />
                      )}
                      <Marker coordinate={selectedPlot.points[0]} title={selectedPlot.name} />
                    </MapView>
                  </View>
                </Card>

                {/* Edit Plot */}
                <Card variant="elevated" style={styles.sectionCard}>
                  <CardHeader>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="create-outline" size={20} color={Brand.primary} />
                      <ThemedText type="subtitle">Edit Plot</ThemedText>
                    </View>
                  </CardHeader>
                  <CardContent>
                    <Input
                      label="Plot Name"
                      value={editName}
                      onChangeText={setEditName}
                      placeholder={selectedPlot.name}
                    />
                    <Input
                      label="Reason for Edit"
                      value={editReason}
                      onChangeText={setEditReason}
                      placeholder="e.g. corrected spelling"
                      hint="Required for audit trail"
                      containerStyle={styles.inputSpacing}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="primary"
                      onPress={async () => {
                        if (!selectedPlot || !editName.trim() || !editReason.trim()) return;
                        renamePlot(selectedPlot.id, editName.trim());
                        try {
                          const matchingBackend = backendPlots.find((p) => p.name === selectedPlot.name);
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
                          setSyncMessage('Plot name updated; edit logged.');
                        } catch (e) {
                          setSyncMessage(e instanceof Error ? e.message : 'Renamed locally. Backend sync pending.');
                        }
                      }}
                      disabled={!editName.trim() || !editReason.trim()}
                      fullWidth
                    >
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>

                {/* Ground-truth Photos */}
                <Card variant="elevated" style={styles.sectionCard}>
                  <CardHeader>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="camera-outline" size={20} color={Brand.primary} />
                      <ThemedText type="subtitle">Ground-truth Photos</ThemedText>
                    </View>
                  </CardHeader>
                  <CardContent>
                    {photos.length > 0 && (
                      <View style={styles.photoGrid}>
                        {photos.slice(0, 4).map((p) => (
                          <Image key={p.id} source={{ uri: p.uri }} style={styles.photoThumb} />
                        ))}
                      </View>
                    )}
                    <Button
                      variant="outline"
                      onPress={() => handleTakePhoto('ground_truth')}
                      icon={<Ionicons name="camera" size={18} color={Brand.primary} />}
                      fullWidth
                    >
                      Take Photo
                    </Button>
                  </CardContent>
                </Card>

                {/* Land Title / Legality */}
                <Card variant="elevated" style={styles.sectionCard}>
                  <CardHeader>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="document-text-outline" size={20} color={Brand.primary} />
                      <ThemedText type="subtitle">Land Title / Legality</ThemedText>
                    </View>
                  </CardHeader>
                  <CardContent>
                    <Input
                      label="Clave Catastral"
                      placeholder="e.g. 012-345-678-9"
                      value={cadastralKey}
                      onChangeText={setCadastralKey}
                      onBlur={() => {
                        if (!selectedPlot) return;
                        savePlotCadastralKey(selectedPlot.id, cadastralKey.trim() || null);
                      }}
                    />
                    
                    {titlePhotos.length > 0 && (
                      <View style={[styles.photoGrid, styles.inputSpacing]}>
                        {titlePhotos.slice(0, 4).map((p) => (
                          <Image key={p.id} source={{ uri: p.uri }} style={styles.photoThumb} />
                        ))}
                      </View>
                    )}
                    
                    <Button
                      variant="outline"
                      onPress={() => handleTakePhoto('land_title')}
                      icon={<Ionicons name="document" size={18} color={Brand.primary} />}
                      style={styles.inputSpacing}
                      fullWidth
                    >
                      Add Title Photo
                    </Button>

                    {syncMessage && (
                      <ThemedText type="caption" style={styles.syncMessage}>{syncMessage}</ThemedText>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="secondary"
                      onPress={async () => {
                        if (!selectedPlot) return;
                        setSyncMessage(null);
                        try {
                          const baseMeta = { cadastralKey: cadastralKey.trim() || null };
                          await syncPlotPhotosToBackend({
                            plotId: selectedPlot.id,
                            kind: 'ground_truth',
                            photos: photos.map((p) => ({
                              ...baseMeta, uri: p.uri, takenAt: p.takenAt,
                              latitude: p.latitude ?? null, longitude: p.longitude ?? null,
                            })),
                            note: 'Ground-truth photos sync',
                          });
                          await syncPlotPhotosToBackend({
                            plotId: selectedPlot.id,
                            kind: 'land_title',
                            photos: titlePhotos.map((p) => ({ ...baseMeta, uri: p.uri, takenAt: p.takenAt })),
                            note: 'Land title photos sync',
                          });
                          setSyncMessage('Legality data synced.');
                        } catch (e) {
                          setSyncMessage(e instanceof Error ? e.message : 'Could not sync.');
                        }
                      }}
                      fullWidth
                    >
                      Sync Legality Data
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </>
        )}

        {/* Record Harvest */}
        {farmer && backendPlots.length > 0 && (
          <Card variant="elevated" style={styles.sectionCard}>
            <CardHeader>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="leaf-outline" size={20} color={Brand.primary} />
                <ThemedText type="subtitle">{t('record_harvest_title')}</ThemedText>
              </View>
            </CardHeader>
            <CardContent>
              <Input
                label={t('kg_delivered')}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={kgInput}
                onChangeText={setKgInput}
              />
              {harvestMessage && (
                <ThemedText type="caption" style={styles.harvestMessage}>{harvestMessage}</ThemedText>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                onPress={async () => {
                  if (!kgInput.trim()) return;
                  const kg = Number(kgInput.trim().replace(',', '.'));
                  if (!selectedPlotId || Number.isNaN(kg) || kg <= 0) return;
                  setHarvestMessage(null);
                  try {
                    await postHarvestToBackend({ farmerId: farmer.id, plotId: selectedPlotId, kg });
                    setHarvestMessage('Harvest recorded and voucher created.');
                    setKgInput('');
                  } catch (e) {
                    setHarvestMessage(String(e));
                  }
                }}
                fullWidth
                icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
              >
                Record Harvest
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Backend Synced Plots */}
        {loadingBackend ? (
          <Card variant="elevated" style={styles.sectionCard}>
            <CardContent>
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={Brand.primary} />
                <ThemedText type="caption">Loading synced plots...</ThemedText>
              </View>
            </CardContent>
          </Card>
        ) : backendPlots.length > 0 && (
          <Card variant="elevated" style={styles.sectionCard}>
            <CardHeader>
              <SectionHeader
                title={t('synced_plots')}
                subtitle={`${backendPlots.length} on server`}
              />
              <View style={styles.complianceSummary}>
                <Badge variant="success" size="sm">{complianceSummary.green} Green</Badge>
                <Badge variant="warning" size="sm">{complianceSummary.amber} Amber</Badge>
                <Badge variant="error" size="sm">{complianceSummary.red} Red</Badge>
              </View>
            </CardHeader>
            <CardContent>
              {backendPlots.map((p) => (
                <View key={p.id} style={styles.backendPlotRow}>
                  <View style={styles.backendPlotInfo}>
                    <View style={styles.backendPlotHeader}>
                      <ThemedText type="defaultSemiBold">{p.name}</ThemedText>
                      <ComplianceBadge status={p.status} size="sm" />
                    </View>
                    <ThemedText type="caption">
                      {Number(p.area_ha).toFixed(4)} ha ({p.kind})
                    </ThemedText>
                    {(p.sinaph_overlap || p.indigenous_overlap) && (
                      <View style={styles.overlapWarnings}>
                        {p.sinaph_overlap && (
                          <Badge variant="warning" size="sm">Protected Area</Badge>
                        )}
                        {p.indigenous_overlap && (
                          <Badge variant="warning" size="sm">Indigenous Territory</Badge>
                        )}
                      </View>
                    )}
                  </View>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={complianceBusyId === p.id}
                    onPress={async () => {
                      if (!farmer) return;
                      setComplianceBusyId(p.id);
                      try {
                        await runComplianceCheckForPlot(p.id);
                        const rows = await fetchPlotsForFarmer(farmer.id);
                        setBackendPlots(rows ?? []);
                        setBackendError(null);
                      } catch (e) {
                        setBackendError(e instanceof Error ? e.message : 'Compliance check failed.');
                      } finally {
                        setComplianceBusyId(null);
                      }
                    }}
                    disabled={!!complianceBusyId}
                  >
                    Check
                  </Button>
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Vouchers */}
        {vouchers.length > 0 && (
          <Card variant="elevated" style={styles.sectionCard}>
            <CardHeader>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="ticket-outline" size={20} color={Brand.primary} />
                <ThemedText type="subtitle">{t('vouchers_title')}</ThemedText>
              </View>
            </CardHeader>
            <CardContent>
              {vouchers.map((v) => (
                <Pressable key={v.id} onPress={() => setSelectedVoucherId(v.id)}>
                  <View style={[
                    styles.voucherRow,
                    selectedVoucherId === v.id && styles.voucherRowSelected
                  ]}>
                    <View style={styles.voucherInfo}>
                      <ThemedText type="defaultSemiBold">{v.id.slice(0, 8)}...</ThemedText>
                      <ThemedText type="caption">
                        {new Date(v.created_at).toLocaleDateString()}
                      </ThemedText>
                    </View>
                    <Badge variant={v.status === 'active' ? 'success' : 'default'} size="sm">
                      {v.status}
                    </Badge>
                  </View>
                </Pressable>
              ))}
              
              {selectedVoucherId && (
                <View style={styles.qrContainer}>
                  <ThemedText type="caption" style={styles.qrLabel}>Voucher QR Code</ThemedText>
                  {(() => {
                    const v = vouchers.find((vv) => vv.id === selectedVoucherId);
                    if (!v?.qr_code_ref) return null;
                    return <QRCode value={String(v.qr_code_ref)} size={140} />;
                  })()}
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* DDS Packages */}
        {ddsPackages.length > 0 && (
          <Card variant="elevated" style={styles.sectionCard}>
            <CardHeader>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="cube-outline" size={20} color={Brand.primary} />
                <ThemedText type="subtitle">{t('dds_title')}</ThemedText>
              </View>
            </CardHeader>
            <CardContent>
              {ddsPackages.map((p) => (
                <View key={p.id} style={styles.ddsRow}>
                  <ThemedText type="defaultSemiBold">{p.id.slice(0, 8)}...</ThemedText>
                  <Badge variant={p.status === 'submitted' ? 'success' : 'default'} size="sm">
                    {p.status}
                  </Badge>
                </View>
              ))}
              
              <View style={styles.ddsActions}>
                {farmer && vouchers.length > 0 && (
                  <Button
                    variant="secondary"
                    onPress={async () => {
                      const activeIds = vouchers.filter((v) => v.status === 'active').map((v) => v.id);
                      if (activeIds.length === 0) return;
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
                        setBackendError(e instanceof Error ? e.message : 'Could not create package.');
                      }
                    }}
                    fullWidth
                  >
                    Create Package
                  </Button>
                )}
                
                {farmer && (
                  <Button
                    variant="primary"
                    loading={submittingPackage}
                    onPress={async () => {
                      if (!farmer) return;
                      const unsent = ddsPackages.filter((p) => p.status !== 'submitted');
                      if (unsent.length === 0) return;
                      const latest = unsent.sort((a, b) => {
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
                        setBackendError(e instanceof Error ? e.message : 'Could not submit.');
                      } finally {
                        setSubmittingPackage(false);
                      }
                    }}
                    disabled={submittingPackage}
                    fullWidth
                  >
                    Submit Latest
                  </Button>
                )}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Audit Events */}
        {auditEvents.length > 0 && (
          <Card variant="outlined" style={styles.sectionCard}>
            <CardHeader>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="time-outline" size={20} color={Brand.primary} />
                <ThemedText type="subtitle">{t('recent_activity')}</ThemedText>
              </View>
            </CardHeader>
            <CardContent>
              {auditEvents.slice(0, 5).map((e) => (
                <View key={e.id} style={styles.auditRow}>
                  <ThemedText type="caption">
                    {new Date(e.timestamp).toLocaleString()}
                  </ThemedText>
                  <Badge variant="default" size="sm">{e.event_type}</Badge>
                </View>
              ))}
            </CardContent>
          </Card>
        )}
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD4',
  },
  headerContent: {
    gap: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  warningText: {
    color: Brand.warning,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
    gap: Spacing.md,
  },
  helpContent: {
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  helpStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
  },
  errorCard: {
    borderColor: Brand.warning,
    backgroundColor: '#FEF5E7',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    flex: 1,
    gap: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    maxWidth: 280,
  },
  plotList: {
    gap: Spacing.sm,
  },
  plotCard: {
    marginBottom: 0,
  },
  plotCardSelected: {
    borderColor: Brand.primary,
    borderWidth: 2,
  },
  plotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  plotInfo: {
    flex: 1,
    gap: 2,
  },
  discrepancyText: {
    marginTop: Spacing.xs,
    color: Brand.warning,
  },
  sectionCard: {
    marginTop: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mapContainer: {
    height: 200,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  map: {
    flex: 1,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: '#E8DFD4',
  },
  syncMessage: {
    marginTop: Spacing.sm,
    color: Brand.success,
  },
  harvestMessage: {
    marginTop: Spacing.sm,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  complianceSummary: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  backendPlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD4',
  },
  backendPlotInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  backendPlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  overlapWarnings: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD4',
  },
  voucherRowSelected: {
    backgroundColor: '#E6F7EF',
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  voucherInfo: {
    gap: 2,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  qrLabel: {
    textAlign: 'center',
  },
  ddsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  ddsActions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  syncRow: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 8,
    gap: 4,
  },
});
