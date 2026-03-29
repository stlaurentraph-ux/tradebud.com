import { useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { useWalkPerimeter } from './useWalkPerimeter';
import { useAppState } from '@/features/state/AppStateContext';
import { postPlotToBackend } from '@/features/api/postPlot';
import { useLanguage } from '@/features/state/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Brand, Spacing, Radius, Shadows } from '@/constants/theme';

type LatLng = {
  latitude: number;
  longitude: number;
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const mapsModule = Platform.OS === 'web' ? null : require('react-native-maps');
const NativeMapView = mapsModule?.default;
const NativeMarker = mapsModule?.Marker;
const NativePolyline = mapsModule?.Polyline;

function segmentsIntersect(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): boolean {
  const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;

  const d1x = p2.latitude - p1.latitude;
  const d1y = p2.longitude - p1.longitude;
  const d2x = p4.latitude - p3.latitude;
  const d2y = p4.longitude - p3.longitude;

  const denominator = cross(d1x, d1y, d2x, d2y);
  if (denominator === 0) return false;

  const dx = p3.latitude - p1.latitude;
  const dy = p3.longitude - p1.longitude;

  const t = cross(dx, dy, d2x, d2y) / denominator;
  const u = cross(dx, dy, d1x, d1y) / denominator;

  return t > 0 && t < 1 && u > 0 && u < 1;
}

function hasSelfIntersection(points: LatLng[]): boolean {
  if (points.length < 4) return false;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const a1 = points[i];
    const a2 = points[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      const b1 = points[j];
      const b2 = points[(j + 1) % n];

      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue;
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }

  return false;
}

export function WalkPerimeterScreen() {
  const { 
    points, area, precisionMeters, isRecording, lastError, 
    startRecording, stopRecording, reset 
  } = useWalkPerimeter();
  const { farmer, setFarmer, plots, addPlot } = useAppState();
  const { t } = useLanguage();
  
  const [farmerIdInput, setFarmerIdInput] = useState(farmer?.id ?? '');
  const [farmerNameInput, setFarmerNameInput] = useState(farmer?.name ?? '');
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(farmer?.selfDeclared ?? false);
  const [declaredAreaHaInput, setDeclaredAreaHaInput] = useState('');
  const [lowDataMap, setLowDataMap] = useState(false);
  const [fpicConsent, setFpicConsent] = useState(farmer?.fpicConsent ?? false);
  const [laborNoChildLabor, setLaborNoChildLabor] = useState(farmer?.laborNoChildLabor ?? false);
  const [laborNoForcedLabor, setLaborNoForcedLabor] = useState(farmer?.laborNoForcedLabor ?? false);
  const [showPointsList, setShowPointsList] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'backgroundCard');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');

  const initialRegion: Region | undefined =
    points.length > 0
      ? {
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }
      : undefined;

  const hasFarmerAccess = farmer?.selfDeclared === true;

  const canSaveFarmerProfile =
    farmerIdInput.trim().length > 0 &&
    acceptedDeclaration &&
    fpicConsent &&
    laborNoChildLabor &&
    laborNoForcedLabor;

  const handleSaveFarmer = () => {
    if (!canSaveFarmerProfile) return;

    const now = Date.now();
    setFarmer({
      id: farmerIdInput.trim(),
      name: farmerNameInput.trim() || undefined,
      role: 'farmer',
      selfDeclared: true,
      selfDeclaredAt: now,
      fpicConsent,
      laborNoChildLabor,
      laborNoForcedLabor,
    });
  };

  const canSavePlot =
    hasFarmerAccess &&
    points.length >= 3 &&
    area.squareMeters > 0 &&
    (precisionMeters == null ? false : precisionMeters <= 3);

  const handleSavePlot = () => {
    if (!canSavePlot) return;

    if (hasSelfIntersection(points)) {
      Alert.alert(
        'Invalid boundary',
        'The polygon self-intersects. Please walk the perimeter again.',
      );
      return;
    }

    const kind: 'point' | 'polygon' = area.hectares < 4 ? 'point' : 'polygon';
    const name = `Plot ${plots.length + 1}`;

    let declaredAreaHectares: number | undefined;
    let discrepancyPercent: number | undefined;

    if (declaredAreaHaInput.trim().length > 0) {
      const parsed = Number(declaredAreaHaInput.trim().replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0) {
        Alert.alert(
          'Invalid declared area',
          'Please enter a positive number for declared hectares.',
        );
        return;
      }
      declaredAreaHectares = parsed;

      const diff = Math.abs(area.hectares - declaredAreaHectares);
      const pct = (diff / declaredAreaHectares) * 100;

      if (pct > 5) {
        Alert.alert(
          'Area discrepancy too large',
          `The difference between GPS area (${area.hectares.toFixed(
            4,
          )} ha) and declared area (${declaredAreaHectares.toFixed(
            4,
          )} ha) is ${pct.toFixed(1)}%, which exceeds the 5% tolerance.`,
        );
        return;
      }

      discrepancyPercent = pct;
    }

    addPlot({
      name,
      areaSquareMeters: area.squareMeters,
      areaHectares: area.hectares,
      kind,
      points: points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
      })),
      declaredAreaHectares,
      discrepancyPercent,
      precisionMetersAtSave: precisionMeters ?? null,
    });
    Alert.alert('Plot saved', `${name} has been saved for farmer ${farmer?.id}.`);

    if (farmer && points.length > 0) {
      const geometry =
        kind === 'point'
          ? {
              type: 'Point' as const,
              coordinates: [points[points.length - 1].longitude, points[points.length - 1].latitude] as [
                number,
                number,
              ],
            }
          : {
              type: 'Polygon' as const,
              coordinates: [
                [
                  ...points.map((p) => [p.longitude, p.latitude] as [number, number]),
                  [points[0].longitude, points[0].latitude] as [number, number],
                ],
              ],
            };

      postPlotToBackend({
        farmerId: farmer.id,
        clientPlotId: name,
        geometry,
        declaredAreaHa: declaredAreaHectares ?? null,
        precisionMeters: precisionMeters ?? null,
      });
    }
  };

  const getPrecisionColor = () => {
    if (precisionMeters == null) return borderColor;
    if (precisionMeters <= 3) return successColor;
    if (precisionMeters <= 5) return warningColor;
    return Brand.error;
  };

  return (
    <ThemedScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Farmer Identity Section */}
      <Card variant="elevated" style={styles.card}>
        <CardHeader>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-circle-outline" size={24} color={Brand.primary} />
            <ThemedText type="subtitle">{t('farmer_identity')}</ThemedText>
            {hasFarmerAccess && (
              <Badge variant="success" size="sm">Verified</Badge>
            )}
          </View>
        </CardHeader>

        <CardContent>
          <Input
            label={t('farmer_id_label')}
            placeholder={t('farmer_id_placeholder')}
            value={farmerIdInput}
            onChangeText={setFarmerIdInput}
          />

          <Input
            label={t('farmer_name_label')}
            placeholder={t('farmer_name_placeholder')}
            value={farmerNameInput}
            onChangeText={setFarmerNameInput}
            containerStyle={styles.inputSpacing}
          />

          <View style={styles.declarationsSection}>
            <ThemedText type="label" style={styles.declarationsLabel}>
              Required Declarations
            </ThemedText>

            <Checkbox
              checked={acceptedDeclaration}
              onChange={setAcceptedDeclaration}
              label="Self Declaration"
              description={t('declaration_text')}
            />

            <Checkbox
              checked={fpicConsent}
              onChange={setFpicConsent}
              label={t('fpic_title')}
              description={t('fpic_label')}
            />

            <Checkbox
              checked={laborNoChildLabor}
              onChange={setLaborNoChildLabor}
              label="No Child Labor"
              description={t('labor_no_child')}
            />

            <Checkbox
              checked={laborNoForcedLabor}
              onChange={setLaborNoForcedLabor}
              label="No Forced Labor"
              description={t('labor_no_forced')}
            />
          </View>
        </CardContent>

        <CardFooter>
          <Button
            variant={hasFarmerAccess ? 'secondary' : 'primary'}
            onPress={handleSaveFarmer}
            disabled={!canSaveFarmerProfile}
            fullWidth
            size="lg"
          >
            {hasFarmerAccess ? t('farmer_set') : t('save_farmer')}
          </Button>
        </CardFooter>
      </Card>

      {/* GPS Recording Section */}
      <Card variant="elevated" style={styles.card}>
        <CardHeader>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="walk-outline" size={24} color={Brand.primary} />
            <ThemedText type="subtitle">{t('walk_title')}</ThemedText>
          </View>
          <ThemedText type="caption">{t('walk_help')}</ThemedText>
        </CardHeader>

        <CardContent>
          {/* Recording Controls */}
          <View style={styles.recordingControls}>
            <Button
              variant={isRecording ? 'secondary' : 'primary'}
              onPress={startRecording}
              disabled={isRecording || !hasFarmerAccess}
              size="lg"
              style={styles.recordButton}
              icon={
                <View style={[styles.recordDot, isRecording && styles.recordDotActive]} />
              }
            >
              {isRecording ? 'Recording...' : t('start_walking')}
            </Button>

            <View style={styles.controlButtonRow}>
              <Button
                variant="outline"
                onPress={stopRecording}
                disabled={!isRecording || !hasFarmerAccess}
                style={styles.halfButton}
              >
                {t('stop')}
              </Button>
              <Button
                variant="ghost"
                onPress={reset}
                disabled={(!points.length && !isRecording) || !hasFarmerAccess}
                style={styles.halfButton}
              >
                {t('reset')}
              </Button>
            </View>
          </View>

          {/* Stats Display */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor }]}>
              <ThemedText type="caption">Points</ThemedText>
              <ThemedText type="subtitle">{points.length}</ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor }]}>
              <ThemedText type="caption">Precision</ThemedText>
              <ThemedText 
                type="subtitle" 
                style={{ color: getPrecisionColor() }}
              >
                {precisionMeters != null ? `${precisionMeters.toFixed(1)}m` : '--'}
              </ThemedText>
              {precisionMeters != null && precisionMeters > 3 && (
                <ThemedText type="caption" style={{ color: Brand.warning }}>
                  Needs 3m or less
                </ThemedText>
              )}
            </View>

            <View style={[styles.statCard, { backgroundColor }]}>
              <ThemedText type="caption">Area</ThemedText>
              <ThemedText type="subtitle">
                {area.squareMeters > 0 ? `${area.hectares.toFixed(4)} ha` : '--'}
              </ThemedText>
              {area.squareMeters > 0 && (
                <ThemedText type="caption">
                  {area.squareMeters.toFixed(0)} m²
                </ThemedText>
              )}
            </View>
          </View>

          {lastError && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={20} color={Brand.error} />
              <ThemedText style={{ color: Brand.error, flex: 1 }}>{lastError}</ThemedText>
            </View>
          )}

          {/* Map */}
          {initialRegion && (
            <View style={styles.mapSection}>
              <View style={styles.mapHeader}>
                <ThemedText type="defaultSemiBold">Plot Preview</ThemedText>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setLowDataMap((prev) => !prev)}
                >
                  {lowDataMap ? 'Show Map' : 'Low Data'}
                </Button>
              </View>
              {Platform.OS === 'web' || !NativeMapView ? (
                <View style={[styles.mapContainer, styles.mapFallback]}>
                  <ThemedText type="defaultSemiBold">Map preview unavailable on web</ThemedText>
                  <ThemedText type="caption">
                    Continue recording points and review coordinates below.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.mapContainer}>
                  <NativeMapView
                    style={styles.map}
                    initialRegion={initialRegion}
                    mapType={lowDataMap ? 'none' : 'standard'}
                  >
                    {points.length > 0 && (
                      <>
                        <NativePolyline
                          coordinates={[
                            ...points.map((p) => ({
                              latitude: p.latitude,
                              longitude: p.longitude,
                            })),
                            ...(points.length > 2
                              ? [{ latitude: points[0].latitude, longitude: points[0].longitude }]
                              : []),
                          ]}
                          strokeColor={Brand.primary}
                          strokeWidth={4}
                        />
                        <NativeMarker
                          coordinate={{
                            latitude: points[points.length - 1].latitude,
                            longitude: points[points.length - 1].longitude,
                          }}
                          title="Current position"
                          pinColor={Brand.accent}
                        />
                        {points.length > 0 && (
                          <NativeMarker
                            coordinate={{
                              latitude: points[0].latitude,
                              longitude: points[0].longitude,
                            }}
                            title="Start point"
                            pinColor={Brand.primary}
                          />
                        )}
                      </>
                    )}
                  </NativeMapView>
                </View>
              )}
            </View>
          )}

          {/* Declared Area Input */}
          <Input
            label="Declared Area (optional)"
            placeholder="e.g. 1.50"
            keyboardType="decimal-pad"
            value={declaredAreaHaInput}
            onChangeText={setDeclaredAreaHaInput}
            hint="Hectares - max 5% difference allowed from GPS measurement"
            containerStyle={styles.inputSpacing}
          />
        </CardContent>

        <CardFooter>
          <Button
            variant="primary"
            onPress={handleSavePlot}
            disabled={!canSavePlot}
            fullWidth
            size="lg"
            icon={<Ionicons name="save-outline" size={20} color="#fff" />}
          >
            {t('save_plot')}
          </Button>
        </CardFooter>
      </Card>

      {/* Saved Plots Summary */}
      {plots.length > 0 && (
        <Card variant="outlined" style={styles.card}>
          <CardHeader>
            <SectionHeader
              title="Saved Plots"
              subtitle={`${plots.length} plot${plots.length > 1 ? 's' : ''} this session`}
            />
          </CardHeader>
          <CardContent>
            {plots.map((plot) => (
              <View key={plot.id} style={styles.savedPlotRow}>
                <View style={styles.savedPlotInfo}>
                  <ThemedText type="defaultSemiBold">{plot.name}</ThemedText>
                  <ThemedText type="caption">
                    {plot.areaHectares.toFixed(4)} ha ({plot.kind})
                  </ThemedText>
                </View>
                <Badge variant="success" size="sm">Saved</Badge>
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* GPS Points List (collapsible) */}
      {points.length > 0 && (
        <Card variant="outlined" style={styles.card}>
          <CardHeader>
            <Button
              variant="ghost"
              onPress={() => setShowPointsList(!showPointsList)}
              style={styles.collapsibleHeader}
              iconRight={
                <Ionicons 
                  name={showPointsList ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={Brand.primary} 
                />
              }
            >
              GPS Coordinates ({points.length})
            </Button>
          </CardHeader>
          
          {showPointsList && (
            <CardContent>
              <FlatList
                data={points}
                keyExtractor={(item) => `${item.timestamp}-${item.latitude}-${item.longitude}`}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View style={styles.pointRow}>
                    <ThemedText type="caption" style={styles.pointIndex}>
                      {index + 1}
                    </ThemedText>
                    <ThemedText type="caption">
                      {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                    </ThemedText>
                  </View>
                )}
              />
            </CardContent>
          )}
        </Card>
      )}
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
    gap: Spacing.lg,
  },
  card: {
    marginBottom: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  declarationsSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  declarationsLabel: {
    marginBottom: Spacing.sm,
  },
  recordingControls: {
    gap: Spacing.md,
  },
  recordButton: {
    width: '100%',
  },
  recordDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  recordDotActive: {
    backgroundColor: Brand.error,
  },
  controlButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  mapSection: {
    marginTop: Spacing.lg,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mapContainer: {
    height: 280,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  mapFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: '#E8DFD4',
    backgroundColor: '#F8F4EF',
    paddingHorizontal: Spacing.md,
  },
  map: {
    flex: 1,
  },
  savedPlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD4',
  },
  savedPlotInfo: {
    flex: 1,
    gap: 2,
  },
  collapsibleHeader: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  pointRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  pointIndex: {
    width: 24,
    textAlign: 'center',
  },
});
