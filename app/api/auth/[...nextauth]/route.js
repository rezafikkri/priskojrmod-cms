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
            first_name: true,
          };
          let admin = await pjmeDBPrismaClient.admin.findUnique({
            where: {
              auth_id: profile.sub,
            },
            select,
          });

          if (!admin) {
            admin = await pjmeDBPrismaClient.admin.findFirst({
              where: {
                email: profile.email,
                auth_id: null,
              },
              select: {
                ...select,
                updated_at: true,
              },
            });

            if (admin) {
              // claim this account
              const currentTime = Math.floor(new Date().getTime() / 1000);
              const result = await pjmeDBPrismaClient.admin.updateMany({
                data: {
                  auth_id: profile.sub,
                  updated_at: currentTime,
                },
                where: {
                  email: profile.email,
                  auth_id: null,
                },
              });

              if (result.count === 0) {
                console.error(
                  `SignIn failed: admin ID ${admin.id} - auth_id already set, cannot claim account`,
                );
                return '/signin?error=UnableToSignIn';
              }
            }
          }

          if (!admin) return '/signin?error=AccountNotFound';
          
          user.id = admin.id;
          user.role = admin.role;
          user.picture = admin.picture;
          user.first_name = admin.first_name;
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
        token.first_name = user.first_name;
      }

      if (trigger === 'update') {
        if (session?.first_name) {
          token.first_name = session.first_name;
        }

        if (session?.picture) {
          token.picture = session.picture;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.role = token.role;
      session.user.name = token.first_name;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
