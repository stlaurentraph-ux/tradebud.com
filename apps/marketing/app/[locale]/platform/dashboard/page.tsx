import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('platform-dashboard', '/platform/dashboard');

export { generateMetadata };
export default Page;
