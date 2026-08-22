import { BookConsultationDialog } from "@/components/consultations/book-consultation-dialog";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { requireProfile } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

// Reads the signed-in student's own consultations, which is per-user data
// with no safe static shell — same reasoning as app/(dashboard)/layout.tsx.
// The layout's opt-out only covers navigation into /(dashboard) from
// outside; sibling navigation (e.g. from /admin) still validates this page.
export const instant = false;

export default async function StudentDashboard() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: consultations } = await supabase
    .from("consultations")
    .select("id, consult_reason, date_time, status")
    .eq("student_id", profile.id)
    .neq("status", "cancelled")
    .order("date_time", { ascending: true });

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <h2 className="font-bold text-2xl">Your Consultations</h2>

      {!consultations || consultations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border rounded-md p-12 text-center">
          <p className="text-muted-foreground">
            There are no bookings available.
          </p>
          <BookConsultationDialog />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {consultations.map((consultation) => (
            <ConsultationCard key={consultation.id} consultation={consultation} />
          ))}
          <BookConsultationDialog />
        </div>
      )}
    </div>
  );
}
