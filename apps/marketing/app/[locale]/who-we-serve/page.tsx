import { createDraftHubPage } from '@/lib/create-draft-page';
import { whoWeServeHub } from '@/lib/marketing-draft-content';

const { generateMetadata, Page } = createDraftHubPage(whoWeServeHub, '/who-we-serve');

export { generateMetadata };
export default Page;
