export type BulkPlotImportCsvRow = Record<string, string>;

export type BulkPlotImportMappedRow = {
  rowIndex: number;
  producerFullName?: string;
  producerEmail?: string;
  producerPhone?: string | null;
  producerCountry?: string | null;
  producerContactId?: string | null;
  plotName?: string | null;
  clientPlotId: string;
  latitude?: string | null;
  longitude?: string | null;
  declaredAreaHa?: string | null;
  cadastralKey?: string | null;
  countryCode?: string | null;
};

export const BULK_PLOT_IMPORT_TEMPLATE_CSV = [
  'producer_full_name,producer_email,producer_phone,producer_country,client_plot_id,plot_name,latitude,longitude,declared_area_ha,cadastral_key,country_code',
  'Maria Lopez,maria@example.com,+50499990001,HN,PLOT-001,Finca Norte,14.634900,-87.849400,2.5,,',
  'Juan Perez,,+50499990002,HN,PLOT-002,Parcela Sur,,,,"012-345-678-9",HN',
].join('\n');

const COLUMN_ALIASES: Record<string, keyof Omit<BulkPlotImportMappedRow, 'rowIndex'>> = {
  producer_full_name: 'producerFullName',
  producerfullname: 'producerFullName',
  producer_name: 'producerFullName',
  full_name: 'producerFullName',
  producer_email: 'producerEmail',
  produceremail: 'producerEmail',
  email: 'producerEmail',
  producer_phone: 'producerPhone',
  producerphone: 'producerPhone',
  phone: 'producerPhone',
  producer_country: 'producerCountry',
  producercountry: 'producerCountry',
  country: 'producerCountry',
  producer_contact_id: 'producerContactId',
  producercontactid: 'producerContactId',
  contact_id: 'producerContactId',
  plot_name: 'plotName',
  plotname: 'plotName',
  name: 'plotName',
  client_plot_id: 'clientPlotId',
  clientplotid: 'clientPlotId',
  plot_id: 'clientPlotId',
  latitude: 'latitude',
  lat: 'latitude',
  longitude: 'longitude',
  lon: 'longitude',
  lng: 'longitude',
  declared_area_ha: 'declaredAreaHa',
  declaredareaha: 'declaredAreaHa',
  area_ha: 'declaredAreaHa',
  cadastral_key: 'cadastralKey',
  cadastralkey: 'cadastralKey',
  clave_catastral: 'cadastralKey',
  country_code: 'countryCode',
  countrycode: 'countryCode',
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

export function parseBulkPlotImportCsv(text: string): BulkPlotImportCsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(normalizeHeader);
  const rows: BulkPlotImportCsvRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex]);
    if (values.every((value) => !value.trim())) continue;
    const row: BulkPlotImportCsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

export function mapBulkPlotImportCsvRows(rows: BulkPlotImportCsvRow[]): BulkPlotImportMappedRow[] {
  return rows.map((row, index) => {
    const mapped: BulkPlotImportMappedRow = {
      rowIndex: index + 1,
      clientPlotId: '',
    };

    for (const [header, value] of Object.entries(row)) {
      const field = COLUMN_ALIASES[normalizeHeader(header)];
      if (!field || field === 'clientPlotId') {
        if (field === 'clientPlotId') {
          mapped.clientPlotId = value.trim();
        }
        continue;
      }
      mapped[field] = value.trim() || null;
    }

    if (!mapped.clientPlotId) {
      mapped.clientPlotId =
        row.client_plot_id?.trim() ||
        row.clientplotid?.trim() ||
        row.plot_id?.trim() ||
        '';
    }

    return mapped;
  });
}

export function parseAndMapBulkPlotImportCsv(text: string): BulkPlotImportMappedRow[] {
  return mapBulkPlotImportCsvRows(parseBulkPlotImportCsv(text));
}
