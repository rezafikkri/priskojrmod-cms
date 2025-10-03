import { JWT } from 'google-auth-library';

export function getGoogleClient(scopes) {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes,
  });
}

export function getGoogleDriveClient() {
  return getGoogleClient([
    'https://www.googleapis.com/auth/drive',
  ]);
}
