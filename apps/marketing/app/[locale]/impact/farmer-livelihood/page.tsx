import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-farmer-livelihood',
  '/impact/farmer-livelihood',
);

export { generateMetadata };
export default Page;
