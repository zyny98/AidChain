import type { Metadata, Viewport } from 'next';
// Bundled fonts: Display (Unbounded), Body (Onest), Mono (JetBrains Mono)
import '@fontsource-variable/unbounded';
import '@fontsource-variable/onest';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import { PhantomWalletProvider } from '@/hooks/usePhantomWallet';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://aidchain.io'),
  title: 'AidChain - целевая гуманитарная помощь на смарт-контрактах',
  description:
    'Протокол целевой гуманитарной помощи: деньги блокируются в смарт-контракте и выходят траншами только по проверенному чеку. Прозрачный путь каждого перевода.',
  keywords: ['гуманитарная помощь', 'смарт-контракты', 'блокчейн', 'эскроу', 'AI оракул', 'прозрачность благотворительности'],
  authors: [{ name: 'AidChain Protocol' }],
  openGraph: {
    title: 'AidChain - целевая гуманитарная помощь на смарт-контрактах',
    description:
      'Деньги лежат в смарт-контракте и выходят траншами только по проверенному чеку. Никаких растрат.',
    url: 'https://aidchain.io',
    siteName: 'AidChain',
    images: [
      {
        url: '/frames_hd/frame_0001.jpg',
        width: 1200,
        height: 630,
        alt: 'AidChain Protocol',
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AidChain - целевая гуманитарная помощь на смарт-контрактах',
    description:
      'Деньги лежат в смарт-контракте и выходят траншами только по проверенному чеку.',
    images: ['/frames_hd/frame_0001.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="bg-ink text-paper">
      <body className="min-h-screen bg-ink font-sans text-paper antialiased overflow-x-hidden selection:bg-signal selection:text-ink">
        <LanguageProvider>
          <PhantomWalletProvider>
            {children}
          </PhantomWalletProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
