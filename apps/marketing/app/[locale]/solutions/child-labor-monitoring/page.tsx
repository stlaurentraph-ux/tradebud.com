import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'solutions-child-labor-monitoring',
  '/solutions/child-labor-monitoring',
);

export { generateMetadata };
export default Page;
