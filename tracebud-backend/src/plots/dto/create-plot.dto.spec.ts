import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePlotDto } from './create-plot.dto';
import { UpdatePlotGeometryDto } from './update-plot-geometry.dto';

const validationOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
} as const;

describe('plot geometry DTO whitelist', () => {
  it('CreatePlotDto accepts GeoJSON geometry under forbidNonWhitelisted', async () => {
    const dto = plainToInstance(CreatePlotDto, {
      farmerId: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
      clientPlotId: '658e0832-b5e1-4f8f-a20e-81a9e13de890',
      geometry: { type: 'Point', coordinates: [-87.1, 14.1] },
      declaredAreaHa: 1,
      precisionMeters: 5,
      geometryCapture: { geometryConfidenceTier: 'high', geometryConfidenceScore: 0.9 },
    });

    await expect(validate(dto, validationOptions)).resolves.toEqual([]);
  });

  it('UpdatePlotGeometryDto accepts GeoJSON geometry under forbidNonWhitelisted', async () => {
    const dto = plainToInstance(UpdatePlotGeometryDto, {
      geometry: {
        type: 'Polygon',
        coordinates: [[[-86.1, 14.1], [-86.2, 14.1], [-86.2, 14.2], [-86.1, 14.2], [-86.1, 14.1]]],
      },
      reason: 'field correction',
    });

    await expect(validate(dto, validationOptions)).resolves.toEqual([]);
  });
});
