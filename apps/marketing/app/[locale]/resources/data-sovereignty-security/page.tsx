import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'resources-data-sovereignty-security',
  '/resources/data-sovereignty-security',
);

export { generateMetadata };
export default Page;
