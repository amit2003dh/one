import { Card } from "@/components/ui/card";
import { EmailCategoryBadge } from "./email-category-badge";
import { Paperclip } from "lucide-react";
import type { EmailWithAccount } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmailListProps {
  emails: EmailWithAccount[];
  selectedEmailId?: string;
  onEmailSelect: (emailId: string) => void;
  isLoading?: boolean;
}

export function EmailList({ emails, selectedEmailId, onEmailSelect, isLoading }: EmailListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full border-r">
        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col h-full border-r">
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">No emails found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters or add an email account to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="text-sm font-medium text-muted-foreground">
          {emails.length} {emails.length === 1 ? 'email' : 'emails'}
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {emails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const categoryColor = email.category 
              ? getCategoryBorderColor(email.category)
              : "transparent";
            
            return (
              <Card
                key={email.id}
                className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-colors border-l-4 ${
                  isSelected ? "bg-accent" : ""
                }`}
                style={{ borderLeftColor: categoryColor }}
                onClick={() => onEmailSelect(email.id)}
                data-testid={`email-item-${email.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!email.isRead ? "font-semibold" : "font-medium"}`}>
                          {email.from}
                        </p>
                        {!email.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {email.accountEmail}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                      </span>
                      {email.hasAttachments && (
                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm truncate ${!email.isRead ? "font-medium" : ""}`}>
                    {email.subject}
                  </p>
                  
                  {email.bodyText && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {email.bodyText.substring(0, 150)}
                    </p>
                  )}
                  
                  {email.category && (
                    <div className="flex items-center gap-2 pt-1">
                      <EmailCategoryBadge category={email.category} size="sm" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function getCategoryBorderColor(category: string): string {
  const colors: Record<string, string> = {
    "Interested": "hsl(142 76% 36%)",
    "Meeting Booked": "hsl(221 83% 53%)",
    "Not Interested": "hsl(0 0% 60%)",
    "Spam": "hsl(0 84% 60%)",
    "Out of Office": "hsl(45 93% 47%)",
  };
  return colors[category] || "transparent";
}
