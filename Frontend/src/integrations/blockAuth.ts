
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";

export const blockAuth = createServerFn().handler(async () => {
  const { isAuthenticated } = await auth()

  if (isAuthenticated) {
    // This will error because you're redirecting to a path that doesn't exist yet
    // You can create a sign-in route to handle this
    // See https://clerk.com/docs/tanstack-react-start/guides/development/custom-sign-in-or-up-page
    throw redirect({
      to: '/dashboard',
    })
  }

  return { isAuthenticated }
})