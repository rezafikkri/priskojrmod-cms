import { getTransactionDetails } from "@/lib/services/transaction-service";

export async function GET(_, { params }) {
  const { id } = await params;

  const transactionDetails = await getTransactionDetails(id);

  return Response.json({
    message: 'success',
    data: transactionDetails,
  });
}
