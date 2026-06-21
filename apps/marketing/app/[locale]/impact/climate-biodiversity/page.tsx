import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-climate-biodiversity',
  '/impact/climate-biodiversity',
  { hubHref: '/impact', hubLabel: 'Outcomes' },
);

export { generateMetadata };
export default Page;
