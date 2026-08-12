import type { ReactNode } from 'react';

export default function Website({ children }: { children: ReactNode }) {
  return <div className="site-shell">{children}</div>;
}
