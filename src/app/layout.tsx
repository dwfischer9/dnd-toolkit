import type { Metadata } from 'next';
import './globals.css';
import LocaleProvider from './LocaleProvider';

export const metadata: Metadata = {
  title: {
    default: 'DND Toolkit',
    template: '%s · DND Toolkit',
  },
  description:
    'A focused combat console for tracking initiative, health, and encounter difficulty.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
