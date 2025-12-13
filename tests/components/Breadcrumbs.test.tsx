import React from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from '@/components/common/Breadcrumbs';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href}>{children}</a>
  );
});

describe('Breadcrumbs Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render provided breadcrumb items', () => {
    const items = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings' },
    ];

    render(<Breadcrumbs items={items} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render null when no breadcrumbs are available', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');

    const { container } = render(<Breadcrumbs />);

    expect(container.firstChild).toBeNull();
  });

  it('should auto-generate breadcrumbs from /account/settings path', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/account/settings');

    render(<Breadcrumbs />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should auto-generate breadcrumbs from /account/developer path', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/account/developer');

    render(<Breadcrumbs />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('should auto-generate breadcrumbs from organisation path', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/orga/myorg/myproject');

    render(<Breadcrumbs />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('myorg')).toBeInTheDocument();
    expect(screen.getByText('myproject')).toBeInTheDocument();
  });

  it('should auto-generate breadcrumbs from organisation resource path', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/orga/myorg/myproject/myresource');

    render(<Breadcrumbs />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('myorg')).toBeInTheDocument();
    expect(screen.getByText('myproject')).toBeInTheDocument();
    expect(screen.getByText('myresource')).toBeInTheDocument();
  });

  it('should make last breadcrumb non-clickable', () => {
    const items = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings' },
    ];

    render(<Breadcrumbs items={items} />);

    const settingsElement = screen.getByText('Settings');
    expect(settingsElement.tagName).not.toBe('A');
  });

  it('should make intermediate breadcrumbs clickable', () => {
    const items = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', href: '/settings' },
      { label: 'Profile' },
    ];

    render(<Breadcrumbs items={items} />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('should include arrow separators between items', () => {
    const items = [
      { label: 'Home' },
      { label: 'Products' },
    ];

    const { container } = render(<Breadcrumbs items={items} />);

    const arrowElements = container.querySelectorAll('svg');
    expect(arrowElements.length).toBeGreaterThan(0);
  });
});
