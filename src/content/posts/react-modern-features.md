---
title: React Modern Features Deep Dive - Server Components, Server Actions, use(), ref as prop, and the Compiler
publishedOn: 2026-07-23
summary: A complete production grade reference on React's modern feature set. We cover Server Components, Server Actions, the use() hook, ref as a prop, useFormStatus, useOptimistic, useActionState, the React Compiler, and Document Metadata, each with intuition, internals, comparisons, and production insights.
tags: ["frontend", "react"]
keywords: "React Server Components, Server Actions, use hook, ref as prop, useFormStatus, useOptimistic, useActionState, React Compiler, Document Metadata, RSC Payload, Flight Protocol, Hydration"
author: Sanjib Roy
---

Most of us learned React one hook at a time. We picked up `useState`, then `useEffect`, then maybe `useContext`, and at some point we had enough pieces to build almost anything. Then, somewhere between one project and the next, the ground shifted. Components started running on a server and never shipping any JavaScript at all. Forms started working before we had written a single `onSubmit` handler. A hook called `use` showed up that could be called conditionally, breaking a rule we had memorized since day one.

None of this is random. Every feature covered here solves a specific, painful problem that production teams kept running into, and once we see the problem clearly, the shape of the solution stops looking strange and starts looking obvious. This article walks through that entire modern feature set from first principles, the same way we would walk a new engineer through it on a whiteboard, building one idea on top of the previous one until the whole picture clicks into place.

We will move through nine connected features. Server Components, the foundation everything else sits on top of. Server Actions, the way we mutate data without hand rolling an API layer. The `use()` hook, a new way to read promises and context. `ref` as a plain prop, the retirement of `forwardRef`. `useFormStatus`, `useOptimistic`, and `useActionState`, the three hooks that make forms feel instant. The React Compiler, which quietly removes most of the manual memoization we used to write by hand. And Document Metadata, the small but genuinely useful ability to render a `<title>` tag from anywhere in our tree.

Before any of that, we need to get one very common confusion out of the way, because almost nothing else in this article makes sense until it is resolved.

## Table of Contents

- [🚀 Quick Revision Hub](#-quick-revision-hub)
- [What Exactly Is "The Server"?](#what-exactly-is-the-server)
- [Server Components](#server-components)
  - [Common Confusion](#server-components-common-confusion)
- [The Complete Request Lifecycle](#the-complete-request-lifecycle)
- [Browser and Server Communication](#browser-and-server-communication)
- [The RSC Payload and the Flight Protocol](#the-rsc-payload-and-the-flight-protocol)
- [HTML vs RSC Payload](#html-vs-rsc-payload)
- [Hydration in a Server Components World](#hydration-in-a-server-components-world)
- [Server Actions](#server-actions)
  - [Common Confusion](#server-actions-common-confusion)
- [The use() Hook](#the-use-hook)
- [ref as a Prop](#ref-as-a-prop)
- [useFormStatus](#useformstatus)
- [useOptimistic](#useoptimistic)
- [useActionState](#useactionstate)
- [Forms Working Together, a Combined Example](#forms-working-together-a-combined-example)
- [The React Compiler](#the-react-compiler)
- [Document Metadata](#document-metadata)
- [Comparison Tables](#comparison-tables)
- [Common Errors and Debugging](#common-errors-and-debugging)
- [Interview Preparation](#interview-preparation)
- [Best Practices Summary](#best-practices-summary)
- [Bringing It All Together](#bringing-it-all-together)

## What Exactly Is "The Server"?

This is the single most common point of confusion for anyone arriving at Server Components from a traditional React background, so it deserves a direct answer before anything else.

"The server" in React does not refer to any one specific technology. It refers to wherever our React rendering code executes before the result reaches the browser. That environment can be a traditional Node process running on our own infrastructure, it can be Bun or Deno, it can be an edge runtime like the ones offered by various hosting platforms, and it can be a serverless function that only spins up per request. React itself does not care which of these we choose, it only cares that the environment can run JavaScript and does not have browser specific globals available.

It is not automatically the same Express or Node backend we may already run for other purposes, though it certainly can be, if our framework is configured that way. In many setups, this "server" is entirely managed by the framework itself, meaning we never write or deploy a traditional backend server at all, the framework's build and deployment tooling handles running our Server Components and Server Actions on our behalf.

This is also why Server Components do not require us to build a REST API for everything. A Server Component can reach directly into a database, read a file from disk, or call an internal service, because it is already running in a trusted backend environment. There is no need to expose that data through a separate public API endpoint just so a component sitting inside the same application can read it. When a REST or GraphQL API genuinely makes sense, for example because a separate mobile app also needs that same data, we are still completely free to use one, Server Components simply remove the requirement to build one purely to satisfy our own React tree.

**⚡ Good to know.** When there is no custom backend at all, and the framework is fully managing this environment, that does not mean there is no server involved. It means the framework is generating and managing that server layer on our behalf, often deploying it as serverless functions or edge functions rather than one long running process we would recognize as a traditional server.

## Server Components

### What Is It

A Server Component is a component that renders exclusively on the server, or at build time, and whose own JavaScript code never gets sent to the browser at all. What reaches the client is not the component's source code, it is a serialized description of the finished output that description produces, ready for React to reconstruct into the final UI.

### Why It Exists

Two separate, long standing pain points motivated this feature.

The first is bundle size. In a traditional client rendered React app, every component's code, and every library that component imports, ships to the browser, even if that component only ever runs once to render some static looking content. A markdown parser, a heavy date formatting library, or a database client used only to prepare data for display would all get bundled and sent to every visitor, regardless of whether the visitor's browser ever actually needs to execute that code itself.

The second is the awkward dance required just to get data into a component. Historically, getting server side data into a React tree meant either rendering everything on the server the traditional way and accepting a full page reload for every interaction, or building a separate API endpoint, calling it with `fetch` from a `useEffect`, and manually managing loading and error state for what is often a very simple "just show me this data" requirement.

### The Problem It Solves

Server Components let a component fetch data directly, using regular server side code like a database query, and render the result, with zero client bundle cost for either the component's own code or the libraries it used to fetch and shape that data. There is no API layer to build purely to satisfy this need, and no client side loading state boilerplate required just to show data that was already known at render time on the server.

### How It Works Internally

When a framework that supports Server Components handles a request, it renders the Server Component tree on the server exactly like calling regular functions, resolving any data fetching along the way. Instead of producing an HTML string directly at this stage, React produces the RSC Payload, a special serialized description of the resulting tree, covered in full detail in its own section below. Any Client Components encountered along the way are not executed on the server, they are instead represented in that payload as references, essentially instructions saying "a Client Component belongs here, here are its props, and here is where to find its actual code."

The framework then typically also renders this to HTML for the very first response, so the browser has something to paint immediately, alongside embedding or separately streaming the RSC Payload the client runtime needs to reconstruct and manage the tree, attach event handlers within Client Components, and handle subsequent navigations.

### Why It Was Designed This Way

A deliberate design decision worth calling out is that Server Components are the default, and Client Components are the explicit opt in, marked with a `"use client"` directive at the top of a file. This ordering matters. It means the natural, unmarked state of a component in a supporting framework leans toward the server, and interactivity has to be deliberately requested, rather than the other way around. This encourages an architecture where interactive, stateful logic gets pushed to the smallest possible leaves of the tree, and everything that does not genuinely need to run in the browser stays out of the client bundle by default rather than by careful discipline.

```
                     App (Server Component)
                    /                        \
        ProductInfo (Server)          AddToCartButton (Client, "use client")
              |
        PriceDisplay (Server)
```

Only `AddToCartButton` and anything it imports ships to the browser. `ProductInfo` and `PriceDisplay`, along with whatever data fetching or formatting libraries they use, never do.

### When To Use It

Server Components are the right default for anything that does not need interactivity, browser only APIs, or React state tied to user interaction. This includes most data display, page layout, navigation shells, and anything reading directly from a data source. In practice, in a framework built around this model, we should be reaching for `"use client"` deliberately, rather than reaching for Server Components deliberately, since the server is already the default.

### When To Avoid It

A Server Component cannot use `useState`, `useEffect`, `useContext` for values coming from a Client Component provider, or any browser only API like `window`, `localStorage`, or event handlers like `onClick`. The moment a piece of UI genuinely needs to hold interactive state, respond to user events, or read something only the browser knows, it belongs in a Client Component instead.

### Tradeoffs

The clear win is a smaller client bundle and simpler data access. The tradeoff is a genuinely new mental model to internalize, understanding exactly where the server and client boundary sits in a given file, and being deliberate about which libraries and logic live on which side of that boundary, since accidentally importing a server-only library into a Client Component, or vice versa, produces build errors that can be confusing the first several times we encounter them.

### How It Compares To Older Approaches

Traditional SSR renders on the server too, but the entire component's JavaScript still ships afterward so the browser can hydrate it into an interactive copy. Server Components never ship at all for the parts of the tree that stay purely server side, there is nothing to hydrate there, because there was never any client side representation of that component to make interactive in the first place.

<a id="server-components-common-confusion"></a>
### Common Confusion

**Is this the same as traditional SSR?** No. Traditional SSR is about *where the first render happens*, the resulting HTML is still followed by shipping full component code to hydrate on the client. Server Components are about *which components ever run on the client at all*, and for a pure Server Component, the answer is never.

**Is this my backend?** It runs in a backend-like environment, but it is not necessarily "our backend" in the sense of an existing service we already maintain, unless we specifically wire it up that way.

**Why can't we use `useState` here?** Because a Server Component never runs in the browser, state tied to user interaction has nowhere to live or update in response to events, since there is no ongoing client side instance of this component receiving those events in the first place.

**💡 Interesting fact.** A Server Component can be declared `async` and directly `await` a database call or a `fetch` request in its body, something a Client Component's function body can never do directly, because an async component cannot be handled by the traditional client side render and re render model the way a synchronous one can.

## The Complete Request Lifecycle

Understanding the full path from a browser request to an interactive page removes a lot of the mystery around where exactly React's various pieces sit.

```
Browser
   |
   |  1. Initial HTTP request for a page
   v
Server (Node, Bun, Deno, or an edge runtime)
   |
   |  2. Framework resolves which route and layout tree apply
   v
React renders the Server Component tree
   |
   |  3. Data fetching happens directly inside Server Components
   v
React generates the RSC Payload
   |
   |  4. A serialized description of the finished tree, including
   |     references to any Client Components
   v
HTML Generation
   |
   |  5. React also produces real HTML from that same render, so
   |     the browser has something to paint immediately
   v
Browser receives the HTML response
   |
   |  6. The page becomes visible right away, showing server
   |     rendered content, even before any JS has executed
   v
Hydration
   |
   |  7. The Client Components' JS loads and React attaches event
   |     handlers, using the RSC Payload to know exactly where
   |     each Client Component belongs in the tree
   v
Interactive UI
```

Each step is worth calling out individually. The initial request is a completely ordinary HTTP request, nothing React specific about it yet. Route and layout resolution is handled by whatever framework sits around React, not by React itself. The actual React specific work begins once the framework hands control to React to render the matched component tree. Data fetching happens inline inside Server Components rather than through a separate client side round trip. The RSC Payload is what actually gets sent for reconstructing the tree and its Client Component boundaries, and the HTML generated alongside it is what lets the browser paint something before any JavaScript has run at all. Hydration only concerns the Client Component portions of the tree, since pure Server Component output has nothing to hydrate, there is no client side instance of it that would need matching up.

**🤔 Ever wondered why the HTML shows up before hydration finishes?** Because HTML generation and hydration are two genuinely separate steps. The browser can parse and paint plain HTML immediately, regardless of whether any JavaScript describing how to make parts of that HTML interactive has finished downloading yet. This is precisely why we can often see and read a server rendered page before buttons on it actually respond to clicks, that gap is the hydration window.

## Browser and Server Communication

Once the initial page has loaded, subsequent communication between the browser and the server depends heavily on what kind of navigation or update is happening.

A full page navigation, like typing a new URL directly or a traditional link click outside of client side routing, triggers the same full lifecycle described above from scratch. A client side navigation, handled by the framework's router, typically requests only the RSC Payload for the new route rather than a full new HTML document, since the browser already has a working React tree it can update in place using that payload. A Server Action call, covered in detail shortly, triggers its own dedicated request carrying a reference to the specific server function along with its serialized arguments.

Frameworks commonly layer caching and prefetching on top of this. A link that is about to be visible or about to be hovered can have its RSC Payload prefetched ahead of time, so the actual navigation, once it happens, feels instant because the data is already sitting in a client side cache. None of this prefetching or caching behavior is a core part of React itself, it is framework level behavior built using React's underlying primitives.

Streaming plays a role throughout this too. Rather than waiting for every single Server Component in a tree to finish, including slow data dependent ones, before sending anything, React can send the parts of the tree that are ready immediately, and stream in the remaining parts, typically wrapped in `<Suspense>` boundaries, as their data becomes available. The browser can display the fast parts of a page right away, with fallback UI shown for the slower parts until their real content streams in behind the scenes.

### Fetching Server Components

A very natural question at this point is what exactly the browser is requesting when it needs a Server Component's output. It is not requesting one isolated component in the sense of a single file. It is requesting the RSC Payload for an entire route or an entire subtree, which itself already contains the fully resolved output of every nested Server Component within it, since the server already walked and rendered that entire structure before producing the payload. Nested Server Components inside that structure are already fully resolved by the time the payload leaves the server, there is no separate follow up request the browser makes per nested Server Component. Client Components embedded within that same structure are represented as references within the payload, and the browser separately ensures that referenced Client Component's own JavaScript bundle has been loaded so it can be instantiated and hydrated correctly in its designated spot.

## The RSC Payload and the Flight Protocol

### What It Is

The RSC Payload is a specially serialized representation of a rendered Server Component tree, structured so that a React runtime on the client can efficiently reconstruct that tree, insert Client Components at exactly the right positions, and update the visible UI, all without needing to re execute any Server Component code itself. The specific streaming, chunk based wire format used to transmit this payload is often referred to internally as the Flight Protocol.

### Why It Exists

HTML alone genuinely is not enough here, and it is worth being precise about why. HTML describes what to paint, but it carries none of the structural information React needs to later reconcile that tree against future updates, distinguish where a Client Component boundary begins, or know which props that Client Component was actually given. Plain JSON, on its own, also is not enough, because a rendered tree can contain values JSON cannot represent on its own, like references to Client Component modules, and because a naive JSON tree would not support the kind of streaming, chunked delivery React relies on for showing partial results as slower Server Components resolve.

### What It Contains

The payload describes the resolved output of Server Components as a compact tree structure, references pointing to specific Client Component modules wherever one appears in that tree, and the serialized props that should be passed to each of those Client Components. It also carries enough structural information for React to correctly reconcile this tree against whatever the client is currently showing, similar in spirit to how a diffable description works during ordinary client side updates.

### What It Does Not Contain

It does not contain the actual source code of Server Components themselves, since that code already fully executed on the server and only its result matters from here on. It also does not contain the source code of Client Components, only a reference to where that code lives, the browser is responsible for separately loading a Client Component's actual bundle through ordinary script loading.

### How React Reconstructs The Tree

On the client, React's runtime reads this payload and rebuilds an internal tree representation from it, instantiating Client Components using their already loaded modules and the props supplied in the payload, and treating the Server Component portions as already resolved, static output slotted into their correct positions. This is also how, on a subsequent client side navigation, React can efficiently update only the parts of the currently displayed tree that actually differ from a newly fetched payload, rather than discarding and rebuilding everything.

### Comparison With Other Representations

Compared to plain HTML, the RSC Payload carries structural and component boundary information HTML has no way to express. Compared to plain JSON, it supports references to Client Component modules and streaming delivery in a way generic JSON does not handle out of the box. Compared to the general concept of a virtual DOM, the RSC Payload is a serialized, transportable description meant to cross the network between two separate runtimes, whereas a virtual DOM tree traditionally exists only in memory within a single running JavaScript process. Compared to typical hydration data used in older SSR approaches, which usually just needs to convey initial state and props so the client can pick up an already rendered DOM, the RSC Payload additionally carries the entire resolved output of the server rendered portion of the tree itself.

```
Flight Protocol chunk stream (conceptual)

Chunk 1: describes the outer layout tree, references ProductInfo
Chunk 2: resolved output of ProductInfo (a Server Component)
Chunk 3: reference to AddToCartButton (a Client Component) + its props
Chunk 4: (streamed later) resolved output of a slower Server Component
          that was wrapped in Suspense, once its data was ready
```

## HTML vs RSC Payload

| Aspect | HTML | RSC Payload |
|---|---|---|
| Purpose | Gives the browser something to paint immediately | Lets React reconstruct and later update the component tree |
| Contents | Markup describing visual structure | Serialized tree, Client Component references, props |
| Format | Standard markup, browser native | React and framework specific serialized format |
| Who consumes it | The browser's native HTML parser | React's client runtime |
| Browser involvement | Parsed and painted directly by the browser engine | Read and interpreted by React's JavaScript code |
| React involvement | Generated once from the render, not reused for updates | Actively used for both initial hydration and later updates |
| Generated by | Server render, once per request or per stream chunk | Same server render, produced alongside the HTML |
| Used for | First paint, before any JavaScript executes | Attaching interactivity correctly, and subsequent navigations |

## Hydration in a Server Components World

### What It Is

Hydration is the process of taking already existing, server rendered HTML and attaching the actual React event handlers and internal state to it, turning static looking markup into a fully interactive React tree, without throwing away and rebuilding that DOM from scratch.

### Selective and Progressive Hydration

In a Server Components architecture, hydration only concerns the Client Component portions of the tree, since pure Server Component output has no client side instance to attach anything to in the first place. Modern React also supports selective hydration, meaning different Client Component boundaries, often ones wrapped in `<Suspense>`, can hydrate independently and in whatever order actually matters most, rather than requiring the entire page's JavaScript to finish loading and executing before any single button becomes clickable. A boundary the user is actively trying to interact with can be prioritized for hydration ahead of one further down the page they have not scrolled to yet.

### Streaming Hydration and Event Replay

Because HTML and the RSC Payload can both arrive in streamed chunks rather than all at once, hydration itself can begin on earlier chunks while later chunks are still arriving. If a user clicks on a server rendered element before its corresponding Client Component has actually finished hydrating, React captures that interaction and replays it once hydration for that specific element completes, rather than silently dropping the click.

### How These Pieces Relate

The HTML gives the browser something to paint. The RSC Payload tells React exactly where each Client Component belongs and what props it received. The browser downloads each Client Component's actual code separately. React then combines all three, the existing DOM from the HTML, the structural map from the payload, and the loaded component code, to attach real event handling to exactly the right elements, without discarding the DOM the user is already looking at.

**🧠 Behind the scenes.** A hydration mismatch error, where React complains that the server rendered output does not match what the client believes it should look like, almost always traces back to a Client Component producing different output on the server than it does on its very first client render, commonly caused by accidentally relying on `Date.now()`, `Math.random()`, or a browser only value like `window.innerWidth` directly during render.

## Server Actions

### What Is It

A Server Action is an async function marked with the `"use server"` directive, either at the top of its own file or inline at the top of the function body, that can be called directly from client code, including passed straight into a form's `action` attribute, even though the function itself always executes on the server.

### Why It Exists

Before Server Actions, mutating data from a form generally meant one of two paths. Either we used a plain HTML form that performed a full page reload on every submission, which is simple but feels dated and loses client side state. Or we built a dedicated API route, wrote a `fetch` call to hit it from the client, manually serialized the request body, manually parsed the response, and manually tracked loading and error state around all of it. Server Actions collapse this entire chain into writing one async function and calling it, or handing it directly to a form.

### How It Works Internally

At build time, the framework's tooling recognizes the `"use server"` directive and transforms that function on the client side into a lightweight stub. Calling that stub, whether directly or through a form submission, triggers a network request that carries a reference identifying exactly which server function to run, along with the serialized arguments being passed to it. The server receives this request, resolves the reference back to the real function, executes it in the actual server environment, and streams the serialized result back to the client, where React resolves the corresponding promise or updates the corresponding hook state.

```
Client                                   Server
  |                                         |
  | user submits a form or calls action()  |
  |---------------------------------------->|
  |   request carries: function reference  |
  |   + serialized arguments               |
  |                                         |
  |                                    resolves reference
  |                                    executes real function
  |                                    (validation, DB write, etc.)
  |                                         |
  |<----------------------------------------|
  |   response: serialized return value    |
  |                                         |
  React updates state / useActionState / useOptimistic
```

### Forms, Validation, Security, and Redirects

Because a Server Action is a real network endpoint under the hood, every normal server side concern still applies in full. Input must be validated on the server, since client side validation alone can always be bypassed. The caller's identity and permissions must still be checked inside the action itself, exactly as we would for any other backend endpoint, a Server Action grants no automatic authentication or authorization for free. A Server Action can also trigger a server side redirect as part of its normal completion, and can set cookies or read request headers, since it is genuinely running in that server environment with access to those same primitives.

### Cache Invalidation and Optimistic Updates

After a Server Action successfully mutates data, whatever previously cached Server Component output depended on that data needs to be invalidated so subsequent renders reflect the change, something frameworks typically expose through a dedicated revalidation API called from within the action. On the client side, `useOptimistic`, covered in its own section shortly, is commonly paired with Server Actions specifically to show the expected result of a mutation immediately, while the actual request is still in flight.

<a id="server-actions-common-confusion"></a>
### Common Confusion

**Is this the same as an API route?** Functionally, yes, in the sense that it is a real server endpoint reachable over the network. The difference is entirely in ergonomics, we author it as a plain function rather than manually building and wiring up a separate route ourselves.

**Is this safe by default?** No safer than any other backend endpoint we would write ourselves. Every input still needs validation and every caller still needs an authorization check, written explicitly inside the action.

**Why can we call a server-only function from a Client Component?** We are not actually calling the real function from the browser. We are calling a client side stub that knows how to make the correct network request, the real function body only ever executes on the server.

### When To Use It

Server Actions are the natural choice for essentially any data mutation triggered from a form or a user initiated event, replacing what would previously have been a hand built API route plus a client side `fetch` call.

### When To Avoid It

For mutations that also need to be triggered from an entirely separate client, like a native mobile app or a third party integration that cannot invoke a framework specific Server Action mechanism, a conventional API endpoint that any HTTP client can call is still the right tool, and a Server Action can often simply call into the same underlying logic that endpoint uses.

## The use() Hook

### What Is It

`use()` is a function that lets a component read the resolved value of a Promise, suspending the component under a `<Suspense>` boundary while that Promise is pending, or read a Context value, directly during render. Unlike traditional hooks, `use()` can be called conditionally, inside loops, and after early returns.

### Why It Exists

Before `use()`, consuming an async value inside a component during render was not really possible in a straightforward way, we typically fell back on `useEffect` combined with `useState` to store the eventual result, plus manual loading and error handling around that whole process. `use()` gives us a much more direct way to say "here is a value that may not be ready yet, wait for it right here if needed," while integrating cleanly with Suspense, which already understands how to show fallback UI for exactly this situation.

Context also benefited from this unification. `useContext` could only ever be called unconditionally at the top of a component, matching the same fixed call order requirement every other hook follows. `use(context)` reads context too, but without that restriction, since it does not rely on the same positional tracking mechanism.

### How It Works Internally

When `use()` receives a Promise that has not yet resolved, it throws that Promise internally, which is the exact same underlying mechanism Suspense has always used to detect that a component is not ready and should show its nearest fallback instead. Once the Promise resolves, React retries rendering that component, and this time `use()` returns the resolved value directly rather than throwing again. When `use()` receives a Context object instead of a Promise, it simply reads the current value for that context at this point in the tree, essentially behaving like `useContext`, just without the same fixed calling position restriction.

### Why It Can Break The Rules Of Hooks

The Rules of Hooks exist specifically because most hooks rely on React tracking them by their call order across renders, calling `useState` for the third time in a render always needs to correspond to the same piece of state as the third `useState` call in the previous render, and calling hooks conditionally would break that fixed positional correspondence. `use()` does not depend on this same positional tracking mechanism, since it operates directly on whatever Promise or Context reference it was handed rather than needing to be matched up by calling position, which is precisely what makes it safe to call conditionally.

### When To Use It

`use()` fits naturally when a component needs to read a Promise that was already created elsewhere, commonly by a Server Component passing a Promise down as a prop to a Client Component, letting that Client Component suspend and stream in its own content independently. It also fits well for reading context conditionally, for example only reading a particular context value when a certain prop is present.

### When To Avoid It

`use()` does not create or cache Promises itself, calling it with a brand new Promise created fresh on every single render will cause that component to suspend and retry indefinitely, since a new, never before seen Promise is handed to it every time. The Promise passed to `use()` needs to come from somewhere stable, like a Server Component boundary, a ref, or a proper caching layer, not freshly constructed inline during render.

```jsx
// Server Component
export default function ProductPage({ id }) {
  const reviewsPromise = fetchReviews(id); // not awaited here
  return (
    <Suspense fallback={<ReviewsSkeleton />}>
      <Reviews reviewsPromise={reviewsPromise} />
    </Suspense>
  );
}

// Client Component
"use client";
function Reviews({ reviewsPromise }) {
  const reviews = use(reviewsPromise);
  return <ul>{reviews.map(r => <li key={r.id}>{r.text}</li>)}</ul>;
}
```

### Tradeoffs and Comparison With Suspense Alone

`<Suspense>` on its own is a boundary, it defines where a fallback should show, but it needs something inside it to actually trigger suspension, historically a data fetching library integrated with React internally to do this. `use()` gives us a direct, explicit way to trigger that same suspension behavior ourselves, from any component, using a Promise we already have in hand.

## ref as a Prop

### What Is It

Starting with React 19, function components can declare `ref` as a normal named prop, right alongside every other prop, and receive whatever value was passed to it through JSX exactly the way any other prop works. Wrapping a component in `forwardRef` purely to receive a ref is no longer required.

### Why It Existed As A Separate Case Before

`ref`, like `key`, was treated as a reserved prop React intercepted before a component's own function ever received its `props` object, specifically to prevent accidental misuse and to keep both concepts, "how do I identify this element across renders" for `key`, and "how do I get an imperative handle to this element" for `ref`, as things only React itself directly managed. That protection meant a function component wanting to accept and forward a ref down to an actual DOM node needed to explicitly opt in using `forwardRef`, which wrapped the component and supplied `ref` as a second, separate argument outside the normal `props` object entirely.

### The Problem This Created

`forwardRef` worked, but it added an extra wrapping layer to every reusable component that needed to expose a ref, made TypeScript typing meaningfully more verbose, and was a very common source of confusion for anyone building or consuming a component library, since remembering exactly when a component needed this wrapper and when it did not was an easy detail to get wrong.

```jsx
// Before, React 18 and earlier
const TextInput = forwardRef(function TextInput(props, ref) {
  return <input ref={ref} {...props} />;
});

// Now, React 19 and later
function TextInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

### When To Use It

Any time a reusable component needs to expose access to an underlying DOM node, or to an imperative handle created with `useImperativeHandle`, the plain prop based approach is now the default, straightforward path.

### When forwardRef Still Matters

`forwardRef` continues to work for backward compatibility, and existing codebases are not required to migrate immediately. It remains relevant when working with or maintaining code written against earlier React versions.

## useFormStatus

### What Is It

`useFormStatus` is a hook that reads the pending state, submitted form data, HTTP method, and target action of the nearest enclosing `<form>` element, from any component rendered somewhere inside that form.

### Why It Exists

A submit button is very often a separate, reusable component, sometimes nested a few layers deep inside other wrapper components, rather than something written inline right next to the form itself. Before this hook, showing that button as disabled or showing a loading spinner while the form submits meant manually lifting a piece of pending state up to wherever the form itself lived, and threading it back down through every intermediate layer as a prop, purely so a button several components away could read it.

### How It Works

`useFormStatus` reads from React's internal form status context, which is automatically provided by the nearest ancestor `<form>` whose `action` is a function, without us needing to set up any provider ourselves. It must be called from a component that is genuinely a descendant of that form, calling it from the same component that renders the form itself will always report `pending: false`, since that component is not nested inside the form's own subtree during that particular render.

```jsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Saving..." : "Save"}</button>;
}

function ProfileForm() {
  return (
    <form action={updateProfile}>
      <input name="name" />
      <SubmitButton />
    </form>
  );
}
```

### When To Use It

Ideal for reusable submit buttons, inline loading indicators, or disabling other inputs while a form is mid submission, especially in component libraries where the button component has no direct knowledge of which specific form it will end up inside.

### When To Avoid It

It only tracks a native `<form>` element's own submission lifecycle tied to a function `action`. For tracking the pending state of some unrelated async operation that has nothing to do with a form submission, ordinary state management fits better.

## useOptimistic

### What Is It

`useOptimistic` lets a component immediately display a predicted version of some state while a real async update is still in progress, and automatically reconciles that optimistic value back to the true state once the underlying operation actually settles.

### Why It Exists

Waiting for a full network round trip before showing any visual response to an action, like sending a chat message or liking a post, makes even a genuinely fast backend feel sluggish, since the user stares at an unchanged screen the entire time the request is in flight. Optimistic UI patterns existed long before this hook, engineers have hand rolled them for years, but doing it correctly by hand meant carefully managing a separate piece of temporary state, and carefully reverting it correctly if the real update failed or produced a different result than predicted. `useOptimistic` handles that reconciliation automatically.

### How It Works Internally

`useOptimistic` takes the current real state value and an update function describing how to compute a predicted next value from it, and returns two things, the value to actually render, which reflects the optimistic prediction whenever one is pending, and a function to trigger that optimistic update. Internally, this optimistic value is tracked separately from the real state, and layered on top of it only while an associated transition, typically the Server Action or async function actually performing the real update, is still pending. Once that real state updates, React reconciles, showing the real value going forward, and if the underlying action never actually produces the predicted change, for example because it failed, the display naturally falls back to whatever the last confirmed real state was.

```jsx
function LikeButton({ postId, initialLikes, liked }) {
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(
    liked,
    (_, newLiked) => newLiked
  );

  async function handleClick() {
    setOptimisticLiked(!optimisticLiked);
    await toggleLikeAction(postId);
  }

  return (
    <button onClick={handleClick}>
      {optimisticLiked ? "Liked" : "Like"}
    </button>
  );
}
```

### When To Use It

Any interaction where showing the predicted outcome immediately meaningfully improves perceived responsiveness, and where a failure is either rare or can be gracefully communicated afterward, is a strong fit, common examples being likes, chat messages, adding an item to a cart, or reordering a list.

### When To Avoid It

For actions where showing an incorrect prediction would be genuinely confusing or costly if it turns out wrong, for example a financial transfer amount, a more conservative approach that waits for real confirmation before updating the UI is usually the safer choice.

## useActionState

### What Is It

`useActionState` wires an action function, most commonly a Server Action, up to a piece of state representing that action's latest result, along with an automatically tracked pending flag, and returns a wrapped version of the action ready to be handed directly to a form's `action` prop.

### Why It Exists

Before this hook, using an async action from a form typically meant separately managing a state variable for the result, a state variable for whether a submission was currently in progress, and a manually written submit handler tying all of it together, repeated slightly differently in every single form across a codebase. `useActionState` consolidates this entire pattern into one hook call.

### How It Works

It takes the action function itself and an initial state value, and returns the current state, the wrapped action to hand to the form, and a pending boolean. The action function it wraps receives the previous state as its first argument on every call, which is what allows each new submission to build on or reference the result of the previous one, for example carrying forward field level validation errors from the last attempt.

```jsx
async function updateProfileAction(previousState, formData) {
  "use server";
  const name = formData.get("name");
  if (!name) {
    return { error: "Name is required" };
  }
  await db.updateProfile(name);
  return { success: true };
}

function ProfileForm() {
  const [state, formAction, pending] = useActionState(updateProfileAction, {});

  return (
    <form action={formAction}>
      <input name="name" />
      {state.error && <p>{state.error}</p>}
      <button disabled={pending}>Save</button>
    </form>
  );
}
```

### When To Use It

Any form driven by a Server Action, or any async action in general, that needs to track a result, surface validation errors, and reflect a pending state, benefits from this hook over hand rolling the equivalent with separate `useState` calls.

### How It Compares With Plain useState

A hand rolled combination of `useState` plus a manual submit handler can technically achieve something similar, but `useActionState` automatically tracks pending status through React's own transition machinery, integrates correctly with progressive enhancement in frameworks that support submitting a form before its JavaScript has fully loaded, and avoids the extra state variables and wiring a manual approach requires.

## Forms Working Together, a Combined Example

These three hooks are frequently used together, and seeing them combined makes each one's specific responsibility much clearer than seeing them in isolation.

```jsx
"use client";

function CommentForm({ postId }) {
  const [state, formAction] = useActionState(submitCommentAction, {});
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    state.comments ?? [],
    (current, newComment) => [...current, newComment]
  );

  return (
    <form
      action={async (formData) => {
        addOptimisticComment({ text: formData.get("text"), pending: true });
        await formAction(formData);
      }}
    >
      <textarea name="text" />
      <SubmitButton />
      <ul>
        {optimisticComments.map((c, i) => (
          <li key={i} style={{ opacity: c.pending ? 0.5 : 1 }}>{c.text}</li>
        ))}
      </ul>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Posting..." : "Post"}</button>;
}
```

`useActionState` owns the real, settled result of the Server Action. `useOptimistic` shows the predicted comment immediately, before that real result exists. `useFormStatus`, called from the nested `SubmitButton` component, reflects the form's pending status without that button needing any props threaded down to it at all.

## The React Compiler

### What Is It

The React Compiler is a build time tool that analyzes our component code and automatically inserts the equivalent of `useMemo`, `useCallback`, and `React.memo` wherever it determines doing so would meaningfully avoid unnecessary re rendering or recomputation, based on the actual data dependencies it detects through static analysis.

### Why It Exists

Manual memoization works, but it comes with real costs in practice. It is easy to forget in exactly the spot that actually needed it, easy to apply somewhere it provides no benefit, and easy to get subtly wrong by missing a dependency, none of which the previous chapter's discussion of `React.memo` shied away from. The Compiler's premise is straightforward, this kind of optimization is mechanical and rule based enough that a build tool can apply it more consistently and more completely than a team manually applying it file by file ever reliably will.

### How It Works

At build time, the Compiler analyzes each component's code, determines which computed values and callback functions genuinely depend on which specific inputs, and rewrites the component to cache those values and functions across renders automatically, skipping recomputation whenever their actual dependencies have not changed. This relies entirely on our components genuinely following the Rules of React, meaning render logic that is a pure function of props and state, with no hidden mutation of values outside the component during render, since the compiler's safety guarantees depend on that purity holding true.

### Relationship With Manual Memoization

`React.memo`, `useMemo`, and `useCallback` all still work exactly as before, and remain fully valid to write by hand. In practice, once the Compiler is adopted across a codebase, most of these manual calls become unnecessary, since the Compiler inserts equivalent optimizations automatically and more consistently. A narrower set of cases still benefits from manual memoization, generally ones motivated by something other than pure rendering performance, like intentionally preserving one specific stable object reference for an external library that specifically requires identity stability across renders.

### Limitations And Unsupported Patterns

Components or hooks that violate the Rules of React, for example mutating a prop object directly, relying on unstable module level mutable variables read during render, or calling hooks conditionally in ways that are not otherwise handled correctly, can produce components the Compiler either declines to optimize or, in genuinely broken cases, optimizes incorrectly, which is exactly why strict adherence to the Rules of React is more directly rewarded under the Compiler than it may have felt before.

### Migration

Adoption is designed to be incremental. The Compiler can generally be introduced file by file or directory by directory across an existing codebase rather than requiring an all at once rewrite, and existing manual `useMemo` and `useCallback` calls do not need to be immediately stripped out, they simply become largely redundant going forward.

**🚀 Deep dive.** The Compiler's output is not magic, it is genuinely just inserting the same kind of memoization code we would otherwise write by hand, wrapped around the exact values and callbacks its analysis determined were worth caching. Reading the Compiler's actual generated output on a real component is one of the fastest ways to build real intuition for when manual `useMemo` and `useCallback` would have helped in the first place, and when they never would have mattered at all.

## Document Metadata

### What Is It

React allows rendering tags like `<title>`, `<meta>`, and `<link>` directly from any component, anywhere in the tree, including deeply nested ones, and automatically hoists those tags into the actual document `<head>`, regardless of how far from the root of the page that component happens to sit. 

In frameworks like Next.js, the framework's Metadata API is generally preferred over rendering these tags directly because it provides additional framework-level optimizations for metadata management.

### Why It Exists

A page's title and description are naturally owned by whichever component represents that specific page's content, for example a product detail page component logically owns that product's title and description. But the actual `<head>` element lives structurally far outside that component, typically defined once near the very root of the entire application. Before this feature, associating metadata correctly with the component that owns it usually required a dedicated third party library, or manual `document.head` manipulation inside an effect, neither of which worked cleanly with server rendering and streaming.

### How It Works

When React encounters one of these specific tags rendered anywhere in the component tree, it recognizes it as document metadata and hoists it into the `<head>` automatically, both during server rendering, where it becomes part of the correct streamed HTML output, and during client side rendering and updates. React also handles reasonable deduplication for tags like `<title>`, where only one should logically exist at a time.

```jsx
function ProductPage({ product }) {
  return (
    <>
      <title>{product.name} | Our Store</title>
      <meta name="description" content={product.shortDescription} />
      <h1>{product.name}</h1>
      {/* rest of the page */}
    </>
  );
}
```

### Why It Matters More With Server Components

Because this hoisting works correctly during server rendering and streaming, and not only after client side hydration, the correct title and description can ship as part of the very first HTML response the server sends, which matters directly for search engines and for link preview cards on social platforms, both of which typically read metadata from the initial HTML rather than executing client side JavaScript first.

### When To Use It

Anywhere a specific piece of content, most commonly an individual page, needs its own title, description, or related link tags, and that content lives in a component nested away from the actual document root.

### When To Avoid It

For metadata that genuinely never changes across an entire application, like a persistent favicon link or a site-wide default title, defining it once near the root remains simpler than repeating equivalent logic across many individual page components.

## Comparison Tables

**Server Components vs Client Components**

| Aspect | Server Components | Client Components |
|---|---|---|
| Where it runs | Server or build time only | Browser, after hydration |
| Ships JS to browser | No | Yes |
| Can use useState, useEffect | No | Yes |
| Can access database, filesystem directly | Yes | No |
| Can access browser APIs | No | Yes |
| Marked with | Default, no directive needed | `"use client"` |

**SSR vs CSR vs SSG vs ISR vs RSC**

| Approach | Where render happens | Data freshness | JS shipped for that content |
|---|---|---|---|
| CSR | Entirely in the browser | Fetched client side, on demand | Full component code always ships |
| SSR | Server, per request | Fresh on every request | Full component code still ships for hydration |
| SSG | Build time, once | Fixed until next build | Full component code still ships for hydration |
| ISR | Build time, then periodically refreshed | Refreshed on an interval or on demand | Full component code still ships for hydration |
| RSC | Server, per request, for Server Component portions | Fresh, fetched directly in the component | No JS ships for pure Server Component portions |

**useOptimistic vs useTransition**

| Aspect | useOptimistic | useTransition |
|---|---|---|
| Purpose | Show a predicted value before real state updates | Mark an update as lower priority, interruptible |
| Returns | An optimistic value plus a setter | A pending boolean plus a startTransition function |
| Reverts automatically | Yes, once real state settles | Not applicable, it does not track a predicted value |
| Common pairing | Server Actions | useDeferredValue, Suspense |

**useActionState vs useState**

| Aspect | useActionState | useState |
|---|---|---|
| Built for | Wiring an action directly to form submission | General purpose state |
| Tracks pending automatically | Yes | No, must be tracked manually |
| Receives previous result as input | Yes, passed to the action function | Not applicable |
| Works with progressive enhancement | Yes, in supporting frameworks | No |

**use() vs Suspense**

| Aspect | use() | Suspense |
|---|---|---|
| What it is | A way to read a Promise or Context during render | A boundary that shows fallback UI while something is pending |
| Triggers suspension | Yes, for a pending Promise | No, it only responds to suspension triggered elsewhere |
| Can be called conditionally | Yes | Not applicable, it is a component, not a hook |

**React Compiler vs React.memo**

| Aspect | React Compiler | React.memo |
|---|---|---|
| Applied | Automatically at build time | Manually, per component, by us |
| Scope | Analyzes values, callbacks, and components together | Only wraps a single component's re render decision |
| Risk of human error | Lower, mechanically applied | Higher, easy to forget or misuse |
| Requires Rules of React | Yes, strictly | Helps, but not strictly required to function |

**ref as prop vs forwardRef**

| Aspect | ref as prop (React 19+) | forwardRef |
|---|---|---|
| Syntax | `ref` destructured like any other prop | Component wrapped in `forwardRef(...)` |
| Extra wrapping layer | No | Yes |
| Still supported | Yes, is the new default | Yes, for backward compatibility |

## Common Errors and Debugging

**"You're importing a component that needs a client-only hook" style build errors.** This happens when a Server Component file, directly or through an import chain, ends up using something only valid in a Client Component, like `useState`. React and the framework's build tooling detect this at build time by tracing the module graph from each `"use client"` boundary. The fix is either moving that specific logic into a genuine Client Component, or restructuring so the interactive piece is a small, separately imported Client Component rather than baked into the same file.

**Hydration mismatch errors.** These occur when the HTML generated on the server does not match what the client's first render produces for the same Client Component, commonly caused by non deterministic values like `Date.now()`, `Math.random()`, or reading a browser only value directly during render. Debugging usually starts by identifying exactly which component the error message points to, then checking that component's render logic for anything that could differ between the server and the browser's very first pass.

**Serialization errors when passing props into a Client Component, or arguments into a Server Action.** Both boundaries require serializable values, functions, class instances, and other non-serializable values crossing that boundary directly will fail. The fix is usually restructuring the data being passed, for example passing a plain object instead of a class instance, or passing an identifier the other side can use to look up the full object itself.

**A Server Action silently not running, or a form appearing to do nothing on submit.** This is frequently a missing `"use server"` directive, a Server Action function accidentally defined without it will simply be treated as a regular function, which cannot be called this way from client code across that boundary, and typically surfaces as a build time or runtime error pointing at the offending function.

**A memoized value from the React Compiler behaving unexpectedly.** This is almost always traceable to a Rules of React violation somewhere in that component, most often a hidden mutation of a value during render that the component was relying on without realizing it broke purity. The fix is locating and removing that mutation, not disabling the Compiler for that file, since the underlying bug would eventually cause other subtle problems regardless.

## Interview Preparation

**What is the actual mental model for deciding whether something is a Server Component or a Client Component?** Ask whether it genuinely needs interactivity, browser only APIs, or React state tied to user events. If the honest answer is no, it can be a Server Component, and in a framework where that is the default, that usually means doing nothing special at all.

**Why can Server Actions be called directly from a Client Component without us writing an API route by hand?** Because the framework's build tooling turns the `"use server"` function into a client side stub automatically, wiring up the actual network request on our behalf, effectively generating the equivalent of that API route for us behind the scenes.

**Senior level discussion point.** A genuinely interesting follow up for a stronger candidate is asking how they would think about where to draw Server and Client Component boundaries in a real, moderately complex page, like a dashboard with both mostly static charts and a few genuinely interactive filters. A strong answer pushes interactivity down to the smallest possible leaf components, keeping as much of the surrounding layout and data fetching on the server as reasonably possible, rather than marking an entire page `"use client"` out of convenience.

**Why do interviewers ask about hydration mismatches specifically?** Because correctly diagnosing one requires genuinely understanding the relationship between server rendered HTML, the client's first render, and the assumption that both must produce identical output, which is a good proxy for whether someone actually understands the model rather than having only memorized the API surface.

## Best Practices Summary

- Default to Server Components, and reach for `"use client"` deliberately, only once a specific piece of UI genuinely needs interactivity or browser APIs.
- Push `"use client"` boundaries as far down the tree as possible, wrapping the smallest interactive piece rather than an entire page or layout.
- Validate and authorize every Server Action on the server, exactly as we would any other backend endpoint, regardless of how the call itself was triggered.
- Pass stable Promises into `use()`, created outside of render, rather than freshly constructing a new Promise on every render pass.
- Prefer `ref` as a plain prop over `forwardRef` in new code, while leaving existing `forwardRef` usage alone unless there is a real reason to touch it.
- Reach for `useOptimistic` for interactions where instant feedback matters and a rare failure can be gracefully surfaced afterward, and avoid it for anything where an incorrect prediction would be genuinely costly.
- Let the React Compiler handle memoization by default once adopted, and only reach for manual `useMemo` or `useCallback` for narrower cases the Compiler genuinely does not cover.
- Render `<title>` and other metadata tags directly from the component that owns that content, rather than centralizing all metadata far from where it logically belongs.

## Bringing It All Together

Every feature covered here answers a specific, previously painful question. Server Components answer "why does displaying server data require shipping so much unrelated JavaScript." Server Actions answer "why does a simple mutation require building and wiring up an entire API endpoint by hand." The `use()` hook answers "why can't a component simply wait for a value the way `await` lets a regular function do." `ref` as a prop answers "why does receiving a ref require an entirely separate wrapping API." `useFormStatus`, `useOptimistic`, and `useActionState` together answer "why does a responsive, well behaved form require so much repeated boilerplate every single time." The React Compiler answers "why is memoization something we have to remember to do correctly by hand at all." And Document Metadata answers "why can't the component that owns a page's title actually render that title itself."

None of these exist in isolation either. Server Components are the foundation the RSC Payload and Server Actions are built on top of. `useActionState` and `useOptimistic` are specifically designed to pair naturally with Server Actions. `use()` was designed with Server Components passing Promises down to Client Components directly in mind. Seen together, this entire feature set is really one coherent architectural shift, moving more of our applications back toward the server by default, while making the client side, interactive parts that remain simpler and more responsive than they have ever been before.

## 🚀 Quick Revision Hub

Condensed study notes for a fast pass before an interview. This should take roughly five to ten minutes to read end to end. If any point feels unclear, jump back to that section using the table of contents above.

### Server Components (stable)

- **Definition** a component type that renders only on the server, or at build time, and never ships its own code to the browser. Its output is serialized and sent down as part of the RSC Payload.
- **Why it exists** to let us fetch data, read files, and use server-only libraries directly inside a component, without hand building a REST or GraphQL layer, and without shipping that component's JavaScript or its dependencies to the client at all.
- **Key concepts** Server Components are the default in a framework that supports them. Adding `"use client"` at the top of a file marks the boundary where client code begins. We cannot use `useState`, `useEffect`, or browser APIs inside a Server Component, because it never runs in the browser in the first place.
- **Common interview question** what is the actual difference between this and traditional server side rendering.
- **Interview ready answer** traditional SSR still ships the full component's JavaScript to the browser afterward so it can hydrate and become interactive. A Server Component's code never ships at all, its output is serialized data describing the finished UI, and there is nothing to hydrate for that part of the tree.
- **Common misconception** that Server Components mean "no interactivity anywhere on the page." A Server Component tree can include Client Components as children, and those children hydrate and behave exactly as they always have.
- **Performance implication** smaller client bundles, since server-only dependencies like a database driver or a markdown parser never reach the browser at all.
- **Mental model** a Server Component is a chef preparing a finished dish in a kitchen the customer never sees. The customer receives the plated result, not the recipe or the kitchen equipment.
- **Related concepts** Server Actions, RSC Payload, Flight Protocol, Client Components, Suspense.

### Server Actions

- **Definition** async functions marked with `"use server"` that can be called directly from a Client Component, including passed straight into a form's `action` prop, without us manually building an API route to receive them.
- **Why React introduced it** mutating data always required either a full page reload through a plain HTML form, or a hand built API endpoint plus a `fetch` call plus manual serialization on both ends. Server Actions collapse that entire chain into calling a function.
- **Key concepts** React and the framework's build tooling turn a `"use server"` function into a callable network endpoint automatically. Arguments and return values must be serializable. The function always executes on the server, even when called from client code.
- **Common interview question** how does calling a Server Action from the browser actually work under the hood.
- **Interview ready answer** the build step replaces the function reference on the client with a lightweight stub that knows how to make a network request carrying a reference to that specific server function along with the serialized arguments. The server receives that request, looks up the real function by reference, executes it, and streams back the serialized result.
- **Common misconception** that a Server Action is somehow "free" of typical API security concerns. It is a real network endpoint, and every input must still be validated and every caller still authenticated and authorized on the server.
- **Performance implication** removes an entire round of client side `fetch` boilerplate and manual loading state, while integrating directly with React's own pending and optimistic UI primitives.
- **Mental model** a Server Action is a doorbell wired directly into the kitchen. Pressing it does not require us to know the kitchen's address or how to open the kitchen door ourselves.
- **Related concepts** `useActionState`, `useFormStatus`, `useOptimistic`, form `action` prop, progressive enhancement.

### use() Hook

- **Definition** a function, not a traditional hook, that lets us read the value of a Promise or a Context directly during render, and that can be called conditionally, inside loops, and after early returns, unlike every other hook.
- **Why it exists** to unify how we consume async values and context, and to work naturally with Suspense so a component can simply "wait" for a Promise inline rather than manually managing loading state.
- **Key concepts** calling `use(promise)` suspends the component until that Promise resolves, letting a wrapping `<Suspense>` boundary show a fallback. Calling `use(context)` reads context, and unlike `useContext`, can be called after a conditional return.
- **Common interview question** why can `use()` break the rules of hooks when nothing else can.
- **Interview ready answer** `use()` is not built on the same fixed call order mechanism the other hooks rely on internally, so React does not need to track it by call position, which is specifically why it is safe to call conditionally.
- **Common misconception** that `use()` replaces `useEffect` for data fetching in every case. It reads an already created Promise, it does not create or cache one itself, that responsibility usually belongs to a framework's data layer or a library like a query cache.
- **Performance implication** enables fine-grained Suspense boundaries around individual async values instead of one large loading state for an entire component.
- **Mental model** `use()` is an "unwrap and wait if needed" instruction, similar to `await`, but expressed in a way that plays correctly with React's rendering and Suspense system instead of blocking a whole function.
- **Related concepts** Suspense, Server Components, Context, promises.

### ref as a Prop

- **Definition** starting with React 19, function components can accept `ref` as a normal named prop, exactly like any other prop, removing the need for `forwardRef` in the common case.
- **Why React introduced it** `forwardRef` existed purely to route around `ref` being a special, non-prop field that React intercepted before a component ever saw it. That special case added a wrapping layer, extra typing complexity, and a very common source of confusion for anyone building a reusable component library.
- **Key concepts** `ref` now simply appears in the destructured props object like any other prop. `forwardRef` still works for backward compatibility but is no longer necessary going forward.
- **Common interview question** why did `ref` need special handling in the first place.
- **Interview ready answer** early React treated `ref` and `key` as reserved props used internally by React itself, specifically so libraries could not accidentally intercept or misuse them, which meant a function component had to explicitly opt in to receiving a forwarded ref through a separate wrapping API.
- **Common misconception** that this removes the concept of refs pointing to the wrong internal thing. `ref` as a prop still requires the component to explicitly do something meaningful with it, typically passing it down to a real DOM node.
- **Performance implication** effectively neutral, this is primarily an ergonomics and API simplification change.
- **Mental model** `ref` graduated from being a backstage pass only React could hand out, to being a normal guest on the regular prop list.
- **Related concepts** `forwardRef`, DOM refs, imperative handles.

### useFormStatus

- **Definition** a hook that reads the pending status, submitted data, and target of the nearest parent `<form>`, callable only from a component rendered inside that form.
- **Why it exists** to let deeply nested components, like a submit button buried inside several layers of reusable UI, know whether the enclosing form is currently submitting, without threading a "isSubmitting" prop down manually through every layer.
- **Key concepts** must be called from a component that is a descendant of the `<form>`, not the component that renders the form itself. Returns `pending`, `data`, `method`, and `action`.
- **Common interview question** why does calling `useFormStatus` inside the same component that renders the form always return `pending: false`.
- **Interview ready answer** the hook reads status from the nearest ancestor form context, and a component rendering the form is not itself a descendant of that form yet during that same render, so there is no parent form context available to read at that point.
- **Common misconception** that it tracks any arbitrary async operation. It is specifically scoped to a native `<form>` element's own submission lifecycle.
- **Performance implication** avoids prop drilling and the extra re renders that manually lifting and passing down a pending boolean through several component layers would otherwise cause.
- **Mental model** a status light wired into the form itself that any component inside the form can glance at, rather than a message that has to be relayed hand to hand down a chain of people.
- **Related concepts** Server Actions, `useActionState`, form `action` prop.

### useOptimistic

- **Definition** a hook that lets us show a predicted, temporary version of some state immediately, before the real async update actually finishes, and automatically reverts to the real value once the async work settles.
- **Why it exists** waiting for a server round trip before showing any visual feedback makes even fast networks feel sluggish. Optimistic UI shows the expected result instantly while the real request is still in flight.
- **Key concepts** takes the current real state and an update function, returns an optimistic value to render immediately and a function to trigger the optimistic update, and automatically reconciles back to real state once the underlying action completes.
- **Common interview question** what happens if the underlying action actually fails after we already showed the optimistic result.
- **Interview ready answer** once the real state updates, React reconciles the optimistic value back to whatever the real state ends up being, so if the action fails and real state never reflects the optimistic change, the UI naturally snaps back to the last confirmed real state, though we are still responsible for surfacing an error message to explain why.
- **Common misconception** that `useOptimistic` itself performs the update or talks to the server. It only manages the temporary display value, the real mutation still happens through something like a Server Action.
- **Performance implication** makes interactions feel instant regardless of actual network latency, at zero cost to the real request's actual speed.
- **Mental model** a restaurant marking an order as "being prepared" on a screen the instant it is placed, rather than leaving the screen blank until the dish is fully plated and delivered.
- **Related concepts** Server Actions, `useActionState`, `useTransition`.

### useActionState

- **Definition** a hook that wires a Server Action or async function up to a piece of state representing its latest result, along with a pending flag, and returns a wrapped action ready to hand directly to a form.
- **Why it exists** to eliminate the manual boilerplate of tracking loading state, error state, and the latest returned data every time we call an async action from a form, unifying the whole lifecycle into one hook.
- **Key concepts** takes an action function and an initial state, returns the current state, a wrapped action to pass to a form, and a pending boolean. The action function receives the previous state as its first argument, letting each submission build on the last result.
- **Common interview question** how is this different from just calling `useState` alongside a manually written submit handler.
- **Interview ready answer** `useActionState` integrates directly with React's transition and Server Action machinery, automatically tracking pending status without any extra state, automatically resetting appropriately between submissions, and works correctly with progressive enhancement in frameworks that support rendering forms without JavaScript loaded yet, none of which a hand rolled `useState` and `onSubmit` combination gives us for free.
- **Common misconception** that it replaces `useOptimistic`. They solve different problems, `useActionState` tracks the actual settled result of an action, `useOptimistic` shows a predicted value before that result exists.
- **Performance implication** consolidates several previously separate re renders and state variables into one coordinated update.
- **Mental model** a form's own dedicated status board, showing the last official result and whether a new request is currently being processed, updated automatically every time the action runs.
- **Related concepts** Server Actions, `useFormStatus`, `useOptimistic`, form `action` prop.

### React Compiler

- **Definition** a build time tool that automatically inserts fine grained memoization into our components, removing the need to manually write most `useMemo`, `useCallback`, and `React.memo` calls ourselves.
- **Why it exists** manual memoization is easy to get wrong, easy to forget, and creates a lot of boilerplate that clutters components without our full attention. The compiler analyzes our code at build time and inserts the equivalent optimizations automatically, based on the actual data dependencies it detects.
- **Key concepts** requires our components to follow the Rules of React, meaning genuinely pure render logic with no hidden mutations, to safely apply its optimizations. It works incrementally, file by file, and can be adopted gradually across an existing codebase.
- **Common interview question** does the compiler make manual `useMemo` and `useCallback` completely obsolete.
- **Interview ready answer** in the common case yes, since the compiler inserts equivalent memoization automatically and more consistently than most teams manage by hand, though there remain narrower cases, like intentionally sharing one object reference across renders for reasons outside rendering performance, where manual memoization still has a place.
- **Common misconception** that the compiler changes what our code computes. It only changes when and how often certain computations are skipped, it never alters the actual logic or output of a correctly written component.
- **Performance implication** typically reduces unnecessary re renders across a codebase without the team having to hunt down and fix each one manually, though badly written impure components can produce incorrect optimizations, which is why following the Rules of React matters more than ever.
- **Mental model** an experienced editor quietly tightening every sentence in a manuscript for redundancy, without changing what the story actually says.
- **Related concepts** `React.memo`, `useMemo`, `useCallback`, Rules of React, Fiber.

### Document Metadata

- **Definition** the ability to render tags like `<title>`, `<meta>`, and `<link>` directly from any component in the tree, with React automatically hoisting them into the document `<head>` regardless of how deeply nested that component is.
- **Why it exists** metadata like a page title or a description meta tag is logically tied to a specific component, like a product detail page, but the `<head>` element lives far outside that component's actual position in the tree. This feature lets that association be expressed directly in the component that owns it.
- **Key concepts** works for Client Components and Server Components alike, requires no separate portal or manual DOM manipulation, and React deduplicates certain conflicting tags like multiple `<title>` elements sensibly.
- **Common interview question** how is this different from manually using a portal to inject a tag into `document.head`.
- **Interview ready answer** React handles the hoisting natively as part of rendering, which means it works correctly during server rendering and streaming as well, whereas a manual portal based approach only works after hydration in the browser and offers no help for the initial server rendered HTML.
- **Common misconception** that this feature is only useful for client side single page apps. It is equally, arguably more, useful in a Server Components context, since it lets the correct title and description ship in the very first server rendered HTML response.
- **Performance implication** avoids extra client side effects and DOM manipulation just to manage the document head, and improves correctness of metadata present in the initial HTML for search engines and link previews.
- **Mental model** a package correctly labeled at the moment it is packed, rather than a label taped on separately after the fact by someone standing at the shipping counter.
- **Related concepts** Server Components, streaming HTML, SEO.
