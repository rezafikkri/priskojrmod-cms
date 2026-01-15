import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  deleteFeedbacks,
  updateFeedbackReadStatus,
} from '@/lib/services/feedback-service';
import UnauthenticatedError from '@/lib/errors/UnauthenticatedError';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/prisma', () => ({
    default: {
      feedback: {
        deleteMany: vi.fn(),
        update: vi.fn(),
      },
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('deleteFeedbacks function', () => {
  it('Should call verifySession function, not call prisma.feedback.deleteMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteFeedbacks([
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ])).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.feedback.deleteMany).not.toHaveBeenCalled();
  });
  
  it('Should call prisma.feedback.deleteMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await deleteFeedbacks([
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ]);

    expect(prisma.feedback.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [
            '550e8400-e29b-41d4-a716-446655440000',
            '550e8400-e29b-41d4-a716-446655440001',
          ],
        },
      },
    });
  });
});

describe('updateFeedbackReadStatus function', () => {
  it('Should call verifySession function, not call prisma.feedback.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateFeedbackReadStatus(
      '550e8400-e29b-41d4-a716-446655440002',
      true
    )).rejects.toThrow(UnauthenticatedError);

    expect(verifySession).toHaveBeenCalled();
    expect(prisma.feedback.update).not.toHaveBeenCalled();
  });

  it('Should call prisma.feedback.update function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const prisma = (await import('@/lib/prisma')).default;

    verifySession.mockResolvedValue({ userId: 1 });

    await updateFeedbackReadStatus(
      '550e8400-e29b-41d4-a716-446655440002',
      true
    );

    expect(prisma.feedback.update).toHaveBeenCalledWith({
      where: { id: '550e8400-e29b-41d4-a716-446655440002' },
      data: { isRead: true },
      select: { id: true },
    });
  });
});
