import React from 'react';
import { render, screen } from '@testing-library/react';
import UserBar from '@/components/layout/UserBar';

jest.mock('@/components/common/Container', () => {
  return function Container({ children }: any) {
    return <div data-testid="container">{children}</div>;
  };
});

jest.mock('@/components/layout/Logo', () => {
  return function Logo() {
    return <div data-testid="logo">Logo</div>;
  };
});

jest.mock('@/components/layout/UserBarNav', () => {
  return function UserBarNav() {
    return <nav data-testid="userbar-nav">Navigation</nav>;
  };
});

jest.mock('@/components/layout/UserBarMenu', () => {
  return function UserBarMenu() {
    return <menu data-testid="userbar-menu">Menu</menu>;
  };
});

describe('UserBar Component', () => {
  it('should render the UserBar component', () => {
    const { container } = render(<UserBar />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render the UserBarMenu', () => {
    render(<UserBar />);
    expect(screen.getByTestId('userbar-menu')).toBeInTheDocument();
  });

  it('should be hidden on mobile (lg:flex)', () => {
    const { container } = render(<UserBar />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('hidden');
    expect(header).toHaveClass('lg:flex');
  });

  it('should have border-bottom styling', () => {
    const { container } = render(<UserBar />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('border-b');
  });

  it('should accept and pass through user prop', () => {
    const user = { id: 'user-123', name: 'John Doe' };
    const { rerender } = render(<UserBar user={user} />);

    expect(screen.getByTestId('userbar-menu')).toBeInTheDocument();

    rerender(<UserBar user={undefined} />);
    expect(screen.getByTestId('userbar-menu')).toBeInTheDocument();
  });

  it('should position menu on the right (ml-auto)', () => {
    const { container } = render(<UserBar />);
    const menuContainer = container.querySelector('.ml-auto');
    expect(menuContainer).toBeInTheDocument();
  });
});
