import { getProducts } from '@/lib/services/product-service';

export async function GET() {
  try {
    const products = await getProducts();
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
