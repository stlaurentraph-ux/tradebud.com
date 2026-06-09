import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage('why-tracebud', '/why-tracebud');

export { generateMetadata };
export default Page;
