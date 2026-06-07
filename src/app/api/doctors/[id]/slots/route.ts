import { withAuthParams, successResponse, errorResponse } from "@/lib/api-helpers";
import { getAvailableSlots } from "@/services/appointment.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuthParams(request as never, context, async (_userId, req, id) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return errorResponse("Date is required");
    }

    const slots = await getAvailableSlots(id, date);
    return successResponse(slots);
  });
}
