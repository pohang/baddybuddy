import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { api } from '~/utils/api';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

type Props = {
  groupId: string;
  onUploadSuccess: () => void;
};

const ImageUploadDialog = (props: Props) => {
  const { groupId, onUploadSuccess } = props;
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [selectedFilePreviewUri, setSelectedFilePreviewUri] = React.useState<
    string | null
  >(null);
  const [fileSelectedAt, setFileSelectedAt] = React.useState<Date | null>(null);
  const [open, setOpen] = React.useState(false);
  const [uploadProcessing, setUploadProcessing] = React.useState(false);

  const presignedUrlMutation =
    api.signups.createPresignedUploadUrl.useMutation();

  const processSignupStateImageMutation =
    api.signups.processSignupStateImage.useMutation();

  const handleUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (selectedFile == null) {
      return;
    }

    let success;

    try {
      setUploadProcessing(true);
      // upload to google cloud
      const presignedUrl = await presignedUrlMutation.mutateAsync();
      await fetch(presignedUrl.presignedUrl, {
        method: 'PUT',
        body: selectedFile,
      });

      // trigger processing of the image using vision api
      await processSignupStateImageMutation.mutateAsync({
        groupId,
        fileName: presignedUrl.fileName,
        takenAt: fileSelectedAt!,
      });
      success = true;
    } finally {
      setUploadProcessing(false);
    }

    if (success) {
      setOpen(false);
      onUploadSuccess();
    }
  };

  const renderUploadDialogContent = () => {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload image</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col justify-center items-center gap-4">
          <p>
            Take a picture of the signup screen. Make sure the whole screen is
            visible. It is best to take it head on (not at an angle).
          </p>
          <Input
            className="w-3/4"
            type="file"
            accept="image/jpeg"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
                setFileSelectedAt(new Date());
                setSelectedFilePreviewUri(
                  URL.createObjectURL(e.target.files[0]),
                );
              }
            }}
          />
          {selectedFilePreviewUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedFilePreviewUri} alt="signup preview" />
          ) : null}
        </div>
        <DialogFooter>
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              onClick={handleUpload}
              disabled={selectedFile == null || uploadProcessing}
            >
              {uploadProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Upload
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload image</Button>
      </DialogTrigger>
      {renderUploadDialogContent()}
    </Dialog>
  );
};

export default ImageUploadDialog;
