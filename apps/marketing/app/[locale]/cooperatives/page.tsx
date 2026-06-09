import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('cooperatives', '/cooperatives');

export { generateMetadata };
export default Page;
