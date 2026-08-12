import { createBrowserRouter, Outlet } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import { routes } from './routes';

export const router = createBrowserRouter([
  {
    element: (
      <RootLayout>
        <Outlet />
      </RootLayout>
    ),
    children: routes,
  },
]);
