import { Badge } from "@/components/ui/badge";
import { EmailCategory } from "@shared/schema";
import { 
  CheckCircle2, 
  Calendar, 
  XCircle, 
  AlertTriangle, 
  BriefcaseIcon 
} from "lucide-react";

interface EmailCategoryBadgeProps {
  category: EmailCategory | null;
  size?: "sm" | "default";
}

const categoryConfig = {
  "Interested": {
    icon: CheckCircle2,
    color: "bg-category-interested/10 text-category-interested border-category-interested/20",
    label: "Interested"
  },
  "Meeting Booked": {
    icon: Calendar,
    color: "bg-category-meeting-booked/10 text-category-meeting-booked border-category-meeting-booked/20",
    label: "Meeting Booked"
  },
  "Not Interested": {
    icon: XCircle,
    color: "bg-category-not-interested/10 text-category-not-interested border-category-not-interested/20",
    label: "Not Interested"
  },
  "Spam": {
    icon: AlertTriangle,
    color: "bg-category-spam/10 text-category-spam border-category-spam/20",
    label: "Spam"
  },
  "Out of Office": {
    icon: BriefcaseIcon,
    color: "bg-category-out-of-office/10 text-category-out-of-office border-category-out-of-office/20",
    label: "Out of Office"
  }
};

export function EmailCategoryBadge({ category, size = "default" }: EmailCategoryBadgeProps) {
  if (!category) {
    return (
      <Badge variant="outline" className={size === "sm" ? "text-xs" : ""} data-testid="badge-uncategorized">
        Uncategorized
      </Badge>
    );
  }

  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${size === "sm" ? "text-xs gap-1" : "gap-1.5"}`}
      data-testid={`badge-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {config.label}
    </Badge>
  );
}
