import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('platform-field-app', '/platform/field-app');

export { generateMetadata };
export default Page;
