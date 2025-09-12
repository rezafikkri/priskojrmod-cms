import cryptoRandomString from 'crypto-random-string';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export function generateDocumentCode(type) {
  const randomString = cryptoRandomString({
    length: 6,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  });
  const date = dayjs.utc().format('YYYYMMDD');
  return `PJM-${type}-${date}-${randomString}`;
}
