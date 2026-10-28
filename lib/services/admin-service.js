import 'server-only';

import prisma from '../prisma';
import verifySession from '../verifySession';
import UnknownError from '../errors/UnknownError';
import NotAllowedError from '../errors/NotAllowedError';
import DuplicateError from '../errors/DuplicateError';
import NotFoundError from '../errors/NotFoundError';
import { generateNameIdentifierLabel, getUnixTimestamp } from '../utils';
import parsePhoneNumber from 'libphonenumber-js';
import { createAdminSchema, adminIdSchema, editAdminSchema } from '../validators/admin-validator';
import { UserRole } from '@/constants/enums';
import { revalidatePath } from 'next/cache';
import { getPhoneNumberE164 } from '../utils';
import { logUnauthorizedAccess } from '../logger';
import { hasAccess, requireAccess } from '../authorization';

export async function getAdmins() {
  const session = await verifySession();

  if (!hasAccess(session.userRole, UserRole.OWNER)) {
    logUnauthorizedAccess(session.userId);
    return [];
  }

  try {
    const admins = await prisma.admin.findMany({
      where: { id: { not: session.userId } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return admins.map(({ firstName, lastName, email, ...rest }) => {
      rest.name = `${firstName} ${lastName}`;
      rest.email = email;
      return rest;
    });
  } catch (error) {
    console.error(error);
    throw new UnknownError();
  }
}

export async function getSelectableAdmins(requireAuthorization = true) {
  const session = await verifySession();

  if (requireAuthorization && !hasAccess(session.userRole, UserRole.OWNER)) {
    logUnauthorizedAccess(session.userId);
    return [];
  }

  try {
    const admins = await prisma.admin.findMany({
      where: { id: { not: session.userId } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' },
      ],
    });

    const mappedAdmins = admins.map(({ firstName, lastName, email, ...rest }) => {
      rest.displayLabel = generateNameIdentifierLabel(firstName, lastName, email);
      return rest;
    });
    mappedAdmins.unshift({
      id: session.userId,
      displayLabel: 'Myself',
    });
    return mappedAdmins;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function createAdmin({
  firstName,
  lastName,
  email,
  whatsappPhoneNumber,
  picture,
}) {
  const session = await verifySession();

  // Must admin with role owner
  requireAccess(session.userRole, UserRole.OWNER);

  try {
    const parsedData = createAdminSchema.parse({
      firstName,
      lastName,
      email,
      whatsappPhoneNumber,
      picture,
    });

    const countryIso = parsedData.whatsappPhoneNumber.countryIso;
    const number = parsedData.whatsappPhoneNumber.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const currentTime = getUnixTimestamp();
    const createData = {
      role: 'staff',
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      email: parsedData.email,
      whatsappPhoneNumber: numberE164,
      picture: parsedData.picture,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/admin');
    revalidatePath('/product/new');

    return await prisma.admin.create({
      data: createData,
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      throw new DuplicateError('Admin cannot be created because the email address is already in use.');
    }

    console.error(err);
    throw new UnknownError();
  }
}

export async function getAdmin(id) {
  const session = await verifySession();

  if (!hasAccess(session.userRole, UserRole.OWNER)) {
    logUnauthorizedAccess(session.userId);
    return null;
  }

  const idResult = adminIdSchema.safeParse(id);
  if (!idResult.success) return null;
  const parsedId = idResult.data;

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        whatsappPhoneNumber: true,
        picture: true,
        role: true,
      },
    });

    if (admin) {
      // mapping whatsapp phone number
      const countryIso = parsePhoneNumber(admin.whatsappPhoneNumber, { extract: false }).country;
      admin.whatsappPhoneNumber = {
        countryIso: countryIso,
        number: admin.whatsappPhoneNumber,
      };
    }

    return admin;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function updateAdmin({
  id,
  firstName,
  lastName,
  whatsappPhoneNumber,
  picture,
}) {
  const session = await verifySession();

  // Must admin with role owner
  requireAccess(session.userRole, UserRole.OWNER);

  try {
    const parsedData = editAdminSchema.parse({
      id,
      firstName,
      lastName,
      whatsappPhoneNumber,
      picture,
    });

    const countryIso = parsedData.whatsappPhoneNumber.countryIso;
    const number = parsedData.whatsappPhoneNumber.number;
    const numberE164 = getPhoneNumberE164(countryIso, number);

    const currentTime = getUnixTimestamp();

    // build nested writes for update/create
    const updateData = {
      firstName: parsedData.firstName,
      lastName: parsedData.lastName,
      whatsappPhoneNumber: numberE164,
      picture: parsedData.picture,
      updatedAt: currentTime,
    };

    let result = await prisma.admin.update({
      where: { id: parsedData.id },
      data: updateData,
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/admin');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function deleteAdmin(id) {
  const session = await verifySession();

  // Must admin with role owner
  requireAccess(session.userRole, UserRole.OWNER);

  try {
    const parsedId = adminIdSchema.parse(id);

    // delete admin but never allow deleting an owner
    const result = await prisma.admin.delete({
      where: {
        id: parsedId,
        role: { not: UserRole.OWNER },
      },
      select: { id: true },
    });

    // revalidate Router cache, Data cache and Full Route cache
    revalidatePath('/admin');
    revalidatePath('/product/new');

    return result;
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError') {
      if (err.code === 'P2025') {
        throw new NotFoundError('Failed to delete the admin because it was not found. Please reload the page and try again.');
      }

      if (err.code === 'P2003') {
        throw new NotAllowedError('Admin cannot be deleted because there are still products assigned to this admin. Please reassign the products to another admin first.');
      }
    }

    console.error(err);
    throw new UnknownError();
  }
}
