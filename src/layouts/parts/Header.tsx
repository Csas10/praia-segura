import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Visão geral', href: '/' },
  { label: 'Sobre', href: '/about' },
  { label: 'Documentação', href: '/docs' },
  { label: 'Contato', href: '/contact' },
  { label: 'Privacidade', href: '/privacy' },
  { label: 'Termos', href: '/terms' },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <Link to="/" className="brand" aria-label="Minha Praia Segura home">
          <span className="brand__mark">M</span>
          <span>Minha Praia Segura</span>
        </Link>

        <nav className="nav" aria-label="Menu principal">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn('nav__link', isActive && 'nav__link--active')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
