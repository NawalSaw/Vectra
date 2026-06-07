// import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
// import { TanStackDevtools } from '@tanstack/react-devtools'
// import Footer from '../components/Footer'
// import Header from '../components/Header'

// import appCss from '../styles.css?url'

// const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

// export const Route = createRootRoute({
//   head: () => ({
//     meta: [
//       {
//         charSet: 'utf-8',
//       },
//       {
//         name: 'viewport',
//         content: 'width=device-width, initial-scale=1',
//       },
//       {
//         title: 'TanStack Start Starter',
//       },
//     ],
//     links: [
//       {
//         rel: 'stylesheet',
//         href: appCss,
//       },
//     ],
//   }),
//   shellComponent: RootDocument,
// })

// function RootDocument({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <head>
//         <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
//         <HeadContent />
//       </head>
//       <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
//         <Header />
//         {children}
//         <Footer />
//         <TanStackDevtools
//           config={{
//             position: 'bottom-right',
//           }}
//           plugins={[
//             {
//               name: 'Tanstack Router',
//               render: <TanStackRouterDevtoolsPanel />,
//             },
//           ]}
//         />
//         <Scripts />
//       </body>
//     </html>
//   )
// }

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from '@clerk/tanstack-react-start'
import { useRouterState } from "@tanstack/react-router";

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "sonner";
import { Header } from "@/components/landing/Header";
import { useCurrentUser } from "@/hooks/use-user";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function UserHydrator() {
  useCurrentUser();

  return null;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vectra — AI Image Generation & SVG Editing Studio" },
      { name: "description", content: "Generate, vectorize, and edit. A premium AI studio for image generation and SVG editing — built for designers who care about craft." },
      { name: "author", content: "Vectra" },
      { property: "og:title", content: "Vectra — AI Image & SVG Studio" },
      { property: "og:description", content: "Generate stunning visuals with AI, convert to crisp SVG, and edit with a Figma-grade vector editor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
const pathname = useRouterState({
  select: (state) => state.location.pathname,
});
const condition = 
       (pathname !== '/')
    && (pathname !== '/editor') 
    && (pathname !== '/login') 
    && (pathname !== '/signup') 
    && (pathname !== '/dashboard')
    && (pathname !== '/assets');  
 
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider>
          <Toaster />
          {condition && <Header />}
          {children}
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <UserHydrator />
      <Outlet />
    </QueryClientProvider>
  );
}
