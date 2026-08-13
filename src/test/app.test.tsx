import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import HomePage from '../pages';
import PrivacyPage from '../pages/privacy';

describe('Minha Praia Segura', () => {
  it('renders the landing page hero', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Plataforma de apoio à segurança costeira em desenvolvimento/i)).toBeInTheDocument();
  });

  it('renders the privacy policy page', () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Política de Privacidade/i })).toBeInTheDocument();
  });
});
