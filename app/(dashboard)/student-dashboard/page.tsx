import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

const STATUS_VARIANT = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
} as const;

export default async function StudentDashboard() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: consultations } = await supabase
    .from("consultations")
    .select("id, consult_reason, date_time, status")
    .eq("student_id", profile.id)
    .order("date_time", { ascending: false });

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <h2 className="font-bold text-2xl">Your Consultations</h2>

      {!consultations || consultations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border rounded-md p-12 text-center">
          <p className="text-muted-foreground">
            There are no bookings available.
          </p>
          <Button>Book a Consultation</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {consultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <CardTitle className="text-base">
                  {consultation.consult_reason || "Consultation"}
                </CardTitle>
                <Badge
                  className="capitalize"
                  variant={
                    STATUS_VARIANT[
                      consultation.status as keyof typeof STATUS_VARIANT
                    ]
                  }
                >
                  {consultation.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {new Date(consultation.date_time).toLocaleString(
                    undefined,
                    {
                      dateStyle: "long",
                      timeStyle: "short",
                    },
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
          <Button>Book a Consultation</Button>
        </div>
      )}
    </div>
  );
}
