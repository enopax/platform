import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import crypto from 'crypto';
import { hashSync, genSaltSync } from 'bcrypt-ts';
import path from 'path';

const PROTO_PATH = path.join(process.cwd(), 'src/lib/dex/api.proto');

const DEX_GRPC_ADDR = process.env.DEX_GRPC_ADDR || 'localhost:5557';

let dexClient: any = null;

function getClient(): any {
  if (dexClient) return dexClient;

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const dexProto = protoDescriptor.api as any;

  dexClient = new dexProto.Dex(DEX_GRPC_ADDR, grpc.credentials.createInsecure());
  return dexClient;
}

export function generateUserIdFromEmail(email: string): string {
  const hash = crypto.createHash('sha256').update(email).digest('hex');
  const emailHash = hash.substring(0, 32);
  return `${emailHash.substring(0, 8)}-${emailHash.substring(8, 12)}-${emailHash.substring(12, 16)}-${emailHash.substring(16, 20)}-${emailHash.substring(20, 32)}`;
}

export async function createDexUser(
  email: string,
  password: string,
  username: string
): Promise<{ id: string; email: string; username: string }> {
  const client = getClient();

  const passwordHash = hashSync(password, genSaltSync(10));
  const userId = generateUserIdFromEmail(email);
  const hashBuffer = Buffer.from(passwordHash, 'utf-8');

  return new Promise((resolve, reject) => {
    client.CreatePassword(
      {
        password: {
          email,
          username,
          user_id: userId,
          hash: hashBuffer,
        },
      },
      (error: any, response: any) => {
        if (error) {
          if (error.message?.includes('already exists')) {
            return reject(new Error('A user with this email already exists'));
          }
          return reject(error);
        }
        resolve({ id: userId, email, username });
      }
    );
  });
}

export async function verifyDexPassword(
  email: string,
  password: string
): Promise<boolean> {
  const client = getClient();

  return new Promise((resolve, reject) => {
    client.VerifyPassword(
      { email, password },
      (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response.verified === true);
      }
    );
  });
}
