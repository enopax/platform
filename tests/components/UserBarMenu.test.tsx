import React from 'react';
import { render, screen } from '@testing-library/react';
import UserBarMenu from '@/components/layout/UserBarMenu';

jest.mock('next/link', () => {
  return function Link({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/components/common/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/common/Avatar', () => {
  return function Avatar({ name, image, size }: any) {
    return <div data-testid="avatar" data-name={name}>{name}</div>;
  };
});

jest.mock('@/components/menu/DropdownMenu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <button data-testid="dropdown-trigger">{children}</button>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div data-testid="dropdown-label">{children}</div>,
  DropdownMenuGroup: ({ children }: any) => <div data-testid="dropdown-group">{children}</div>,
  DropdownMenuItem: ({ children }: any) => <div data-testid="dropdown-item">{children}</div>,
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
}));

jest.mock('@/lib/auth', () => ({
  signOut: jest.fn(),
}));

const baseUser = {
  id: 'user-123',
  name: 'John Doe' as string | null,
  email: 'john@example.com',
  image: null as string | null,
  role: 'CUSTOMER' as const,
  firstname: null as string | null,
  lastname: null as string | null,
  password: 'hashed',
  slug: 'john-doe',
  storageTier: 'FREE_500MB' as const,
  emailVerified: null as Date | null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserBarMenu Component', () => {
  it('should render Sign In button when user is not provided', () => {
    render(<UserBarMenu />);

    const signInButton = screen.getByText('Sign In');
    expect(signInButton).toBeInTheDocument();
  });

  it('should render dropdown menu when user is provided', () => {
    render(<UserBarMenu user={baseUser} />);

    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
  });

  it('should render user avatar in dropdown trigger', () => {
    render(<UserBarMenu user={{ ...baseUser, image: 'avatar.png' }} />);

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('should include Organisations link in main menu', () => {
    render(<UserBarMenu user={baseUser} />);

    const orgLink = screen.getByText('Organisations');
    expect(orgLink).toBeInTheDocument();
  });

  it('should include Developer link in account menu', () => {
    render(<UserBarMenu user={baseUser} />);

    const developerLink = screen.getByText('Developer');
    expect(developerLink).toBeInTheDocument();
  });

  it('should include Settings link in account menu', () => {
    render(<UserBarMenu user={baseUser} />);

    const settingsLink = screen.getByText('Settings');
    expect(settingsLink).toBeInTheDocument();
  });

  it('should show admin menu only for admin users', () => {
    render(<UserBarMenu user={{ ...baseUser, role: 'ADMIN', name: 'Admin User', email: 'admin@example.com' }} />);

    const adminLabel = screen.getByText('Admin');
    expect(adminLabel).toBeInTheDocument();
  });

  it('should not show admin menu for non-admin users', () => {
    render(<UserBarMenu user={baseUser} />);

    const adminLabels = screen.queryAllByText('Admin');
    expect(adminLabels.length).toBe(0);
  });

  it('should render correct links with href attributes', () => {
    render(<UserBarMenu user={baseUser} />);

    expect(screen.getByText('Organisations').closest('a')).toHaveAttribute('href', '/orga');
    expect(screen.getByText('Developer').closest('a')).toHaveAttribute('href', '/account/developer');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/account/settings');
  });

  it('should use user name or email for avatar', () => {
    render(<UserBarMenu user={baseUser} />);

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-name', 'John Doe');
  });

  it('should use email when name is not available', () => {
    render(<UserBarMenu user={{ ...baseUser, name: null }} />);

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-name', 'john@example.com');
  });

  it('should link avatar to user profile when slug is set', () => {
    render(<UserBarMenu user={baseUser} />);

    const avatarLink = screen.getByTestId('avatar').closest('a');
    expect(avatarLink).toHaveAttribute('href', '/john-doe');
  });

  it('should link avatar to account settings when slug is empty', () => {
    render(<UserBarMenu user={{ ...baseUser, slug: '' }} />);

    const avatarLink = screen.getByTestId('avatar').closest('a');
    expect(avatarLink).toHaveAttribute('href', '/account/settings');
  });
});
