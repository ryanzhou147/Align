import type { NextAuthOptions, Account, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account) {
        token.access_token = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      (session as Session & { access_token?: string }).access_token =
        token.access_token as string;
      return session;
    },
  },
};
