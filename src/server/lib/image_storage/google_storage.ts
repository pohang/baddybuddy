import { Storage } from '@google-cloud/storage';
import { GOOGLE } from '~/server/lib/credentials/google';

const bucketName = 'baddybuddy-court-signups';
const storageClient = new Storage({
  projectId: GOOGLE.projectId,
  credentials: GOOGLE.credentials,
});

export default class ImageStorage {
  async getPresignedUrlForUpload(fileName: string) {
    const [url] = await storageClient
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });
    return Promise.resolve(url);
  }

  async getPresignedUrlForDownload(fileName: string) {
    const [url] = await storageClient
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 1 day
        responseDisposition: 'inline',
      });
    return Promise.resolve(url);
  }

  async getHash(fileName: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [metadata] = await storageClient
      .bucket(bucketName)
      .file(fileName)
      .getMetadata();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const md5Hash = metadata.md5Hash as string | null;
    if (md5Hash == null) {
      throw new Error(`Could not get a md5 hash for ${fileName}`);
    }
    return md5Hash;
  }
}
