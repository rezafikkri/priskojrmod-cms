import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
} from 'vitest';
import {
  createTestimonial,
  updateTestimonial,
} from '@/lib/services/testimonial-service';
import { Language } from '@/constants/enums';

beforeAll(() => {
  vi.mock('server-only', () => ({}));

  vi.mock('@/lib/verifySession', () => ({
    default: vi.fn(),
  }));

  vi.mock('@/lib/pjme-prisma-client', () => ({
    default: {
      Testimonial: {
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    },
  }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('createTestimonial function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Testimonial.create function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(createTestimonial({
      name: 'Reza',
      sm_username: 'reza_id',
      picture: 'https://translat/img.jpg',
      message: {
        id: 'Pesan ID',
        en: 'Message EN',
      },
    })).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Testimonial.create).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Testimonial.create function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });
    pjmeDBPrismaClient.Testimonial.count.mockResolvedValue(2);

    await createTestimonial({
      name: 'Reza',
      sm_username: 'reza_id',
      picture: 'https://translat/img.jpg',
      message: {
        id: 'Pesan ID',
        en: 'Message EN',
      },
    });

    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    expect(pjmeDBPrismaClient.Testimonial.create).toHaveBeenCalledWith({
      data: {
        name: 'Reza',
        sm_username: 'reza_id',
        picture: 'https://translat/img.jpg',
        created_at: currentTime,
        updated_at: currentTime,
        translations: {
          create: [
            {
              language: Language.ID,
              message: 'Pesan ID',
            },
            {
              language: Language.EN,
              message: 'Message EN',
            },
          ],
        },
      },
      select: { id: true },
    });
  });
});

describe('updateTestimonial function', () => {
  it('Should call verifySession function, not call pjmeDBPrismaClient.Testimonial.update function and throw Error with "Unauthenticated" message', async () => {
    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue(false);

    await expect(updateTestimonial({
      id: 1,
      name: 'Reza',
      sm_username: 'reza_id',
      picture: 'https://translat/img.jpg',
      translationId: {
        id: 100,
        en: 200,
      },
      message: {
        id: 'Pesan ID',
        en: 'Message EN',
      },
    })).rejects.toThrow('Unauthenticated');

    expect(verifySession).toHaveBeenCalled();
    expect(pjmeDBPrismaClient.Testimonial.update).not.toHaveBeenCalled();
  });

  it('Should call pjmeDBPrismaClient.Testimonial.update function correctly', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1744853503149);

    const verifySession = (await import('@/lib/verifySession')).default;
    const pjmeDBPrismaClient = (await import('@/lib/pjme-prisma-client')).default;

    verifySession.mockResolvedValue({ isAuth: true, userId: 'user-id' });

    await updateTestimonial({
      id: 1,
      name: 'Reza',
      sm_username: 'reza_id',
      picture: 'https://translat/img.jpg',
      translationId: {
        id: 100,
        en: 200,
      },
      message: {
        id: 'Pesan ID',
        en: 'Message EN',
      },
    });

    expect(pjmeDBPrismaClient.Testimonial.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: 'Reza',
        sm_username: 'reza_id',
        picture: 'https://translat/img.jpg',
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        translations: {
          update: [
            {
              where: { id: 100 },
              data: { message: 'Pesan ID' },
            },
            {
              where: { id: 200 },
              data: { message: 'Message EN' },
            },
          ],
        },
      },
      select: { id: true },
    });
  });
});
