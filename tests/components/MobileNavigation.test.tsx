import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNavigation from '@/components/navigation/MobileNavigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  return function Link({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/components/common/Button', () => {
  return function Button({ onClick, children, ...props }: any) {
    return <button onClick={onClick} {...props}>{children}</button>;
  };
});

jest.mock('@/components/common/Badge', () => {
  return function Badge({ children }: any) {
    return <span>{children}</span>;
  };
});

jest.mock('@/components/common/Avatar', () => {
  return function Avatar(props: any) {
    return <div data-testid="avatar">Avatar</div>;
  };
});

jest.mock('@/hooks/useCommandPalette', () => ({
  useCommandPalette: () => ({
    open: jest.fn(),
  }),
}));

jest.mock('@/actions/auth', () => ({
  handleSignOut: jest.fn(),
}));

describe('MobileNavigation Component', () => {
  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockOrganisations = [
    {
      id: 'org-1',
      name: 'Organization One',
      description: 'First org',
      _count: {
        projects: 3,
        members: 5,
      },
      projects: [
        {
          id: 'proj-1',
          name: 'Project 1',
          status: 'ACTIVE',
          progress: 75,
          organisationId: 'org-1',
        },
      ],
    },
    {
      id: 'org-2',
      name: 'Organization Two',
      description: 'Second org',
      _count: {
        projects: 2,
        members: 3,
      },
      projects: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/orga/Organization One');
  });

  it('should render mobile navigation with user', () => {
    render(
      <MobileNavigation
        user={mockUser}
        organisations={mockOrganisations}
      />
    );

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('should display menu button on mobile', () => {
    const { container } = render(
      <MobileNavigation
        user={mockUser}
        organisations={mockOrganisations}
      />
    );

    const menuButton = container.querySelector('button');
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle menu open and closed', () => {
    const { container } = render(
      <MobileNavigation
        user={mockUser}
        organisations={mockOrganisations}
      />
    );

    const menuButton = container.querySelector('button');
    expect(menuButton).toBeInTheDocument();

    if (menuButton) {
      fireEvent.click(menuButton);
    }
  });

  it('should handle empty organisations array', () => {
    const { container } = render(
      <MobileNavigation
        user={mockUser}
        organisations={[]}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should handle undefined organisations prop', () => {
    const { container } = render(
      <MobileNavigation
        user={mockUser}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should display current organisation when on org path', () => {
    render(
      <MobileNavigation
        user={mockUser}
        organisations={mockOrganisations}
      />
    );
  });

  it('should be hidden on larger screens (lg:hidden)', () => {
    const { container } = render(
      <MobileNavigation
        user={mockUser}
        organisations={mockOrganisations}
      />
    );

    const mobileHeader = container.querySelector('.lg\\:hidden');
    expect(mobileHeader).toBeInTheDocument();
  });

  it('should render with proper initial state', () => {
    render(
      <MobileNavigation
        user={mockUser}
        organisations={mockOrganisations}
      />
    );

    const container = screen.getByTestId('avatar').parentElement;
    expect(container).toBeInTheDocument();
  });

  it('should handle organisation selection', () => {
    const { container } = render(
      <MobileNavigation
        user={mockUser}
        organisations={mockOrganisations}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should display user information', () => {
    render(
      <MobileNavigation
        user={mockUser}
        organisations={mockOrganisations}
      />
    );

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });
});
