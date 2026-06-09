import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('sponsors', '/sponsors');

export { generateMetadata };
export default Page;
