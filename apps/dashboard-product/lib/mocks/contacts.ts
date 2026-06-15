export interface DemoContact {
  id: string;
  full_name: string;
  email: string;
  country: string;
  organization: string;
  status: string;
  tags: string[];
}

export const mockDemoContacts: DemoContact[] = [
  {
    id: 'contact_demo_001',
    full_name: 'Jean-Baptiste Niyonzima',
    email: 'jean-baptiste@demo.tracebud.local',
    country: 'Rwanda',
    organization: 'Rwanda Coffee Cooperative',
    status: 'submitted',
    tags: ['commodity:Cocoa'],
  },
  {
    id: 'contact_demo_002',
    full_name: 'Marie Uwimana',
    email: 'marie@demo.tracebud.local',
    country: 'Rwanda',
    organization: 'Rwanda Coffee Cooperative',
    status: 'submitted',
    tags: ['commodity:Cocoa'],
  },
  {
    id: 'contact_demo_003',
    full_name: 'Pierre Habimana',
    email: 'pierre@demo.tracebud.local',
    country: 'Rwanda',
    organization: 'Huye Highland Growers',
    status: 'new',
    tags: ['commodity:Coffee'],
  },
  {
    id: 'contact_demo_004',
    full_name: 'Euro Import Partners',
    email: 'buyer@demo.tracebud.local',
    country: 'Belgium',
    organization: 'Euro Import Partners',
    status: 'submitted',
    tags: ['commodity:Cocoa'],
  },
];
