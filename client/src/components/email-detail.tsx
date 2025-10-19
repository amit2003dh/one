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
  ChevronUp,
  Sparkles,
  Copy
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
import { Skeleton } from "@/components/ui/skeleton";

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
  const [showSuggestedReply, setShowSuggestedReply] = useState(false);
  const [suggestedReply, setSuggestedReply] = useState<{
    reply: string;
    confidence: number;
    relevantKnowledge: string[];
  } | null>(null);
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

  const suggestReplyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/emails/suggest-reply", { emailId: email?.id });
    },
    onSuccess: (data: any) => {
      setSuggestedReply(data);
      setShowSuggestedReply(true);
      toast({
        title: "Reply suggested",
        description: "AI has generated a suggested reply",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate reply suggestion",
        variant: "destructive",
      });
    },
  });

  const handleCopyReply = () => {
    if (suggestedReply) {
      navigator.clipboard.writeText(suggestedReply.reply);
      toast({
        title: "Copied",
        description: "Reply copied to clipboard",
      });
    }
  };

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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => suggestReplyMutation.mutate()}
              disabled={suggestReplyMutation.isPending}
              data-testid="button-suggest-reply"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Suggest Reply
            </Button>
            <Separator orientation="vertical" className="h-6" />
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
                <EmailCategoryBadge category={email.category as EmailCategory} />
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

            {/* AI Suggested Reply */}
            {suggestReplyMutation.isPending && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Generating suggested reply...</h3>
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            )}

            {showSuggestedReply && suggestedReply && (
              <Card className="p-6 bg-primary/5 border-primary/20" data-testid="suggested-reply-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">AI Suggested Reply</h3>
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round(suggestedReply.confidence * 100)}%
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCopyReply}
                      data-testid="button-copy-reply"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-background p-4 rounded-md border">
                    <p className="whitespace-pre-wrap text-sm" data-testid="text-suggested-reply">
                      {suggestedReply.reply}
                    </p>
                  </div>
                  {suggestedReply.relevantKnowledge.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Based on knowledge:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {suggestedReply.relevantKnowledge.map((knowledge, idx) => (
                          <li key={idx}>{knowledge.substring(0, 100)}...</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
