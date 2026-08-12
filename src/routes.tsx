import type { RouteObject } from 'react-router-dom';
import HomePage from './pages';
import NotFoundPage from './pages/_404';
import PrivacyPage from './pages/privacy';
import TermsPage from './pages/terms';
import AgentsPage from './pages/agents';

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/agents', element: <AgentsPage /> },
  { path: '*', element: <NotFoundPage /> },
];
