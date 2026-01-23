import NextAuth from 'next-auth';
import prisma from '@/lib/prisma';
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
    async signIn({ profile, user }) {
      try {
        if (profile) {
          const select = {
            id: true,
            picture: true,
            role: true,
            firstName: true,
            lastName: true,
          };
          let admin = await prisma.admin.findUnique({
            where: {
              googleUserId: profile.sub,
            },
            select,
          });

          if (!admin) {
            admin = await prisma.admin.findFirst({
              where: {
                email: profile.email,
                googleUserId: null,
              },
              select: {
                ...select,
                updatedAt: true,
              },
            });

            if (admin) {
              // claim this account
              const currentTime = Math.floor(new Date().getTime() / 1000);
              const result = await prisma.admin.updateMany({
                data: {
                  googleUserId: profile.sub,
                  updatedAt: currentTime,
                },
                where: {
                  email: profile.email,
                  googleUserId: null,
                },
              });

              if (result.count === 0) {
                console.error(
                  `SignIn failed: admin ID ${admin.id} - googleUserId already set, cannot claim account`,
                );
                return '/signin?error=UnableToSignIn';
              }
            }
          }

          if (!admin) return '/signin?error=AccountNotFound';
          
          user.id = admin.id;
          user.role = admin.role;
          user.picture = admin.picture;
          user.firstName = admin.firstName;
          user.lastName = admin.lastName;
        }

        return true;       
      } catch (err) {
        console.error(err);
        return '/signin?error=UnknownError';
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.picture = user.picture;
        token.firstName = user.firstName;
        token.lastName = user.lastName;

        delete token.name;
      }

      if (trigger === 'update') {
        // updateSession can called in any place, so we cannot ensure each property exists,
        // cause it, we need check every property that really need to updated
        if (session?.firstName) token.firstName = session.firstName;
        if (session?.lastName) token.lastName = session.lastName;
        if (session?.picture) token.picture = session.picture;
      }
      
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.userId,
        role: token.role,
        firstName: token.firstName,
        lastName: token.lastName,
        email: token.email,
        image: token.picture,
      };

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
