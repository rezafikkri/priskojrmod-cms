import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import verifySession from '@/lib/verifySession';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

describe('verifySession function', () => {
  beforeAll(() => {
    vi.mock('next-auth', () => ({
      getServerSession: vi.fn(),
    }));

    vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
      authOptions: { test: 'value' },
    }));

    vi.mock('server-only', () => ({}));
  });

  afterEach(() => {
    // Clear mocks before each test to ensure test isolation
    vi.clearAllMocks();
  });

  it('Should call getServerSession correctly with authOptions and return false when getServerSession returns null', async () => {
    const { getServerSession } = await import('next-auth');
    getServerSession.mockResolvedValue(null);

    await expect(async () =>
      await verifySession()
    ).rejects.toThrow(UnauthenticatedError);

    expect(getServerSession).toHaveBeenCalledWith({ test: 'value' });
  });

  it('Should return object correctly when getServerSession returns a session object', async () => {
    const { getServerSession } = await import('next-auth');
    const mockSession = {
      user: {
        id: '123',
        role: 'staff',
        firstName: 'test',
        lastName: 'test',
        image: 'http://test.com/test.jpg',
        email: 'test@g.co',
      },
    };
    getServerSession.mockResolvedValue(mockSession);

    const result = await verifySession();

    expect(getServerSession).toHaveBeenCalled();
    expect(result).toEqual({
      userId: mockSession.user.id,
      userRole: mockSession.user.role,
      userFirstName: mockSession.user.firstName,
      userLastName: mockSession.user.lastName,
      userPicture: mockSession.user.image,
      userEmail: mockSession.user.email,
    });
  });
});
