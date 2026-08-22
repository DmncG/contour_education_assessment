import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const firstName =
    typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const dateTime = typeof body?.dateTime === "string" ? body.dateTime : "";

  if (!firstName || !lastName || !reason || !dateTime) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const parsedDate = new Date(dateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("consultations")
    .insert({
      student_id: user.id,
      first_name: firstName,
      last_name: lastName,
      consult_reason: reason,
      date_time: parsedDate.toISOString(),
    })
    .select("id, consult_reason, date_time, status")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to create consultation" },
      { status: 500 },
    );
  }

  return NextResponse.json({ consultation: data }, { status: 201 });
}
