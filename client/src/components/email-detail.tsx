import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmailCategoryBadge } from "./email-category-badge";
import { 
  ArrowLeft, 
  Reply, 
  Forward, 
  Archive, 
  Trash2,
  Tag,
  Paperclip,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { EmailWithAccount, EmailCategory, EMAIL_CATEGORIES } from "@shared/schema";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailDetailProps {
  email: EmailWithAccount | null;
  onBack: () => void;
}

const CATEGORIES: readonly EmailCategory[] = [
  "Interested",
  "Meeting Booked",
  "Not Interested",
  "Spam",
  "Out of Office"
];

export function EmailDetail({ email, onBack }: EmailDetailProps) {
  const [showHeaders, setShowHeaders] = useState(false);
  const { toast } = useToast();

  const categorizeMutation = useMutation({
    mutationFn: async (category: EmailCategory) => {
      return apiRequest("PATCH", `/api/emails/${email?.id}/category`, { category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Category updated",
        description: "Email has been categorized successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div>
          <h3 className="text-lg font-medium text-muted-foreground">No email selected</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Select an email from the list to view its content
          </p>
        </div>
      </div>
    );
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="md:hidden"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" data-testid="button-reply">
              <Reply className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-forward">
              <Forward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-archive">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-delete">
              <Trash2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-categorize">
                  <Tag className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {CATEGORIES.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => categorizeMutation.mutate(category)}
                    data-testid={`dropdown-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Subject and Category */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl font-semibold">{email.subject}</h1>
                {email.hasAttachments && (
                  <Paperclip className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              {email.category && (
                <EmailCategoryBadge category={email.category} />
              )}
            </div>

            <Separator />

            {/* Sender Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(email.from)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{email.from}</p>
                  <p className="text-sm text-muted-foreground">to {email.to}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    via {email.accountEmail}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(email.receivedAt), "PPP")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(email.receivedAt), "p")}
                </p>
              </div>
            </div>

            {/* Technical Headers Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHeaders(!showHeaders)}
              className="text-xs"
              data-testid="button-toggle-headers"
            >
              {showHeaders ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show details
                </>
              )}
            </Button>

            {showHeaders && (
              <Card className="p-4 bg-muted/50">
                <div className="space-y-1 font-mono text-xs">
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground">Message ID:</span>
                    <span className="break-all">{email.messageId}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground">Folder:</span>
                    <span>{email.folder}</span>
                  </div>
                </div>
              </Card>
            )}

            <Separator />

            {/* Email Body */}
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: email.bodyHtml || `<p>${email.bodyText?.replace(/\n/g, '<br>')}</p>` 
              }}
              data-testid="email-body"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
