import NextAuth from 'next-auth';
import pjmeDBPrismaClient from '@/lib/pjme-prisma-client';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: '/signin',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
  },
  theme: { colorScheme: 'light' },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If redirect URL is specified with relative path
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // if user access protected page, and force redirect to /signin
      // because not signin yet, then redirect back to page is want user access
      // if user sign in success
      const alreadyRedirected = /callbackUrl=/.test(url);
      if (alreadyRedirected) {
        const callbackUrl = decodeURIComponent(url.split('callbackUrl=')[1]);
        if (new URL(callbackUrl).origin === baseUrl) return callbackUrl;
      }

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url

      return baseUrl;
    },
    async signIn({ profile }) {
      if (profile) {
        const user = await pjmeDBPrismaClient.admin.findUnique({
          where: {
            auth_id: profile.sub,
          },
          select: { id: true },
        });
        if (!user) return '/signin';
      }
      return true;
    },
    async jwt({ token, account, profile, trigger, session }) {
      if (account && profile) {
        const user = await pjmeDBPrismaClient.admin.findUnique({
          where: {
            auth_id: profile.sub,
          },
          select: { id: true, picture: true },
        });

        token.userId = user.id;
        token.picture = user.picture;
        token.first_name = profile.given_name;
        token.accessToken = account.access_token;
      }
      if (trigger === 'update' && session?.first_name && session?.picture) {
        token.first_name = session.first_name;
        token.picture = session.picture;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.image = token.picture;
      session.user.name = token.first_name;
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
