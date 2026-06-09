import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('compliance-guides', '/compliance/guides');

export { generateMetadata };
export default Page;
