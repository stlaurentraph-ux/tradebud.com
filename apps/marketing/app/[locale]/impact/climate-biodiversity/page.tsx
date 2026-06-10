import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-climate-biodiversity',
  '/impact/climate-biodiversity',
);

export { generateMetadata };
export default Page;
