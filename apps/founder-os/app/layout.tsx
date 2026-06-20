import type { Metadata } from 'next';
import './globals.css';
import { FounderOsShell } from '@/components/layout/founder-os-shell';
export const metadata: Metadata={title:'Founder OS | Tracebud',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return(<html lang="en"><body className="font-sans antialiased"><FounderOsShell>{children}</FounderOsShell></body></html>);}
