import { countLicenseKeys, getLicenseKeys, searchLicenseKeys } from '@/lib/services/license-key-service';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const pageIndex = parseInt(searchParams.get('pi'));
  const searchKey = searchParams.get('sk');
  // params for filters
  const secretKeyId = searchParams.get('ski');
  const canRegenerate = searchParams.get('cr');

  let filters;
  if (secretKeyId) {
    filters = { secret_key_id: secretKeyId };
  }
  if (canRegenerate) {
    filters = { ...filters, can_regenerate: canRegenerate === 'yes' ? true : false };
  }

  const select = {
    id: true,
    email: true,
    key: true,
    used_for_activate: true,
    used_for_download: true,
    created_at: true,
    updated_at: true,
    regenerated_at: true,
  };

  let dataResponse;

  if (searchKey) {
    const licenseKeys = await searchLicenseKeys({
      select,
      key: searchKey,
      limit: parseInt(process.env.SEARCH_LIMIT),
      filters,
    });
    dataResponse = {
      licenseKeys,
    };

    if (licenseKeys.length > process.env.SEARCH_LIMIT) {
      licenseKeys.pop();
      dataResponse.isTooMany = true;
    } else {
      dataResponse.isTooMany = false;
    }
  } else {
    const licenseKeys = await getLicenseKeys({
      select,
      pageIndex,
      pageSize: parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE),
      filters,
    });
    const numberLicenseKeys = await countLicenseKeys(filters);
    dataResponse = {
      licenseKeys,
      rowCount: numberLicenseKeys,
    };
  }

  return Response.json({
    message: 'success',
    data: dataResponse,
  });
}
