import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('compliance-eudr', '/compliance/eudr');

export { generateMetadata };
export default Page;
