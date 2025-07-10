import 'server-only';

import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotFoundError from '../errors/NotFoundError';
import pjmeDBPrismaClient from '../pjme-prisma-client';
import { mapTranslationsToObject } from '../utils';
import { Language } from '@/constants/enums';
import { createLicenseSchema, editLicenseSchema, licenseIdSchema } from '../validators/license-validator';

export async function createLicense({
  name,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = createLicenseSchema.parse({ name, content });
    const currentTime = BigInt(Math.floor(new Date().getTime() / 1000));
    return await pjmeDBPrismaClient.License.create({
      data: {
        created_at: currentTime,
        updated_at: currentTime,
        translations: {
          create: [
            { language: Language.ID, name: parsedData.name.id, content: parsedData.content.id },
            { language: Language.EN, name: parsedData.name.en, content: parsedData.content.en },
          ],
        },
      },
      select: { id: true },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function getLicenses(select) {
  try {
    const licenses = await pjmeDBPrismaClient.License.findMany({
      select,
      orderBy: { updated_at: 'desc' },
    });
    return licenses.map(license => ({
      ...license,
      created_at: license.created_at.toString(),
      updated_at: license.updated_at.toString(),
      translations: mapTranslationsToObject(license.translations),
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function getLicensesWithTranslation() {
  try {
    return await pjmeDBPrismaClient.$queryRaw`
      SELECT l.id, lt.name FROM licenses as l
      JOIN license_translations as lt ON l.id = lt.license_id
      WHERE lt.language = 'en'
      ORDER BY l.updated_at DESC
    `;
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function getLicense(id) {
  const idResult = licenseIdSchema.safeParse(id);
  if(!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const license = await pjmeDBPrismaClient.License.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        translations: {
          select: {
            id: true,
            language: true,
            name: true,
            content: true,
          },
        },
      },
    });
    if (license) {
      license.translations = mapTranslationsToObject(license.translations);
    }
    return license;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateLicense({
  id,
  translationId,
  name,
  content,
}) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = editLicenseSchema.parse({
      id,
      translationId,
      name,
      content,
    });
    return await pjmeDBPrismaClient.License.update({
      where: { id: parsedData.id },
      data: {
        updated_at: BigInt(Math.floor(new Date().getTime() / 1000)),
        translations: {
          update: [
            {
              data: { language: Language.ID, name: parsedData.name.id, content: parsedData.content.id },
              where: { id: parsedData.translationId.id },
            },
            {
              data: { language: Language.EN, name: parsedData.name.en, content: parsedData.content.en },
              where: { id: parsedData.translationId.en },
            },
          ],
        },
      },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('License not found.');
    }

    console.error(err);
    throw new UnknownError();   
  }
}

export async function deleteLicense(id) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedId = licenseIdSchema.parse(id);
    return await pjmeDBPrismaClient.License.delete({
      where: { id: parsedId },
      select: { id: true },
    });
  } catch (err) {
     if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('License not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();   
  }
}
