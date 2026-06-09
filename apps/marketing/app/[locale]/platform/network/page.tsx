import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('platform-network', '/platform/network');

export { generateMetadata };
export default Page;
