import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EmailAccount } from "@shared/schema";
import { Trash2, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery<EmailAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete account");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails"], exact: false });
      toast({
        title: "Account deleted",
        description: "The email account has been removed successfully.",
      });
      setDeleteAccountId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (accountId: string) => {
    setDeleteAccountId(accountId);
  };

  const confirmDelete = () => {
    if (deleteAccountId) {
      deleteMutation.mutate(deleteAccountId);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your email accounts and application settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Email Accounts</h3>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading accounts...</p>
              ) : accounts && accounts.length > 0 ? (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{account.email}</span>
                            {account.isActive && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {account.lastSyncedAt ? (
                              <>
                                Last synced: {new Date(account.lastSyncedAt).toLocaleString()}
                              </>
                            ) : (
                              "Not synced yet"
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(account.id)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No email accounts configured. Add one to get started.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the email account and all its associated emails. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
