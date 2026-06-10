import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'solutions-esg-carbon-reporting',
  '/solutions/esg-carbon-reporting',
);

export { generateMetadata };
export default Page;
