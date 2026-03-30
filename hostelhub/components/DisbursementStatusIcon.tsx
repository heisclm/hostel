import { CheckCircle2, Clock, Loader2, AlertTriangle } from "lucide-react";

export function DisbursementStatusIcon({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className={className} />;
    case "PENDING":
      return <Clock className={className} />;
    case "PROCESSING":
      return <Loader2 className={className} />;
    case "FAILED":
      return <AlertTriangle className={className} />;
    default:
      return <Clock className={className} />;
  }
}
