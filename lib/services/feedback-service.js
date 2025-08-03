import 'server-only';

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import UnknownError from '../errors/UnknownError';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import pjmeDBPrismaClient from '../pjme-prisma-client';
import { feedbackIdsSchema, filtersSchema, updateFeedbackReadStatusSchema } from '../validators/feedback-validator';
import verifySession from '../verifySession';
import NotFoundError from '../errors/NotFoundError';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

async function batchDeleteSheetRows({ auth, spreadsheetId, sheetId, rowLength }) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

  /*
   * why endIndex + 1? because enIndex is exclusive, that mean, endIndex will not be deleted
   * so, when you want to delete index 1 to index 10, endIndex must be 11.
  */ 
  const requestBody = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: 1,
            endIndex: rowLength + 1, 
          },
        },
      },
    ],
  };

  try {
    await auth.fetch(url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      data: requestBody,
    });

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function pullFeedbacks() {
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const spreadsheetIndo = new GoogleSpreadsheet('1xfvsWxTl9CAaqRnWczAk8JqSPEZHM00JRnFHcfim0o4', auth);
    const spreadsheetEn = new GoogleSpreadsheet('1GZDJQoa8mXDobD7D4e7pu95AHdkma3LQe68NVHAZ-uc', auth);

    await spreadsheetIndo.loadInfo();
    await spreadsheetEn.loadInfo();

    const sheetIndo = spreadsheetIndo.sheetsByIndex[0];
    const sheetEn = spreadsheetEn.sheetsByIndex[0];

    const rowsIndo = await sheetIndo.getRows();
    const rowsEn = await sheetEn.getRows();

    // merge the rowsIndo and rowsEn
    const createData = [];

    for (const row of rowsIndo) {
      // format 7/30/2025 15:52:18 = M/D/YYYY H:m:s.
      // Why need use .tz too, while timestamp from google sheet is in utc?
      // because, dayjs will be use timezone local in computer, when we not use .tz,
      // and we know that local timezone is not fixed, can utc or other timezone, therefor we need
      // to use .tz, for confirm this is utc.
      const timestamp = BigInt(dayjs.tz(row.get('Timestamp'), 'M/D/YYYY H:m:s', 'UTC').unix());
      const data = {
        message: row.get('Pesan'),
        created_at: timestamp,
        updated_at: timestamp,
      };
      if (row.get('Email')) data.email = row.get('Email');
      if (row.get('Nama')) data.name = row.get('Nama');
      createData.push(data);
    }

    for (const row of rowsEn) {
      const timestamp = BigInt(dayjs.tz(row.get('Timestamp'), 'M/D/YYYY H:m:s', 'UTC').unix());
      const data = {
        message: row.get('Message'),
        created_at: timestamp,
        updated_at: timestamp,
      };
      if (row.get('Email')) data.email = row.get('Email');
      if (row.get('Name')) data.name = row.get('Name');
      createData.push(data);
    }

    let result;
    if (createData.length) {
      result = await pjmeDBPrismaClient.Feedback.createMany({
        data: createData,
        skipDuplicates: true,
      });
    }

    if (rowsIndo.length) {
      await batchDeleteSheetRows({
        auth,
        spreadsheetId: spreadsheetIndo.spreadsheetId,
        sheetId: sheetIndo.sheetId,
        rowLength: rowsIndo.length,
      });
    }
    if (rowsEn.length) {
      await batchDeleteSheetRows({
        auth,
        spreadsheetId: spreadsheetEn.spreadsheetId,
        sheetId: sheetEn.sheetId,
        rowLength: rowsEn.length,
      });
    }

    return result ?? { count: 0 };
  } catch (err) {
    console.error(err);
    throw new UnknownError();
  }
}

export async function getFeedbacks(filters) {
  try {
    const parsedFilters = filtersSchema.parse(filters);
    const feedbacks = await pjmeDBPrismaClient.Feedback.findMany({
      orderBy: {
        created_at: 'desc',
      },
      where: parsedFilters,
    });
    return feedbacks.map((feedback) => ({
      ...feedback,
      created_at: feedback.created_at.toString(),
      updated_at: feedback.updated_at.toString(),
      user_info: feedback.name ?? feedback.email,
    }));
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function deleteFeedbacks(ids) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedIds = feedbackIdsSchema.parse(ids);
    return await pjmeDBPrismaClient.Feedback.deleteMany({
      where: {
        id: { in: parsedIds },
      },
    });
  } catch (err) {
    console.error(err);
    throw new UnknownError();   
  }
}

export async function updateFeedbackReadStatus(id, is_read) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthenticated');

  try {
    const parsedData = updateFeedbackReadStatusSchema.parse({
      id,
      is_read,
    });
    return await pjmeDBPrismaClient.Feedback.update({
      where: { id: parsedData.id },
      data: { is_read: parsedData.is_read },
      select: { id: true },
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
      throw new NotFoundError('Feedback not found, please reload the page and try again.');
    }

    console.error(err);
    throw new UnknownError();
  }
}
