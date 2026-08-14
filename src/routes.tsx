import type { RouteObject } from 'react-router-dom';
import HomePage from './pages';
import AboutPage from './pages/about';
import ContactPage from './pages/contact';
import DocsPage from './pages/docs';
import NotFoundPage from './pages/_404';
import PrivacyPage from './pages/privacy';
import TermsPage from './pages/terms';

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/docs', element: <DocsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '*', element: <NotFoundPage /> },
];
