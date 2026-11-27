import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mc-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="mc-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="mc-page-actions">{actions}</div>}
    </header>
  );
}
