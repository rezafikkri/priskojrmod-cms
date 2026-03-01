import { countLicenseKeys, getLicenseKeys, searchLicenseKeys } from '@/lib/services/license-key-service';
import { cmsConfig } from '@/config/cms';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const pageIndex = parseInt(searchParams.get('pi'));
  const searchKey = searchParams.get('sk');
  // params for filters
  const secretKeyId = searchParams.get('ski');
  const canRegenerate = searchParams.get('cr');

  let filters = { showRevoked: searchParams.get('sr') };
  if (secretKeyId) {
    filters = { ...filters, secretKeyId: secretKeyId };
  }
  if (canRegenerate) {
    filters = { ...filters, canRegenerate };
  }

  try {
    let dataResponse;

    if (searchKey) {
      const licenseKeys = await searchLicenseKeys({
        key: searchKey,
        limit: cmsConfig.search.limit,
        filters,
      });
      dataResponse = {
        items: licenseKeys,
      };

      if (licenseKeys.length > cmsConfig.search.limit) {
        licenseKeys.pop();
        dataResponse.isTooMany = true;
      } else {
        dataResponse.isTooMany = false;
      }
    } else {
      const licenseKeys = await getLicenseKeys({
        pageIndex,
        pageSize: cmsConfig.pagination.pageSize,
        filters,
      });
      const numberLicenseKeys = await countLicenseKeys(filters);
      dataResponse = {
        items: licenseKeys,
        rowCount: numberLicenseKeys,
      };
    }

    return Response.json({
      message: 'success',
      data: dataResponse,
    });   
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, { status: 500 });
  }
}
