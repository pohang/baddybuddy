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
import { Input } from '~/components/ui/input';
import { api } from '~/utils/api';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

type Props = {
  groupId: string;
  onPlayerAdd: () => void;
};

const formSchema = z.object({
  username: z.string().min(1, {
    message: 'Username must be at least 1 character.',
  }),
  password: z.string().min(1, {
    message: 'Password must be at least 1 character.',
  }),
  addAnother: z.boolean().optional().default(false),
});

const AddPlayerDialog = (props: Props) => {
  const { groupId, onPlayerAdd } = props;
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const addPlayerMutation = api.players.addPlayer.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      addAnother: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Adding new player...');
    setLoading(true);
    const { username, password, addAnother } = values;
    await addPlayerMutation.mutateAsync(
      {
        groupId,
        username,
        password,
      },
      {
        onError: (e) => {
          if (e.message.includes('Unique constraint')) {
            form.setError('username', {
              type: 'custom',
              message:
                'Username already exists. You can delete the player and re-add if you need to change the password.',
            });
          }
        },
        onSettled: () => {
          setLoading(false);
        },
      },
    );

    if (addAnother) {
      form.reset();
      form.setValue('addAnother', true);
    } else {
      form.reset();
      onPlayerAdd();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Player</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addAnother"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      // https://github.com/shadcn/ui/issues/657
                      onCheckedChange={field.onChange as () => void}
                    />
                  </FormControl>
                  <FormLabel>Add another player</FormLabel>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerDialog;
