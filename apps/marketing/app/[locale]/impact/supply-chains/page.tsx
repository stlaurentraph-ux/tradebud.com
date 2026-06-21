import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-supply-chains',
  '/impact/supply-chains',
  { hubHref: '/impact', hubLabel: 'Outcomes' },
);

export { generateMetadata };
export default Page;
