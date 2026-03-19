import NextAuth from "next-auth"

const { auth } = NextAuth({
  providers: [],
  pages: { signIn: '/signin' },
})

export default auth

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
