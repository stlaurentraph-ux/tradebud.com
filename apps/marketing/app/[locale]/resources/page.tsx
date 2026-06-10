import { createDraftHubPage } from '@/lib/create-draft-page';
import { resourcesHub } from '@/lib/marketing-draft-content';

const { generateMetadata, Page } = createDraftHubPage(resourcesHub, '/resources');

export { generateMetadata };
export default Page;
