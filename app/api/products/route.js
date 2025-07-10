import { getProducts } from "@/lib/services/product-service";

export async function GET() {
  const products = await getProducts();
  return Response.json({
    status: 'success',
    data: products,
  });
}
