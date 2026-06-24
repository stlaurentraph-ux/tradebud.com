import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-market-access',
  '/impact/market-access',
  { hubHref: '/impact', hubLabel: 'Outcomes' },
);

export { generateMetadata };
export default Page;
