import React from 'react';
import { render, screen } from '@testing-library/react';
import UserBarMenu from '@/components/layout/UserBarMenu';

jest.mock('next/link', () => {
  return function Link({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/components/common/Button', () => {
  return function Button({ children, ...props }: any) {
    return <button {...props}>{children}</button>;
  };
});

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

describe('UserBarMenu Component', () => {
  it('should render Sign In button when user is not provided', () => {
    render(<UserBarMenu />);

    const signInButton = screen.getByText('Sign In');
    expect(signInButton).toBeInTheDocument();
  });

  it('should render dropdown menu when user is provided', () => {
    const user = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={user} />);

    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
  });

  it('should render user avatar in dropdown trigger', () => {
    const user = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      image: 'avatar.png',
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={user} />);

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('should include Organisations link in main menu', () => {
    const user = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={user} />);

    const orgLink = screen.getByText('Organisations');
    expect(orgLink).toBeInTheDocument();
  });

  it('should include Developer link in account menu', () => {
    const user = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={user} />);

    const developerLink = screen.getByText('Developer');
    expect(developerLink).toBeInTheDocument();
  });

  it('should include Settings link in account menu', () => {
    const user = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={user} />);

    const settingsLink = screen.getByText('Settings');
    expect(settingsLink).toBeInTheDocument();
  });

  it('should show admin menu only for admin users', () => {
    const adminUser = {
      id: 'user-123',
      name: 'Admin User',
      email: 'admin@example.com',
      image: null,
      role: 'ADMIN' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={adminUser} />);

    const adminLabel = screen.getByText('Admin');
    expect(adminLabel).toBeInTheDocument();
  });

  it('should not show admin menu for non-admin users', () => {
    const customerUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={customerUser} />);

    const adminLabels = screen.queryAllByText('Admin');
    expect(adminLabels.length).toBe(0);
  });

  it('should render correct links with href attributes', () => {
    const user = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={user} />);

    expect(screen.getByText('Organisations').closest('a')).toHaveAttribute('href', '/orga');
    expect(screen.getByText('Developer').closest('a')).toHaveAttribute('href', '/account/developer');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/account/settings');
  });

  it('should use user name or email for avatar', () => {
    const userWithName = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={userWithName} />);

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-name', 'John Doe');
  });

  it('should use email when name is not available', () => {
    const userWithoutName = {
      id: 'user-123',
      name: null,
      email: 'john@example.com',
      image: null,
      role: 'CUSTOMER' as const,
      firstname: null,
      lastname: null,
      password: 'hashed',
      storageTier: 'FREE' as const,
      createdAt: new Date(),
    };

    render(<UserBarMenu user={userWithoutName} />);

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-name', 'john@example.com');
  });
});
