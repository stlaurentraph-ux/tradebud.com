import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'solutions-eudr-compliance',
  '/solutions/eudr-compliance',
);

export { generateMetadata };
export default Page;
