import { Playfair_Display, Jost } from 'next/font/google';
import '@/styles/globals.css';

export const metadata = {
  title: 'Glam & Fab Salon – Luxury Unisex Salon',
  description:
    'Glam & Fab Salon — Award-winning luxury unisex salon. Book bridal makeup, hair styling, nail art, skin treatments & more.',
  openGraph: {
    type: 'website',
    title: 'Glam & Fab Salon – Luxury Unisex Salon',
    description:
      'Award-winning luxury salon. Bridal packages, hair styling, nail art & skin treatments. Book your session today!',
    images: [{ url: '/assets/images/slideshow-1.png', width: 1200, height: 630 }],
    url: 'https://glamandfab.in',
    siteName: 'Glam & Fab Salon',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glam & Fab Salon',
    description: 'Luxury unisex salon. Book your transformation today!',
    images: ['/assets/images/slideshow-1.png'],
  },
};

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '700'],
});

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
  weight: ['300', '400', '500'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jost.variable}`}>
      <head>
        <meta name="theme-color" content="#d9a755" />
        <link rel="preload" as="image" href="/assets/images/slideshow-1.png" />
        <link rel="preload" as="image" href="/assets/images/slideshow-2.jpeg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
