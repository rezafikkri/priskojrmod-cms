import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { passwordSchema } from './validators/base-validator';
import cryptoRandomString from 'crypto-random-string';
import { CurrencyCode } from '@/constants/enums';
import { TransactionStatus } from '@/constants/enums';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// get phoneNumbers from sign in with google feature
export function getPhoneNumber(phoneNumbers) {
  if (!phoneNumbers) return null;

  let phoneNumber = null;

  for (const pn of phoneNumbers) {
    if (pn.metadata.verified) {
      phoneNumber = pn.canonicalForm;
      break;
    }
  }

  return phoneNumber;
}

export function generateBreadcrumb(pathname) {
  // if pathname is '/'
  if (pathname === '/') return [{ breadCrumb: 'Dashboard' }];

  const pathnames = pathname.substring(1).split('/');
  // if page is edit page
  if (/edit|regenerate|details/.test(pathname)) pathnames.splice(1, 1);

  return pathnames.map((path, i) => {
    let newPath = { path: '/' + path };

    // uppercase each first letter of word
    if (/-/.test(path)) {
      let paths = path.split('-');
      newPath.breadCrumb = paths.map(p => {
        const firstLetter = p[0].toUpperCase();
        return firstLetter + p.substring(1);
      }).join(' ');
    } else {
      newPath.breadCrumb = path[0].toUpperCase() + path.substring(1);
    }

    // if last path, then return directly only breadCrumb without original path
    if (i === pathnames.length - 1) {
      delete newPath.path;
      return newPath;
    }
    return newPath;
  });
}

export const bigIntJsonReplacer = (_, value) => (typeof value === 'bigint' ? value.toString() : value);

export function generatePageInfo({
  pageIndex,
  totalDataPerPage,
  totalData,
  searchKey,
}) {
  if (totalDataPerPage < 1) return null;

  let resultLabel = 'results';
  if (totalDataPerPage === 1) resultLabel = 'result';

  if (searchKey) {
    return `${totalDataPerPage} ${resultLabel}`;
  }

  // start and end data for each page
  let startData = (pageIndex * process.env.NEXT_PUBLIC_PAGE_SIZE) + 1;
  let endData = (startData - 1) + totalDataPerPage;

  if (startData === 1 && endData === 1) {
    return `1 ${resultLabel}`;
  }
  return `${startData}-${endData} of ${totalData} ${resultLabel}`;
}

export function isLastPage({ pageIndex, pageSize, rowCount }) {
  return pageIndex + 1 === Math.ceil(rowCount/pageSize);
}

/**
 * Transforms an array of translations into an object
 *
 * Example input:
 * [
 *   { id: 1, language: 'en', title: 'Hello', content: 'Welcome' },
 *   { id: 2, language: 'id', title: 'Halo', content: 'Selamat datang' }
 * ]
 *
 * Output:
 * {
 *   id: { id: 1, en: 2 },
 *   title: { id: 'Halo', en: 'Hello' },
 *   content: { id: 'Selamat datang', en: 'Welcome' }
 * }
 */
export function mapTranslationsToObject(translations) {
  let result = {};
  for (const translation of translations) {
    const { language, ...properties } = translation;

    for (const [key, value] of Object.entries(properties)) {
      if (result[key]) {
        result[key] = {
          ...result[key],
          [language]: value,
        };
      } else {
        result = {
          ...result,
          [key]: { [language]: value },
        };
      }
    }
  }
  return result;
}

export function getTableHeaderWidth(headerId) {
  switch (headerId) {
    case 'created_at':
    case 'updated_at':
    case 'regenerated_at':
    case 'released_at':
    case 'last_active':
      return 'lg:w-55 max-lg:w-51';

    case 'actions':
      return 'w-15';

    case 'select':
      return 'w-8';

    default:
      return '';
  }
}

export function formatFileSize(size) {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  const gb = size / (1024 ** 3);
  if (gb >= 1) {
    // then return size in GB
    return `${formatter.format(gb)} GB`;
  }

  const mb = size / (1024 ** 2);
  if (mb >= 1) {
    // then return size in MB
    return `${formatter.format(mb)} MB`;
  }

  const kb = size / 1024;
  return `${formatter.format(kb)} KB`;
}

export function isSemverFormat(version) {
  return /^((0|[1-9][0-9]*)\.){2}(0|[1-9][0-9]*)$/.test(version);
}

export function generatePassword() {
  const newPassword = cryptoRandomString({
    length: 16,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_+=?',
  });

  const newPasswordResult = passwordSchema.safeParse(newPassword);
  if (newPasswordResult.success) {
    return newPasswordResult.data;
  } else {
    return generatePassword();
  }
}

export function formatCurrency(value, currencyCode) {
  const locale = currencyCode === CurrencyCode.IDR ? 'id-ID' : 'en-US';
  const maxFraction = currencyCode === CurrencyCode.IDR ? 0 : 2;

  return value.toLocaleString(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFraction,
  }).replace(/\s/, '');
}

export function getStatusClasses(status) {
  switch (status) {
    case TransactionStatus.PAID:
      return 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300';
    case TransactionStatus.REFUND:
      return 'bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-300';
    case TransactionStatus.CANCELLED:
      return 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300';
    default:
      return 'bg-gray-100/50 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  }
}

export const getSubtotal = ({ qty, price, discount, couponDiscount }) =>
  price * qty * (1 - discount/100) * (1 - couponDiscount/100);
