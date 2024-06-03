import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '~/components/ui/button';
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
import { z } from 'zod';

type Props = {
  signupStateId: number;
  court: number;
  imageUri: string | undefined;
  onUpdate: () => void;
};

const formSchema = z.object({
  minutesLeft: z.coerce.number(),
  onCourt: z.string(),
  queue1: z.string(),
  queue2: z.string(),
  queue3: z.string(),
});

export const UpdateCourtDialog = (props: Props) => {
  const { signupStateId, court, imageUri, onUpdate } = props;
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const signupStateForCourtQuery = api.signups.getSignupStateForCourt.useQuery(
    {
      id: signupStateId,
      court,
    },
    {
      enabled: false,
    },
  );
  const updateSignupStateMutation = api.signups.updateSignupState.useMutation();

  const signupStateData = signupStateForCourtQuery.data;
  const signupStatePlayers =
    signupStateData?.courtSignups?.map((s) => s.players) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  // Reset the form when the query data changes so that the default values populate properly.
  React.useEffect(() => {
    console.log(signupStateData);
    if (signupStateData) {
      form.reset({
        minutesLeft: signupStateData?.minutesLeft || 0,
        onCourt: signupStatePlayers[0]?.join(',') || '',
        queue1: signupStatePlayers[1]?.join(',') || '',
        queue2: signupStatePlayers[2]?.join(',') || '',
        queue3: signupStatePlayers[3]?.join(',') || '',
      });
    }
  }, [form, signupStateData]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const { minutesLeft, onCourt, queue1, queue2, queue3 } = values;

    const players = [onCourt, queue1, queue2, queue3]
      .map((playerStr) => {
        const trimmed = playerStr.trim();
        if (trimmed.length === 0) {
          return [];
        }
        return trimmed.split(',').map((s) => s.trim().toLowerCase());
      })
      .filter((p) => p.length > 0);

    if (players.length === 0) {
      form.setError('onCourt', {
        type: 'custom',
        message: 'Must at least add one set of players.',
      });
    }

    await updateSignupStateMutation.mutateAsync(
      {
        id: signupStateId,
        court,
        minutesLeft,
        players,
      },
      {
        onSettled: () => {
          setLoading(false);
        },
      },
    );
    onUpdate();
    setOpen(false);
  };

  const onOpenChange = (open: boolean) => {
    if (open) {
      void signupStateForCourtQuery.refetch();
    }
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-1 w-1 px-2">
          <FontAwesomeIcon icon={faPenToSquare} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update court</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="text-lg font-bold">Court {court}</div>
          <div className="text-xs">Match the court state to the picture.</div>
          {imageUri ? <img src={imageUri} alt="signup state" /> : null}
        </div>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="minutesLeft"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Minutes left</FormLabel>
                    <FormControl>
                      <Input className="w-12" type="number" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="onCourt"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-4">
                    <FormLabel className="w-12">Current players</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="queue1"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-4">
                    <FormLabel>1.</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="queue2"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-4">
                    <FormLabel>2.</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="queue3"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-4">
                    <FormLabel>3.</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
