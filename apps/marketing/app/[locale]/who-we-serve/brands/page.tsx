import { createAudiencePage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createAudiencePage(
  'who-we-serve-brands',
  '/who-we-serve/brands',
  { hubHref: '/who-we-serve', hubLabel: 'Who We Serve' },
);

export { generateMetadata };
export default Page;
