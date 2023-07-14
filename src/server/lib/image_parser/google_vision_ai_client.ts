import vision, { type ImageAnnotatorClient } from '@google-cloud/vision';
import { type google } from '@google-cloud/vision/build/protos/protos';
import { prisma } from '~/server/db';
import { GOOGLE } from '~/server/lib/credentials/google';
import ImageStorage from '~/server/lib/image_storage/google_storage';
import { type GoogleVisionRequest, type Prisma } from '.prisma/client';

// First 1000 are free https://cloud.google.com/vision/pricing.
const MAX_REQUESTS_PER_MONTH = 900;

const imageStorage = new ImageStorage();

export type TextAnnotationsResponse = {
  textAnnotations?: google.cloud.vision.v1.IEntityAnnotation[] | null;
};

export class GoogleVisionAiClient {
  private readonly client: ImageAnnotatorClient;
  private readonly maxRequestsPerMonth: number;

  constructor(client: ImageAnnotatorClient, maxRequestsPerMonth: number) {
    this.client = client;
    this.maxRequestsPerMonth = maxRequestsPerMonth;
  }

  public static forProd(): GoogleVisionAiClient {
    return new GoogleVisionAiClient(
      new vision.ImageAnnotatorClient({
        projectId: GOOGLE.projectId,
        credentials: GOOGLE.credentials,
      }),
      MAX_REQUESTS_PER_MONTH,
    );
  }

  async parseImage({
    fileName,
  }: {
    fileName: string;
  }): Promise<TextAnnotationsResponse> {
    const imageHash = await imageStorage.getHash(fileName);
    const googleVisionRequest = await this.#getOrCreateGoogleVisionRequest({
      fileName,
      imageHash,
    });
    if (googleVisionRequest?.result) {
      console.log(
        `Returning cached result for hash ${imageHash}: ${JSON.stringify(
          googleVisionRequest.result,
        )}`,
      );
      return Promise.resolve(
        googleVisionRequest.result as TextAnnotationsResponse,
      );
    }
    console.log('Calling Google Cloud API...');
    const imageUri = await imageStorage.getPresignedUrlForDownload(fileName);
    const [textDetectionResponse] = await this.client.textDetection(imageUri);
    const result = {
      textAnnotations: textDetectionResponse.textAnnotations,
    };

    console.log(
      `Got response from Google Cloud API: ${JSON.stringify(result)}`,
    );
    await prisma.googleVisionRequest.update({
      where: { imageHash },
      data: {
        result: result as Prisma.JsonObject,
      },
    });
    console.log(
      `Cached response to GoogleVisionRequest(id: ${googleVisionRequest.id}).`,
    );

    return Promise.resolve(result);
  }

  async #getOrCreateGoogleVisionRequest({
    fileName,
    imageHash,
  }: {
    fileName: string;
    imageHash: string;
  }): Promise<GoogleVisionRequest> {
    const existingRequest = await prisma.googleVisionRequest.findUnique({
      where: { imageHash },
    });
    if (existingRequest) {
      console.log('Found existing GoogleVisionRequest for hash: ' + imageHash);
      return existingRequest;
    }

    const currentDate = new Date();
    const numRequestsForMonth = await prisma.googleVisionRequest.count({
      where: {
        createdAt: {
          gte: new Date(currentDate.getFullYear(), currentDate.getMonth()),
          lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
        },
      },
    });
    console.log(`Found ${numRequestsForMonth} requests for the month.`);
    if (numRequestsForMonth >= this.maxRequestsPerMonth) {
      throw new Error("We've hit the limit for requests this month.");
    }

    return prisma.googleVisionRequest.create({
      data: { fileName, imageHash },
    });
  }
}
