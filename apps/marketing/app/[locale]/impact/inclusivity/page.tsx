import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-inclusivity',
  '/impact/inclusivity',
  { hubHref: '/impact', hubLabel: 'Outcomes' },
);

export { generateMetadata };
export default Page;
