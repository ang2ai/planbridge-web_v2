import { Badge } from "@/components/ui/badge";
import {
  CR_STATUS_LABELS,
  CR_STATUS_COLORS,
  TODO_STATUS_LABELS,
  TODO_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  COMPLEXITY_LABELS,
} from "@/lib/labels";

interface StatusBadgeProps {
  status: string;
  type: "cr" | "todo" | "priority" | "complexity";
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  if (type === "cr") {
    return (
      <Badge variant={CR_STATUS_COLORS[status] ?? "secondary"}>
        {CR_STATUS_LABELS[status] ?? status}
      </Badge>
    );
  }
  if (type === "todo") {
    return (
      <Badge variant={TODO_STATUS_COLORS[status] ?? "secondary"}>
        {TODO_STATUS_LABELS[status] ?? status}
      </Badge>
    );
  }
  if (type === "priority") {
    return (
      <Badge variant={PRIORITY_COLORS[status] ?? "secondary"}>
        {PRIORITY_LABELS[status] ?? status}
      </Badge>
    );
  }
  if (type === "complexity") {
    return (
      <Badge variant="outline">
        {COMPLEXITY_LABELS[status] ?? status}
      </Badge>
    );
  }
  return <Badge variant="secondary">{status}</Badge>;
}
