import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Settings,
  Plus,
  Mail,
  CheckCircle2,
  Calendar,
  XCircle,
  AlertTriangle,
  BriefcaseIcon,
  Folder,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { EmailAccount } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";

interface EmailSidebarProps {
  onAddAccount: () => void;
  onSettings: () => void;
  selectedFolder?: string;
  selectedCategory?: string;
  selectedAccountId?: string;
  onFolderSelect: (folder: string) => void;
  onCategorySelect: (category: string | undefined) => void;
  onAccountSelect: (accountId: string | undefined) => void;
}

const folders = [
  { name: "Inbox", icon: Inbox, value: "INBOX" },
  { name: "Sent", icon: Send, value: "Sent" },
  { name: "Archive", icon: Archive, value: "Archive" },
  { name: "Trash", icon: Trash2, value: "Trash" },
];

const categories = [
  { name: "Interested", icon: CheckCircle2, value: "Interested", color: "text-category-interested" },
  { name: "Meeting Booked", icon: Calendar, value: "Meeting Booked", color: "text-category-meeting-booked" },
  { name: "Not Interested", icon: XCircle, value: "Not Interested", color: "text-category-not-interested" },
  { name: "Spam", icon: AlertTriangle, value: "Spam", color: "text-category-spam" },
  { name: "Out of Office", icon: BriefcaseIcon, value: "Out of Office", color: "text-category-out-of-office" },
];

export function EmailSidebar({
  onAddAccount,
  onSettings,
  selectedFolder = "INBOX",
  selectedCategory,
  selectedAccountId,
  onFolderSelect,
  onCategorySelect,
  onAccountSelect,
}: EmailSidebarProps) {
  const { data: accounts, isLoading } = useQuery<EmailAccount[]>({
    queryKey: ["/api/accounts"],
  });
  
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Onebox</h2>
          </div>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={onAddAccount}
            data-testid="button-add-account"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Accounts */}
        <SidebarGroup>
          <SidebarGroupLabel>Accounts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={!selectedAccountId}
                  onClick={() => onAccountSelect(undefined)}
                  data-testid="button-all-accounts"
                >
                  <Inbox className="h-4 w-4" />
                  <span>All Accounts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </>
              ) : (
                accounts?.map((account) => (
                  <SidebarMenuItem key={account.id}>
                    <SidebarMenuButton
                      isActive={selectedAccountId === account.id}
                      onClick={() => onAccountSelect(account.id)}
                      data-testid={`button-account-${account.id}`}
                    >
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{account.email}</span>
                      {account.isActive && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Active
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Folders */}
        <SidebarGroup>
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => (
                <SidebarMenuItem key={folder.value}>
                  <SidebarMenuButton
                    isActive={selectedFolder === folder.value && !selectedCategory}
                    onClick={() => {
                      onFolderSelect(folder.value);
                      onCategorySelect(undefined);
                    }}
                    data-testid={`button-folder-${folder.value.toLowerCase()}`}
                  >
                    <folder.icon className="h-4 w-4" />
                    <span>{folder.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Categories */}
        <SidebarGroup>
          <SidebarGroupLabel>AI Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => (
                <SidebarMenuItem key={category.value}>
                  <SidebarMenuButton
                    isActive={selectedCategory === category.value}
                    onClick={() => {
                      onCategorySelect(category.value);
                    }}
                    data-testid={`button-category-${category.value.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <category.icon className={`h-4 w-4 ${category.color}`} />
                    <span>{category.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/knowledge"}
                  data-testid="button-knowledge-base"
                >
                  <Link href="/knowledge">
                    <BookOpen className="h-4 w-4" />
                    <span>Knowledge Base</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onSettings}
          data-testid="button-settings"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
