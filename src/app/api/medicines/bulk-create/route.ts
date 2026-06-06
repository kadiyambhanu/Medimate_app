import { apiHandler, successResponse, errorResponse } from "@/lib/api-helpers";
import { bulkCreateMedicinesSchema } from "@/validations/extracted-medicine";
import { bulkCreateMedicinesAndReminders } from "@/services/medicine-bulk.service";
import { REMINDER_SCHEDULE_DAYS } from "@/lib/constants";

export const POST = apiHandler(async (userId, request) => {
  const body = await request.json();
  const parsed = bulkCreateMedicinesSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const { medicines, prescriptionId, startDate, scheduleDays, dailyRoutine } = parsed.data;

  const result = await bulkCreateMedicinesAndReminders(userId, medicines, {
    prescriptionId,
    startDate,
    scheduleDays: scheduleDays ?? REMINDER_SCHEDULE_DAYS,
    dailyRoutine,
  });

  return successResponse(
    {
      medicines: result.medicines,
      remindersCreated: result.remindersCreated,
      prescriptionId: result.prescriptionId,
    },
    `${result.medicines.length} medicine(s) and ${result.remindersCreated} reminder(s) created successfully`,
    201
  );
});
