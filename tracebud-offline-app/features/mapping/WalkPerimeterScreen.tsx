import { useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useWalkPerimeter } from './useWalkPerimeter';
import { useAppState } from '@/features/state/AppStateContext';
import { postPlotToBackend } from '@/features/api/postPlot';
import { useLanguage } from '@/features/state/LanguageContext';

type LatLng = {
  latitude: number;
  longitude: number;
};

function segmentsIntersect(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): boolean {
  const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;

  const d1x = p2.latitude - p1.latitude;
  const d1y = p2.longitude - p1.longitude;
  const d2x = p4.latitude - p3.latitude;
  const d2y = p4.longitude - p3.longitude;

  const denominator = cross(d1x, d1y, d2x, d2y);
  if (denominator === 0) {
    return false;
  }

  const dx = p3.latitude - p1.latitude;
  const dy = p3.longitude - p1.longitude;

  const t = cross(dx, dy, d2x, d2y) / denominator;
  const u = cross(dx, dy, d1x, d1y) / denominator;

  return t > 0 && t < 1 && u > 0 && u < 1;
}

function hasSelfIntersection(points: LatLng[]): boolean {
  if (points.length < 4) {
    return false;
  }

  const n = points.length;

  for (let i = 0; i < n; i++) {
    const a1 = points[i];
    const a2 = points[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      const b1 = points[j];
      const b2 = points[(j + 1) % n];

      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) {
        continue;
      }

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}

export function WalkPerimeterScreen() {
  const { points, area, precisionMeters, isRecording, lastError, startRecording, stopRecording, reset } =
    useWalkPerimeter();
  const { farmer, setFarmer, plots, addPlot } = useAppState();
  const { t } = useLanguage();
  const [farmerIdInput, setFarmerIdInput] = useState(farmer?.id ?? '');
  const [farmerNameInput, setFarmerNameInput] = useState(farmer?.name ?? '');
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(farmer?.selfDeclared ?? false);
  const [declaredAreaHaInput, setDeclaredAreaHaInput] = useState('');

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
    farmerIdInput.trim().length > 0 && acceptedDeclaration;

  const handleSaveFarmer = () => {
    if (!canSaveFarmerProfile) {
      return;
    }

    const now = Date.now();
    setFarmer({
      id: farmerIdInput.trim(),
      name: farmerNameInput.trim() || undefined,
      role: 'farmer',
      selfDeclared: true,
      selfDeclaredAt: now,
    });
  };

  const canSavePlot =
    hasFarmerAccess &&
    points.length >= 3 &&
    area.squareMeters > 0 &&
    (precisionMeters == null ? false : precisionMeters <= 3);

  const handleSavePlot = () => {
    if (!canSavePlot) {
      return;
    }

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

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t('farmer_identity')}</ThemedText>

      <View style={styles.identitySection}>
        <ThemedText>{t('farmer_id_label')}</ThemedText>
        <TextInput
          style={styles.input}
          placeholder={t('farmer_id_placeholder')}
          value={farmerIdInput}
          onChangeText={setFarmerIdInput}
        />
        <ThemedText>{t('farmer_name_label')}</ThemedText>
        <TextInput
          style={styles.input}
          placeholder={t('farmer_name_placeholder')}
          value={farmerNameInput}
          onChangeText={setFarmerNameInput}
        />
        <View style={styles.declarationRow}>
          <Button
            title={
              acceptedDeclaration
                ? t('declaration_button_accepted')
                : t('declaration_button_accept')
            }
            onPress={() => setAcceptedDeclaration(true)}
          />
          <ThemedText style={styles.declarationText}>
            {t('declaration_text')}
          </ThemedText>
        </View>
        <Button
          title={hasFarmerAccess ? t('farmer_set') : t('save_farmer')}
          onPress={handleSaveFarmer}
          disabled={!canSaveFarmerProfile}
        />
      </View>

      <ThemedText type="title">{t('walk_title')}</ThemedText>
      <ThemedText>{t('walk_help')}</ThemedText>

      <View style={styles.buttonRow}>
        <Button
          title={isRecording ? 'Recording…' : t('start_walking')}
          onPress={startRecording}
          disabled={isRecording || !hasFarmerAccess}
        />
        <Button
          title={t('stop')}
          onPress={stopRecording}
          disabled={!isRecording || !hasFarmerAccess}
        />
        <Button
          title={t('reset')}
          onPress={reset}
          disabled={(!points.length && !isRecording) || !hasFarmerAccess}
        />
        <Button title={t('save_plot')} onPress={handleSavePlot} disabled={!canSavePlot} />
      </View>

      <ThemedText>
        Points recorded: {points.length}{' '}
        {points.length > 0
          ? `(last: ${points[points.length - 1].latitude.toFixed(6)}, ${points[
              points.length - 1
            ].longitude.toFixed(6)})`
          : ''}
      </ThemedText>

      <ThemedText>
        Precision:{' '}
        {precisionMeters != null ? `${precisionMeters.toFixed(1)} m` : 'n/a'} (needs ≤ 3 m to save)
      </ThemedText>

      <ThemedText>
        Area:{' '}
        {area.squareMeters > 0
          ? `${area.squareMeters.toFixed(1)} m² (~${area.hectares.toFixed(4)} ha)`
          : 'n/a'}
      </ThemedText>

      <ThemedText>Declared area (hectares, optional, max 5% difference)</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="e.g. 1.50"
        keyboardType="decimal-pad"
        value={declaredAreaHaInput}
        onChangeText={setDeclaredAreaHaInput}
      />

      {lastError ? <ThemedText type="subtitle">{lastError}</ThemedText> : null}

      {initialRegion && (
        <View style={styles.mapContainer}>
          <MapView style={styles.map} initialRegion={initialRegion}>
            {points.length > 0 && (
              <>
                <Polyline
                  coordinates={[
                    ...points.map((p) => ({
                      latitude: p.latitude,
                      longitude: p.longitude,
                    })),
                    ...(points.length > 2
                      ? [
                          {
                            latitude: points[0].latitude,
                            longitude: points[0].longitude,
                          },
                        ]
                      : []),
                  ]}
                  strokeColor="#007AFF"
                  strokeWidth={3}
                />
                <Marker
                  coordinate={{
                    latitude: points[points.length - 1].latitude,
                    longitude: points[points.length - 1].longitude,
                  }}
                  title="Last point"
                />
              </>
            )}
          </MapView>
        </View>
      )}

      {plots.length > 0 && (
        <>
          <ThemedText type="subtitle">Saved plots (this session)</ThemedText>
          {plots.map((plot) => (
            <ThemedText key={plot.id}>
              {plot.name}: {plot.areaSquareMeters.toFixed(1)} m² (~
              {plot.areaHectares.toFixed(4)} ha), {plot.kind}
            </ThemedText>
          ))}
        </>
      )}

      <FlatList
        data={points}
        keyExtractor={(item) => `${item.timestamp}-${item.latitude}-${item.longitude}`}
        style={styles.list}
        renderItem={({ item, index }) => (
          <ThemedText>
            {index + 1}. {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </ThemedText>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  identitySection: {
    gap: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  declarationRow: {
    marginTop: 4,
    gap: 6,
  },
  declarationText: {
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  list: {
    marginTop: 12,
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

