import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('compliance-security', '/compliance/security');

export { generateMetadata };
export default Page;
