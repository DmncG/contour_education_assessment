import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/require-role";
import { STATUS_VARIANT, type ConsultationStatus } from "@/lib/consultations/status";
import { createClient } from "@/lib/supabase/server";

// Reads all consultations for the admin, which is per-user/role-gated data
// with no safe static shell — same reasoning as app/(dashboard)/layout.tsx.
// The layout's opt-out only covers navigation into /(dashboard) from
// outside; sibling navigation (e.g. from /student-dashboard) still
// validates this page.
export const instant = false;

const COLUMN_COUNT = 5;

type ConsultationRow = {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  consult_reason: string | null;
  date_time: string;
  status: ConsultationStatus;
};

type TableItem =
  | { kind: "group-header"; studentId: string }
  | { kind: "row"; consultation: ConsultationRow; striped: boolean };

function buildTableItems(consultations: ConsultationRow[]): TableItem[] {
  const items: TableItem[] = [];
  let rowIndex = 0;
  let currentStudentId: string | null = null;

  for (const consultation of consultations) {
    if (consultation.student_id !== currentStudentId) {
      currentStudentId = consultation.student_id;
      items.push({ kind: "group-header", studentId: consultation.student_id });
    }

    items.push({ kind: "row", consultation, striped: rowIndex % 2 === 1 });
    rowIndex += 1;
  }

  return items;
}

export default async function AdminConsultationsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: consultations } = await supabase
    .from("consultations")
    .select("id, student_id, first_name, last_name, consult_reason, date_time, status")
    .order("student_id", { ascending: true })
    .order("date_time", { ascending: true });

  const tableItems = buildTableItems(
    (consultations ?? []) as ConsultationRow[],
  );

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <h2 className="font-bold text-2xl">All Consultations</h2>

      {tableItems.length === 0 ? (
        <p className="text-muted-foreground">There are no consultations yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date and Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableItems.map((item) =>
                item.kind === "group-header" ? (
                  <TableRow
                    key={`group-${item.studentId}`}
                    className="bg-muted hover:bg-muted"
                  >
                    <TableCell colSpan={COLUMN_COUNT} className="font-medium">
                      Student ID: <span className="font-mono text-xs">{item.studentId}</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow
                    key={item.consultation.id}
                    className={item.striped ? "bg-muted/40 hover:bg-muted/60" : undefined}
                  >
                    <TableCell>{item.consultation.first_name}</TableCell>
                    <TableCell>{item.consultation.last_name}</TableCell>
                    <TableCell>{item.consultation.consult_reason || "—"}</TableCell>
                    <TableCell>
                      {new Date(item.consultation.date_time).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="capitalize"
                        variant={STATUS_VARIANT[item.consultation.status]}
                      >
                        {item.consultation.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
