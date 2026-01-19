import { getProducts } from '@/lib/services/product-service';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const filters = {
    status: searchParams.get('s'),
  };

  try {
    const products = await getProducts(filters);
    return Response.json({
      status: 'success',
      data: {
        items: products,
      },
    });   
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, 500);
  }
}
