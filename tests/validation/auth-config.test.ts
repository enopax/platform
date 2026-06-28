import authConfig from '@/lib/auth.config';

type Session = { user?: unknown } | null;

function isAuthorized(pathname: string, session: Session): boolean {
  const authorized = authConfig.callbacks!.authorized!;
  return authorized({
    auth: session,
    request: { nextUrl: new URL(`https://enopax.com${pathname}`) },
  } as never) as boolean;
}

describe('auth.config authorized callback', () => {
  const loggedIn: Session = { user: { id: 'u1' } };
  const anonymous: Session = null;

  describe('public paths are reachable without a session', () => {
    const publicPaths = [
      '/',
      '/signin',
      '/register',
      '/accept-invite',
      '/docs/imprint',
      '/api/auth',
      '/api/email',
    ];

    it.each(publicPaths)('allows %s for anonymous users', (path) => {
      expect(isAuthorized(path, anonymous)).toBe(true);
    });
  });

  it('keeps the imprint legal page public (no login wall)', () => {
    expect(isAuthorized('/docs/imprint', anonymous)).toBe(true);
  });

  it('still protects other docs pages', () => {
    expect(isAuthorized('/docs/api', anonymous)).toBe(false);
    expect(isAuthorized('/docs/api', loggedIn)).toBe(true);
  });

  it('protects application routes for anonymous users', () => {
    expect(isAuthorized('/orga/acme', anonymous)).toBe(false);
    expect(isAuthorized('/account', anonymous)).toBe(false);
  });

  it('allows protected routes for logged-in users', () => {
    expect(isAuthorized('/orga/acme', loggedIn)).toBe(true);
  });
});
