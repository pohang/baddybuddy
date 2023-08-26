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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { useLocalStorage } from 'usehooks-ts';

type Props = {
  groupId: string;
  onPlayerAdd: () => void;
  playerCount: number;
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
  const { groupId, onPlayerAdd, playerCount } = props;
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const addPlayerMutation = api.players.addPlayer.useMutation();
  const [freshVisit, setFreshVisit] = useLocalStorage(`freshVisit-${groupId}`, true);

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
                'Player already exists. Delete and re-add the player to update the password.',
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
      onClose();
    }
  };

  const onOpenChange = (open: boolean) => {
    setFreshVisit(false);
    setOpen(open);
  }

  const onClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={open || freshVisit} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faUser} />
            <span>{playerCount}</span>
          </div>
        </Button>
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
