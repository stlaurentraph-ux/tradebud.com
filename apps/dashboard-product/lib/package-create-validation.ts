export type PackageCreateForm = {
  supplier_name: string;
  season: string;
  year: number;
  notes: string;
};

export type PackageCreateFieldErrors = Partial<Record<keyof PackageCreateForm, string>>;

const MIN_YEAR = 2020;
const MAX_YEAR = 2030;
const MAX_SUPPLIER_LENGTH = 120;
const MAX_NOTES_LENGTH = 2000;

export function validatePackageCreateForm(form: PackageCreateForm): PackageCreateFieldErrors {
  const errors: PackageCreateFieldErrors = {};
  const supplier = form.supplier_name.trim();

  if (!supplier) {
    errors.supplier_name = 'Supplier or cooperative name is required.';
  } else if (supplier.length > MAX_SUPPLIER_LENGTH) {
    errors.supplier_name = `Supplier name must be ${MAX_SUPPLIER_LENGTH} characters or fewer.`;
  }

  if (form.season !== 'A' && form.season !== 'B') {
    errors.season = 'Season must be A or B.';
  }

  if (!Number.isFinite(form.year) || form.year < MIN_YEAR || form.year > MAX_YEAR) {
    errors.year = `Year must be between ${MIN_YEAR} and ${MAX_YEAR}.`;
  }

  if (form.notes.trim().length > MAX_NOTES_LENGTH) {
    errors.notes = `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`;
  }

  return errors;
}

export function hasPackageCreateErrors(errors: PackageCreateFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
