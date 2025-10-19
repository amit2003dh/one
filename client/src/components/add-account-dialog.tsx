import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmailAccountSchema, type InsertEmailAccount } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertEmailAccount>({
    resolver: zodResolver(insertEmailAccountSchema),
    defaultValues: {
      email: "",
      imapHost: "",
      imapPort: 993,
      imapUser: "",
      imapPassword: "",
    },
  });

  const addAccountMutation = useMutation({
    mutationFn: async (data: InsertEmailAccount) => {
      return apiRequest("POST", "/api/accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account added",
        description: "Your email account has been added successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmailAccount) => {
    addAccountMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-add-account">
        <DialogHeader>
          <DialogTitle>Add Email Account</DialogTitle>
          <DialogDescription>
            Connect your IMAP email account to start syncing emails
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your.email@example.com" 
                      {...field} 
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imapHost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMAP Host</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="imap.gmail.com" 
                      {...field} 
                      data-testid="input-imap-host"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Example: imap.gmail.com, imap.mail.yahoo.com
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imapPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMAP Port</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-imap-port"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Typically 993 for SSL/TLS
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imapUser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMAP Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Usually your email address" 
                      {...field} 
                      data-testid="input-imap-user"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imapPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMAP Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="App password or account password" 
                      {...field} 
                      data-testid="input-imap-password"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    For Gmail, use an App Password instead of your account password
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addAccountMutation.isPending}
                data-testid="button-submit-account"
              >
                {addAccountMutation.isPending ? "Adding..." : "Add Account"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
