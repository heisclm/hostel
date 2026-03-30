import { CheckCircle2, Clock, XCircle, ArrowDownRight } from "lucide-react";

export function PaymentStatusIcon({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  switch (status) {
    case "SUCCESSFUL":
      return <CheckCircle2 className={className} />;
    case "PENDING":
      return <Clock className={className} />;
    case "FAILED":
      return <XCircle className={className} />;
    case "REFUNDED":
      return <ArrowDownRight className={className} />;
    default:
      return <Clock className={className} />;
  }
}
