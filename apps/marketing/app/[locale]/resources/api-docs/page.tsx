import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('resources-api-docs', '/resources/api-docs');

export { generateMetadata };
export default Page;
