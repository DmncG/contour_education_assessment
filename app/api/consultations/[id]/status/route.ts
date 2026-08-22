import { NextResponse } from "next/server";
import {
  isConsultationStatus,
  type ConsultationStatus,
} from "@/lib/consultations/status";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  const dateTime = typeof body?.dateTime === "string" ? body.dateTime : undefined;

  if (!isConsultationStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const update: { status: ConsultationStatus; date_time?: string } = {
    status,
  };

  if (dateTime !== undefined) {
    const parsedDate = new Date(dateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    update.date_time = parsedDate.toISOString();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS restricts this update to the consultation's own student, so no
  // ownership check is needed here beyond the row matching at all.
  const { data, error } = await supabase
    .from("consultations")
    .update(update)
    .eq("id", id)
    .select("id, status, date_time")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Consultation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ consultation: data });
}
