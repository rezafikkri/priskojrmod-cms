import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { passwordSchema } from './validators/base-validator';
import cryptoRandomString from 'crypto-random-string';
import { CurrencyCode, TransactionStatus, ProductStatus } from '@/constants/enums';
import { cmsConfig } from '@/config/cms';
import parsePhoneNumber from 'libphonenumber-js';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
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

export function generatePageInfo({
  pageIndex,
  totalCount,   // Total number of records across all pages (0 when in search mode)
  currentCount, // Number of records currently displayed (current page items, if in normal mode)
}) {
  const resultLabel = totalCount === 1 ? 'result' : 'results';

  if (totalCount <= 0) return `0 ${resultLabel}`;

  // start and end data for each page
  let startData = (pageIndex * cmsConfig.pagination.pageSize) + 1;
  let endData = (startData - 1) + currentCount;

  return `${startData}-${endData} of ${totalCount} ${resultLabel}`;
}

export function isLastPage({ pageIndex, pageSize, rowCount }) {
  if (rowCount === 0) return true;
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
    case 'createdAt':
    case 'updatedAt':
    case 'regeneratedAt':
    case 'releasedAt':
    case 'lastActive':
      return 'w-43';

    case 'actions':
      return 'w-15';

    case 'select':
      return 'w-8';

    default:
      return '';
  }
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

export function getStatusClasses(status) {
  switch (status) {
    case TransactionStatus.PAID:
    case ProductStatus.PUBLISHED:
      return 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300';
    case TransactionStatus.REFUND:
    case ProductStatus.UNPUBLISHED:
      return 'bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-300';
    case TransactionStatus.CANCELLED:
      return 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300';
    default:
      return 'bg-gray-100/50 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  }
}

export function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

export function getSubtotalBreakdown({ qty, price, currencyCode, discount, upgradeCouponDiscount }) {
  let result = {};
  let subtotal = price * qty;

  if (discount) {
    let discountAmount = subtotal * (discount / 100);
    if (currencyCode === CurrencyCode.IDR) discountAmount = Math.round(discountAmount);
    if (currencyCode === CurrencyCode.USD) discountAmount = roundToTwoDecimals(discountAmount);

    result.discountAmount = discountAmount;
    subtotal -= discountAmount;
  }

  if (upgradeCouponDiscount) {
    let upgradeCouponPrice = subtotal * (upgradeCouponDiscount / 100);
    if (currencyCode === CurrencyCode.IDR) upgradeCouponPrice = Math.round(upgradeCouponPrice);
    if (currencyCode === CurrencyCode.USD) upgradeCouponPrice = roundToTwoDecimals(upgradeCouponPrice);

    result.upgradeCouponAmount = upgradeCouponPrice;
    subtotal -= upgradeCouponPrice;
  }

  result.subtotal = subtotal;
  return result;
}

// generate donation links values for form
export function generateDonationLinkValues(donationLinks) {
  if (donationLinks.length === 2) return donationLinks;
  if (donationLinks.length === 1) {
    if (donationLinks[0].currencyCode === CurrencyCode.IDR) {
      return [
        ...donationLinks,
        { url: '', currencyCode: CurrencyCode.USD },
      ];
    }
    return [
      { url: '', currencyCode: CurrencyCode.IDR },
      ...donationLinks,
    ];
  }
  return [
    { url: '', currencyCode: CurrencyCode.IDR },
    { url: '', currencyCode: CurrencyCode.USD },
  ];
}

export function getNotFoundImagePath(theme, orientation) {
  if (theme === 'light') {
    if (orientation === 'square') return '/not-found-image-square.svg';
    return '/not-found-image.svg';
  }

  if (orientation === 'square') return '/not-found-image-square-dark-mode.svg';
  return '/not-found-image-dark-mode.svg';
}

/* Extract social media idetifier from social media profile URL
 * 
 * X, Instagram, YouTube will use "@" prefix, Facebook and Github use username only
 * and specially for Linkedin will use format like "in/reza-sariful-fikri".
 * See in base-validator for detail supported social media!
 */
export function extractSMIdentifier(smProfileURL) {
  try {
    const atSignHostnames = [
      'x.com',
      'instagram.com',
      'youtube.com',
    ];

    const url = new URL(smProfileURL);
    const username = url.pathname.replace(/^\/+|\/+$/g, '');

    for (const atSignHostname of atSignHostnames) {
      if (url.hostname.endsWith(atSignHostname) && !username.startsWith('@')) return `@${username}`;
    }

    return username;
  } catch (err) {
    return null;
  }
}

// Generate a display label from full name and identifier (e.g., email or social handle).
export function generateNameIdentifierLabel(firstName, lastName, identifier) {
  let name = `${firstName} ${lastName}`;

  if ((name.length + identifier.length + 1) > 50) {
    name = `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
  }

  return `${name} — ${identifier}`;
}

export function getPhoneNumberE164(countryIso, number) {
  // get phone number E.164 format
  const parsedNumber = parsePhoneNumber(
    number,
    countryIso === 'OTHER' ? undefined : countryIso,
    { extract: false },
  );
  return parsedNumber.number;
}

export const getUnixTimestamp = () => Math.floor(Date.now() / 1000);

export function toTitleCase(str) {
  return str.replace(/\w\S*/g, (match) => match.charAt(0).toUpperCase() + match.substring(1));
}
