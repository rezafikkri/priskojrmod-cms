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

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Feedback: {
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
  it('Should call verifySession function, not call pjmeDBPrismaClient.Feedback.deleteMany function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(deleteFeedbacks([
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ])).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Feedback.deleteMany).not.toHaveBeenCalled();
  });
  
  it('Should call pjmeDBPrismaClient.Feedback.deleteMany function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await deleteFeedbacks([
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ]);

    expect(pjmeDBPrismaClient.Feedback.deleteMany).toHaveBeenCalledWith({
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
  it('Should call verifySession function, not call pjmeDBPrismaClient.Feedback.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateFeedbackReadStatus(
      '550e8400-e29b-41d4-a716-446655440002',
      true
    )).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Feedback.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Feedback.update function correctly', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await updateFeedbackReadStatus(
      '550e8400-e29b-41d4-a716-446655440002',
      true
    );

    expect(pjmeDBPrismaClient.Feedback.update).toHaveBeenCalledWith({
      where: { id: '550e8400-e29b-41d4-a716-446655440002' },
      data: { is_read: true },
      select: { id: true },
    });
  });
});
