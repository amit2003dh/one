import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EmailSidebar } from "@/components/email-sidebar";
import { EmailList } from "@/components/email-list";
import { EmailDetail } from "@/components/email-detail";
import { AddAccountDialog } from "@/components/add-account-dialog";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import type { EmailWithAccount } from "@shared/schema";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Inbox() {
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showEmailDetail, setShowEmailDetail] = useState(false);

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("query", searchQuery);
    if (selectedAccountId) params.append("accountId", selectedAccountId);
    if (selectedCategory) {
      params.append("category", selectedCategory);
    } else {
      params.append("folder", selectedFolder);
    }
    return params.toString();
  };

  const { data: emails, isLoading } = useQuery<EmailWithAccount[]>({
    queryKey: ["/api/emails", buildQueryParams()],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const response = await fetch(`/api/emails${queryString ? `?${queryString}` : ""}`);
      if (!response.ok) throw new Error("Failed to fetch emails");
      return response.json();
    },
  });

  const selectedEmail = emails?.find((e) => e.id === selectedEmailId);

  const handleEmailSelect = (emailId: string) => {
    setSelectedEmailId(emailId);
    if (isMobile) {
      setShowEmailDetail(true);
    }
  };

  const handleBackToList = () => {
    setShowEmailDetail(false);
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <EmailSidebar
          onAddAccount={() => setShowAddAccount(true)}
          onSettings={() => setShowSettings(true)}
          selectedFolder={selectedFolder}
          selectedCategory={selectedCategory}
          selectedAccountId={selectedAccountId}
          onFolderSelect={setSelectedFolder}
          onCategorySelect={setSelectedCategory}
          onAccountSelect={setSelectedAccountId}
        />

        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b gap-4">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex-1 max-w-md">
                <SearchBar onSearch={setSearchQuery} />
              </div>
            </div>
            <ThemeToggle />
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Email List - Hidden on mobile when email detail is shown */}
              <div 
                className={`w-full md:w-96 ${
                  isMobile && showEmailDetail ? "hidden" : "block"
                }`}
              >
                <EmailList
                  emails={emails || []}
                  selectedEmailId={selectedEmailId}
                  onEmailSelect={handleEmailSelect}
                  isLoading={isLoading}
                />
              </div>

              {/* Email Detail - Full screen on mobile, right pane on desktop */}
              <div 
                className={`flex-1 ${
                  isMobile && !showEmailDetail ? "hidden" : "block"
                }`}
              >
                <EmailDetail
                  email={selectedEmail || null}
                  onBack={handleBackToList}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      <AddAccountDialog open={showAddAccount} onOpenChange={setShowAddAccount} />
    </SidebarProvider>
  );
}
