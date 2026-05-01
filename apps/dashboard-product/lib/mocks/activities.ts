import type { Activity } from '@/types';

export const mockActivities: Activity[] = [
  {
    id: 'act_001',
    type: 'package_submitted',
    title: 'TRACES Submission',
    description: 'DDS-2024-003 submitted to TRACES',
    entity_id: 'pkg_003',
    entity_type: 'package',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-22T14:30:00Z',
  },
  {
    id: 'act_002',
    type: 'compliance_check',
    title: 'Pre-flight Check',
    description: 'DDS-2024-002 compliance check completed with warnings',
    entity_id: 'pkg_002',
    entity_type: 'package',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-22T10:15:00Z',
  },
  {
    id: 'act_003',
    type: 'plot_added',
    title: 'Plot Added',
    description: 'Rubavu Lake View plot added to DDS-2024-003',
    entity_id: 'plot_005',
    entity_type: 'plot',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-21T16:45:00Z',
  },
  {
    id: 'act_004',
    type: 'document_uploaded',
    title: 'Evidence Uploaded',
    description: 'Satellite imagery uploaded for Kigali Highland Plot A',
    entity_id: 'plot_001',
    entity_type: 'plot',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-20T09:00:00Z',
  },
  {
    id: 'act_005',
    type: 'package_created',
    title: 'Package Created',
    description: 'DDS-2024-005 created for Eastern Province Union',
    entity_id: 'pkg_005',
    entity_type: 'package',
    user_id: 'usr_exporter_001',
    user_name: 'Maria Santos',
    created_at: '2024-06-19T11:30:00Z',
  },
];

export function getMockActivities(): Activity[] {
  return mockActivities;
}
