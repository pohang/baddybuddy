import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

type Props = {
  groupId: string;
  trigger: React.ReactNode;
};

const formSchema = z.object({
  description: z.string(),
});

const ReportIssueDialog = (props: Props) => {
  const { groupId, trigger } = props;
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const reportIssueMutation = api.issues.createIssue.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const { description } = values;
    await reportIssueMutation.mutateAsync(
      {
        description,
        groupId,
      },
      {
        onError: (e) => {
          form.setError('description', {
            type: 'custom',
            message: `Something went wrong: ${e.message}`,
          });
        },
        onSettled: () => {
          setLoading(false);
          form.reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report issue</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Describe the issue..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueDialog;
