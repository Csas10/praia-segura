import type { ReactNode } from 'react';
import CookieConsent from '../components/CookieConsent';
import Footer from './parts/Footer';
import Header from './parts/Header';
import Website from './Website';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <Website>
      <Header />
      <main>{children}</main>
      <CookieConsent />
      <Footer />
    </Website>
  );
}
