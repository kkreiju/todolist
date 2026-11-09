import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daymark — make room for what matters',
  description: 'A calmer space to collect your thoughts and make progress.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
