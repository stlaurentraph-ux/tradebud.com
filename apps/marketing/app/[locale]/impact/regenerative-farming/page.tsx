import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-regenerative-farming',
  '/impact/regenerative-farming',
);

export { generateMetadata };
export default Page;
