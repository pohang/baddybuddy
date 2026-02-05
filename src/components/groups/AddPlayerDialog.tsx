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
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocalStorage } from 'usehooks-ts';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';

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
  addAnother: z.boolean(),
});

const AddPlayerDialog = (props: Props) => {
  const { groupId, onPlayerAdd, playerCount } = props;
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<'one' | 'many'>('one');
  const [bulkValue, setBulkValue] = React.useState('');
  const addPlayerMutation = api.players.addPlayer.useMutation();
  const [freshVisit, setFreshVisit] = useLocalStorage(`freshVisit-${groupId}`, true);
  const [savedUsername, setSavedUserName] = useLocalStorage(`username`, '');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: savedUsername,
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
      setSavedUserName(form.getValues().username)
      form.reset();
      onPlayerAdd();
      onClose();
    }
  };

  const onBulkSubmit = async () => {
    const lines = bulkValue
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    setLoading(true);
    for (const line of lines) {
      const match = line.match(/^(\S+)\s+(.+)$/);
      if (!match) {
        toast.error(`Invalid line: "${line}". Expected "username password".`);
        continue;
      }
      const [, username, password] = match;
      try {
        await addPlayerMutation.mutateAsync({
          groupId,
          username: username!,
          password: password!,
        });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Unknown error';
        toast.error(`Failed to add "${username}": ${message}`);
      }
    }
    setLoading(false);
    setBulkValue('');
    onPlayerAdd();
    onClose();
  };

  const onOpenChange = (newOpen: boolean) => {
    setFreshVisit(false);
    setOpen(newOpen);
    if (!newOpen) {
      setMode('one');
    }
  }

  const onClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={open || freshVisit} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faUserPlus} />
            <span>{playerCount}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'one' ? 'Add' : 'Add many'}</DialogTitle>
        </DialogHeader>
        {mode === 'one' ? (
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
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Add
                </Button>
                <Button type="button" variant="secondary" onClick={() => setMode('many')}>
                  Add many
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder={`dy rabbit\nsenas ox\nharrc pig\neric tiger\nbh horse`}
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              rows={8}
            />
            <div className="flex gap-2">
              <Button onClick={onBulkSubmit} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add
              </Button>
              <Button variant="secondary" onClick={() => setMode('one')}>
                Add one
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerDialog;
