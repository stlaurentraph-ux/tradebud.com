import { createDraftHubPage } from '@/lib/create-draft-page';
import { solutionsHub } from '@/lib/marketing-draft-content';

const { generateMetadata, Page } = createDraftHubPage(solutionsHub, '/solutions');

export { generateMetadata };
export default Page;
