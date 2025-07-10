import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  if (/edit|regenerate/.test(pathname)) pathnames.splice(1, 1);

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
  isTooMany,
}) {
  if (totalDataPerPage < 1) return null;

  let resultLabel = 'results';
  if (totalDataPerPage === 1) resultLabel = 'result';

  if (searchKey) {
    if (isTooMany) {
      return `${totalDataPerPage} ${resultLabel} (limited)`;
    }
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
      return 'lg:w-55 max-lg:w-51';

    case 'actions':
      return 'w-15';

    case 'select':
      return 'w-8';

    default:
      return '';
  }
}
