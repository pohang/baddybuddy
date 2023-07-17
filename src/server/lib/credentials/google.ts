import { type CredentialBody } from 'google-auth-library';

export const GOOGLE = {
  credentials: JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS || '', 'base64').toString(),
  ) as CredentialBody,
  projectId: 'prismatic-smoke-201521',
};
