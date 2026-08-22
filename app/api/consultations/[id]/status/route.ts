import { NextResponse } from "next/server";
import { isConsultationStatus } from "@/lib/consultations/status";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (!isConsultationStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Consultation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ consultation: data });
}
