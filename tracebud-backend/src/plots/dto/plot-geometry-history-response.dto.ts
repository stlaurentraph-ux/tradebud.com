import { ApiProperty } from '@nestjs/swagger';

export class PlotGeometryHistoryPayloadDto {
  @ApiProperty({ description: 'Plot identifier associated with this audit event.' })
  plotId!: string;

  @ApiProperty({
    description: 'Additional immutable event payload fields captured in the audit trail.',
    required: false,
    type: Object,
    additionalProperties: true,
  })
  details?: Record<string, unknown>;
}

export class PlotGeometryHistoryEventDto {
  @ApiProperty({ description: 'Audit event identifier.' })
  id!: string;

  @ApiProperty({ description: 'Event timestamp in ISO format.' })
  timestamp!: string;

  @ApiProperty({ description: 'Actor user id if available.', nullable: true })
  userId!: string | null;

  @ApiProperty({ description: 'Actor device id if available.', nullable: true })
  deviceId!: string | null;

  @ApiProperty({
    description: 'Audit event type.',
    enum: ['plot_created', 'plot_geometry_superseded'],
  })
  eventType!: 'plot_created' | 'plot_geometry_superseded';

  @ApiProperty({ type: PlotGeometryHistoryPayloadDto })
  payload!: PlotGeometryHistoryPayloadDto;
}

export class PlotGeometryHistoryAnomalyDto {
  @ApiProperty({ description: 'Geometry history event id associated with the anomaly flag.' })
  eventId!: string;

  @ApiProperty({ enum: ['large_revision_jump', 'frequent_supersession'] })
  type!: 'large_revision_jump' | 'frequent_supersession';

  @ApiProperty({ enum: ['medium', 'high'] })
  severity!: 'medium' | 'high';

  @ApiProperty({ description: 'Human-readable anomaly explanation for investigation triage.' })
  message!: string;
}
