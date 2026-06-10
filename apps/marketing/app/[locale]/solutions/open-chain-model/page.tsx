import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'solutions-open-chain-model',
  '/solutions/open-chain-model',
);

export { generateMetadata };
export default Page;
