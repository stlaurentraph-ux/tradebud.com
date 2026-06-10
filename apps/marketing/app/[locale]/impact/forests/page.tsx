import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-forests',
  '/impact/forests',
);

export { generateMetadata };
export default Page;
