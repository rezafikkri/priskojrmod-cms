import { getTransactionDetails } from "@/lib/services/transaction-service";

export async function GET(_, { params }) {
  const { id } = await params;

  try {
    const transactionDetails = await getTransactionDetails(id);

    return Response.json({
      message: 'success',
      data: transactionDetails,
    });
  } catch (err) {
    return Response.json({
      status: 'error',
      message: err.message,
    }, { status: 500 });
  }
}
