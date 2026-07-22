---
title: React Internals Deep Dive - Fiber, Render and Commit, Reconciliation, React.memo, and Concurrent Rendering
publishedOn: 2026-07-22
summary: A complete production grade reference on React's internal engine. We cover Fiber, the render and commit phases, double buffering, reconciliation, React.memo, and concurrent rendering, each with intuition, internals, prerequisites, examples, interview answers, misconceptions, and production insights.
tags: ["frontend", "react"]
keywords: "React Fiber, Render Phase, Commit Phase, Double Buffering, Reconciliation, React.memo, Concurrent Rendering, Lanes, Scheduler, React 19"
author: Sanjib Roy
---

Almost every one of us has written `setState` a thousand times without ever asking what happens in the gap between calling it and actually seeing new pixels on screen. That gap is where React's real engineering lives, and it is also the exact area interviewers love to probe, because it separates someone who has memorized the hooks API from someone who actually understands the tool they use every day.

This article walks through that entire engine from the ground up. We will build each idea on top of the previous one, the same way React itself was built, one deliberate design decision solving one very specific problem at a time. By the end, none of this should feel like trivia we memorized. It should feel like the only sensible way anyone could have built a UI library capable of staying smooth under real production load.

We will move through six connected pieces.

Fiber architecture, the data structure everything else is built on.
The render phase and the commit phase, the two halves of every update.
Double buffering, the trick that lets React swap an entire UI instantly and safely.
Reconciliation, the algorithm that decides what actually needs to change.
React.memo, the tool for skipping unnecessary work, along with its real cost.
Concurrent rendering, the feature that lets React stay responsive even under heavy load.

Let us begin at the very beginning, with the problem that made all of this necessary in the first place.

## Table of Contents

- [🚀 Quick Revision Hub](#-quick-revision-hub)
- [Fiber Architecture](#fiber-architecture)
- [Render Phase Versus Commit Phase](#render-phase-versus-commit-phase)
- [Render Versus Browser Paint](#render-versus-browser-paint)
- [Double Buffering, Current Tree Versus WorkInProgress Tree](#double-buffering-current-tree-versus-workinprogress-tree)
- [Reconciliation and Why Array Index As A Key Breaks It](#reconciliation-and-why-array-index-as-a-key-breaks-it)
- [React.memo And Shallow Comparison](#reactmemo-and-shallow-comparison)
- [Concurrent Rendering, Time Slicing And Interruptible Rendering](#concurrent-rendering-time-slicing-and-interruptible-rendering)
- [Bringing It All Together](#bringing-it-all-together)

## Fiber Architecture

### What It Is

In the simplest words we could say to an interviewer, Fiber is React's internal engine for representing our component tree as a set of small, independent, pausable units of work, connected together using a linked list style structure, instead of the plain recursive function calls React used before version 16. Fiber is not a public API we import and use directly. It is the internal machinery that makes everything else in modern React, including hooks and concurrent rendering, possible.

### Why React Needed It

Before Fiber, React used what is now called the stack reconciler. It rendered our component tree by literally calling functions recursively, component inside component inside component, the exact same way a naive recursive function walks a tree of folders on our computer.

The problem with recursion sitting on the actual JavaScript call stack is that once it starts, it cannot be paused halfway through. A function call frame does not have a pause button. If our tree was large, say an admin dashboard rendering a data grid with several thousand rows, the browser's main thread would be completely occupied for the entire duration of that recursive walk. During that window, the browser could not repaint the screen, could not respond to a click, could not even scroll smoothly. Users would describe this as the page "freezing" for a moment.

React's team needed a way to break a big rendering job into small pieces, check after each piece whether the browser urgently needs to do something else, and if so, pause and come back later. That single requirement, the ability to pause and resume rendering work, is the entire reason Fiber architecture exists. Everything else, lanes, concurrent rendering, transitions, is built on top of this one foundational capability.

### Build Intuition First

Think about a single receptionist at a busy front desk, handling a long line of visitors, each with a multi step request like registering, verifying documents, and getting a badge printed. If the receptionist handled every visitor's entire request from start to finish before even glancing at the next person in line, and one visitor's request happened to be unusually long, everyone behind them would be stuck waiting with no idea what is happening.

A well run front desk instead works in small steps. The receptionist processes one step of the current visitor's request, then briefly checks if anyone urgent just walked in, like someone with a medical emergency, handles that person's most urgent step first if needed, and then returns to where they left off with the previous visitor. Nothing is lost, the receptionist just works in small resumable chunks instead of one long uninterruptible block. This is exactly the shift Fiber represents, moving from "handle the entire tree in one go" to "handle small units of work, checking in between each one."

### Internal Working

A Fiber is a plain JavaScript object. Every component instance and every host element like a `div` or `span` gets its own corresponding Fiber node. Each Fiber node stores several important pieces of information, including the component type, the current props, the pending props for the update in progress, a reference to the actual DOM node it corresponds to, and various internal flags used for scheduling and effects.

What makes Fiber genuinely different from a normal tree is how its nodes are connected. Instead of a parent simply holding an array of children, each Fiber node holds three pointers.

```
child   points to this node's first child
sibling points to the next sibling at the same level
return  points back up to the parent node
```

This turns the tree into something we can walk with a plain loop instead of recursive function calls. React's work loop repeatedly does the following. It processes the current Fiber, then moves to its child if one exists, or its sibling if no child exists, or climbs back up through return if neither exists. After completing each node, the loop checks how much time is left in the current frame. If time has run out, it simply stops, remembers exactly where it left off using these very same pointers, and yields control back to the browser. On the next available opportunity, it resumes the walk from that exact node, something that is only possible because the "position" in the tree is stored as data on the heap rather than as a stack of active function calls.

```
Fiber Tree (conceptual)

           App
          /    \
      Header   MainContent --sibling--> Footer
        |            |
      Logo         ProductList
```

React also groups pending updates into priority buckets called Lanes, which replaced an earlier and simpler mechanism called expiration times. A Lane is represented internally using bits, and different kinds of updates get assigned to different lanes based on urgency. A direct user interaction like typing into a text field is placed in a high urgency lane. Work scheduled through `startTransition` is placed in a lower urgency lane. This lets React's scheduler decide, when multiple updates are pending at once, which one deserves the main thread's attention first.

**Interesting fact.** Fiber gets its name from the computer science concept of a fiber, sometimes also called a coroutine, referring to a lightweight, cooperatively scheduled unit of computation that can suspend itself and resume later, unlike an operating system thread which is much heavier and preemptively scheduled by the OS. React essentially built its own tiny cooperative scheduler for UI work, running entirely in user land JavaScript, without needing any special browser support.

### Related Prerequisite Concepts

**The call stack and why it cannot be paused.** Whenever a JavaScript function calls another function, a new frame is pushed onto the call stack, and that frame is only removed once the function finishes executing. There is no built in way to pause a stack frame midway and let something else run in between, which is precisely the limitation Fiber was designed to route around by moving the "current position" into heap allocated objects instead.

**Linked lists.** A linked list is a data structure where each element holds a reference to the next element, rather than all elements sitting in one contiguous block like an array. Fiber borrows this idea for its child, sibling, and return pointers specifically because linked structures are cheap to traverse iteratively and easy to pause and resume, one node at a time, compared to recursive tree traversal.

**Stack versus heap.** Local variables and function call frames typically live on the call stack, and they disappear automatically once the function returns. Objects we explicitly create, like a Fiber node, live on the heap, and they persist independently of any particular function call. Because Fiber nodes live on the heap, React can hold onto them across many separate turns of the event loop, well outside the lifetime of any single function call.

### Related React Concepts

**The Scheduler.** This is the internal package responsible for deciding when React gets to run its work loop relative to everything else happening on the main thread, including native browser tasks. It uses browser primitives conceptually similar to `requestIdleCallback` to find gaps of free time.

**Lanes.** As mentioned above, lanes are the priority system built on top of Fiber's pausable structure. Without a pausable unit of work model, having priorities would be meaningless, since React would have no opportunity to actually act on that priority information mid render.

### Step By Step Example

Let us imagine a settings page with a toggle switch and a large table of two thousand audit log rows below it.

We click the toggle switch. React schedules a state update for the toggle, tagged with a high urgency lane because it came from a direct user interaction. React's work loop begins walking the Fiber tree starting from the toggle component. It processes the toggle Fiber, moves to its single child, finishes there, and since the audit log table is a completely separate sibling subtree unaffected by this particular update, the work loop does not even need to visit those two thousand rows for this specific change. Once every affected Fiber has been processed, React has a finished set of changes ready to hand off to the next phase.

If, hypothetically, this same tree also had a large, low urgency background update pending, say a periodic data refresh for the table, React's work loop would still process our high urgency toggle update fully before spending time on the low urgency one, because the lane attached to our click sits above the lane attached to the background refresh.

### The Interview Answer

If asked to explain Fiber directly, here is something we could say naturally. "Fiber is React's internal reimplementation of how it walks the component tree during rendering. Before React 16, rendering happened through plain recursive function calls, which could not be paused once started, so a large tree could block the browser's main thread and make the page feel frozen. Fiber solves this by representing every component as a plain object connected through child, sibling, and return pointers, similar to a linked list, so React can walk the tree using a loop instead of recursion. Because this walk happens outside the call stack, React can pause after any unit of work, check if something more urgent needs attention, and resume exactly where it left off later. This pausable structure is what makes concurrent rendering and priority based scheduling through lanes possible."

### Common Interview Follow Up Questions

**Is Fiber a public API we use directly?** No, Fiber is purely an internal implementation detail. We never create or manipulate Fiber nodes ourselves. Interviewers ask this to check whether we understand the difference between React's public hooks and component APIs versus its internal engine.

**Why not just use the array of children instead of child, sibling, and return pointers?** An array works fine for representing structure, but it does not naturally support pausing a walk midway and resuming later without extra bookkeeping. The explicit pointer based structure lets React's iterative loop know exactly where it is and where to go next using nothing but the object itself, without needing a separate stack or index tracking structure on the side.

**What replaced expiration times, and why?** Lanes replaced expiration times. Expiration times represented priority as a single timestamp, which became limiting when React needed to represent multiple simultaneous updates with more nuanced relationships between them. Lanes use bitwise operations, allowing React to represent and combine multiple priorities far more flexibly and efficiently than comparing timestamps.

### Common Misconceptions

**Misconception, Fiber is a new version of the Virtual DOM.** Fiber is not a replacement for the virtual DOM concept. The virtual DOM is the general idea of representing UI as plain JavaScript objects before touching the real DOM. Fiber is a specific internal data structure and algorithm React uses to walk and process that representation efficiently, including support for pausing work.

**Misconception, Fiber makes rendering happen in parallel.** Fiber does not give JavaScript actual multi threaded parallelism on the main thread. It allows React to interleave and prioritize pieces of work on the single main thread, pausing one task to let a more urgent one run, which looks similar to parallelism from the outside but is fundamentally cooperative time slicing, not true concurrency at the hardware level.

### Production Insights

In everyday feature work, we almost never think about Fiber directly, and that is by design, it is meant to be invisible. Where this knowledge actually pays off is when debugging deeply confusing performance issues, like understanding why React might call a component function more than once for a single state update under certain conditions, or why a component further down the tree seems to re render even though its own props did not change. Knowing that rendering is a pausable, potentially restartable walk through Fiber nodes, rather than one atomic recursive pass, explains a good portion of those "why is this happening" moments that otherwise feel like unexplainable magic.

### Mental Model

Picture Fiber as a to do list written on individual sticky notes stuck to a wall, connected with strings showing which note relates to which, rather than one giant scroll of continuous text. We can pull our attention away after finishing any single sticky note, deal with something else, and come right back to exactly where we left off, because the wall itself remembers our position, our own train of thought does not have to.

### Quick Revision

- **Definition** Fiber is React's internal engine that represents the component tree as small pausable units of work connected through a linked list.
- **Why it exists** The old stack reconciler used plain recursion, which cannot pause partway through, so large trees could freeze the browser.
- **Key points** A plain object per component, connected through child, sibling, and return pointers, walked iteratively instead of recursively, with updates tagged by priority using Lanes.
- **Most common interview question** What problem does Fiber solve compared to the old stack reconciler.
- **Pitfalls** Believing Fiber is a public API we use directly, or that it gives true multi threaded parallelism.
- **Performance considerations** Enables interrupting long renders so the main thread never gets blocked for too long by one large tree.
- **Mental model** Sticky notes on a wall connected by string, we can step away and return to the exact same spot.
- **Related concepts** Scheduler, Lanes, concurrent rendering.

## Render Phase Versus Commit Phase

### What It Is

Every update in React happens in two distinct phases. The render phase is where React figures out what needs to change, and the commit phase is where React actually applies those changes to the real DOM. In an interview we could say it simply as, React first calculates the difference without touching anything real, and only afterward does it go make the actual changes in one final synchronous step.

### Why React Needed This Split

If React calculated changes and applied them to the DOM in the same breath, it would lose all the flexibility we just described in the Fiber section. Calculating changes needs to be interruptible so React can pause for something urgent. But applying changes to the real DOM cannot be interruptible, because a half finished DOM mutation would leave the user staring at a visually broken page, some elements updated and others not. React solves this tension by cleanly separating "figure out what changed," which is safe to pause, from "apply the changes," which must run to completion without stopping.

### Build Intuition First

Think of an architect and a construction crew working on a renovation. The architect can spend as long as needed sketching, erasing, redrawing a wall on paper, comparing today's floor plan against yesterday's, and can be interrupted at any point without any real world consequence, because nothing has been built yet. Once the architect finalizes the blueprint, the construction crew steps in and executes it. The crew does not stop midway to consider a new idea partway through knocking down a wall, they finish the job they were handed, quickly and completely, because a half demolished wall is dangerous and unusable. The architect's drafting is the render phase. The crew's execution is the commit phase.

### Internal Working

During the render phase, React walks the Fiber tree, as described earlier, calling each component function to get its latest output, and comparing that output against what existed previously. This phase is required to stay pure, meaning it must not cause any observable side effects like modifying the DOM, making network calls, or mutating variables outside the component. This purity requirement exists precisely because the render phase can be paused, thrown away, and restarted, and React needs to be free to do that without worrying about leftover side effects from a discarded attempt. This is also the underlying reason our component bodies must remain pure functions of their props and state, and why genuinely impure work belongs inside `useEffect` instead of directly in the render logic.

Once the render phase finishes calculating the full set of changes, React enters the commit phase. Here, React walks through the list of Fibers marked with pending changes, referred to internally through effect flags, and applies real DOM mutations, attaches and detaches refs, and fires class lifecycle methods like `componentDidMount` and `componentDidUpdate` along with the callback portion of `useLayoutEffect`. This entire phase runs synchronously in one pass. React does not yield control back to the browser partway through committing, precisely because doing so could expose users to an inconsistent, half updated DOM.

```
Render Phase                         Commit Phase
(pure, interruptible)                (synchronous, not interruptible)

 call components   compare trees        mutate real DOM
 build workInProgress  ------------->    fire refs
 can pause, restart                     run layout effects
 no DOM touched                         schedule passive effects
```

`useEffect` callbacks specifically do not run inside the commit phase itself. They are scheduled to run shortly after the browser has painted the committed changes, which keeps the commit phase itself fast and avoids blocking the very paint that the user is waiting to see.

**Interesting fact.** A very common source of confusion is why React can pause rendering but never pauses a DOM mutation. The answer is really a safety guarantee, not a performance choice. The moment React starts mutating the actual DOM, any pause would leave the browser displaying a UI that does not match any single valid state our application ever intended to be in. React chooses correctness over interruptibility for that one phase specifically because the cost of getting it wrong is a visibly broken screen.

### Related Prerequisite Concepts

**Purity in functions.** A pure function always produces the same output for the same input, and does not modify anything outside itself. React components are expected to behave this way during rendering specifically because render might run more than once for the same update, and any side effect placed directly in render logic would then also run more than once, unpredictably.

**Browser rendering and the paint step.** Browsers periodically take the current state of the DOM and CSS and turn it into actual pixels on screen, called a paint. `useLayoutEffect` runs after DOM mutation but before this paint, which is why it can adjust the DOM without the user ever seeing an intermediate visual state, while `useEffect` intentionally runs after the paint, since most side effects like data fetching or logging do not need to block what the user sees.

### Related React Concepts

**Strict Mode.** In development, Strict Mode intentionally invokes certain functions, including component render logic, twice in order to help us catch impurity bugs. This double invocation is only safe to do because the render phase is documented to be pure. If side effects were allowed directly inside render, Strict Mode's extra invocation would cause real, user visible bugs rather than simply helping us find them.

**Automatic batching.** When multiple state updates happen within the same event handler or the same synchronous block of code, React batches them together and runs a single render phase followed by a single commit phase for all of them combined, rather than repeating the whole two phase process once per individual state update. This is a direct efficiency benefit that comes from having distinct, well defined phase boundaries in the first place.

### Step By Step Example

Consider a simple profile form with a name field and a save button, where saving disables the button and shows a small success message.

We click save. The click handler calls `setSaving(true)` and shortly after `setSuccess(true)`, and thanks to automatic batching these are combined into a single update. React enters the render phase, calls our component function once with the new state values, produces a new description of the UI showing the button disabled and the success message visible, and compares it against the previous description. React determines exactly two real changes are needed, disabling the button element and inserting the success message element. React then enters the commit phase, applies both of those DOM mutations in one synchronous pass, runs any layout effects tied to those elements if present, and finally, shortly after the browser paints this new state, any related `useEffect` callback, for example one that logs an analytics event for successful saves, gets executed.

### The Interview Answer

Here is a natural way to explain this if asked directly. "Every React update is split into two phases. In the render phase, React calls our component functions to figure out what the new UI should look like and compares it against the previous version, entirely in memory, without touching the real DOM. This phase is required to be pure, since React might pause it, throw it away, or restart it, especially under concurrent rendering. Once React has a final answer for what needs to change, it moves into the commit phase, where it applies those changes to the actual DOM synchronously in one uninterrupted step, runs refs, and fires layout effects. The reason for splitting these two phases apart is that pausing calculation work is safe, but pausing an actual DOM mutation halfway through would leave users looking at a broken, inconsistent screen, so React deliberately keeps that part fast and atomic."

### Common Interview Follow Up Questions

**Why must the render phase be pure?** Because React does not guarantee render will run exactly once per update. Under concurrent rendering, React might start rendering, get interrupted by something more urgent, discard that in progress work, and start over. If our component performed a side effect during render, that side effect could fire multiple times or fire for work that ultimately never gets committed, leading to bugs that are extremely difficult to trace.

**Why does `useLayoutEffect` block paint while `useEffect` does not?** `useLayoutEffect` exists for cases where we need to read or adjust something about the DOM, like measuring an element's size, before the user sees anything, so it deliberately runs synchronously before paint. `useEffect` is meant for the vast majority of side effects that do not need to block what the user sees, so React defers it slightly to avoid delaying the paint the user is waiting for.

### Common Misconceptions

**Misconception, calling `setState` immediately updates the DOM.** Calling a state setter only schedules an update, it does not synchronously trigger a DOM mutation. The DOM only changes later, once React works through the render phase and then the commit phase for that update.

**Misconception, the commit phase can also be interrupted for a more urgent update.** The commit phase is intentionally never interruptible. Only the render phase can be paused for a higher priority task. This distinction is exactly why React can offer smooth, interruptible rendering while still guaranteeing the DOM itself never ends up in a half updated state.

### Production Insights

Understanding this split explains a huge portion of real production bugs involving effects. If a bug only appears in development and involves something being logged or triggered twice, Strict Mode's intentional double invocation of render logic combined with an impure side effect placed directly in the component body is almost always the culprit, and the fix is to move that logic into `useEffect`. Understanding that layout effects block paint while regular effects do not also directly explains flicker bugs, where something briefly appears in the wrong position before snapping into place, which usually means a measurement or adjustment that belongs in `useLayoutEffect` was mistakenly placed in `useEffect` instead.

### Mental Model

Think of the render phase as sketching on a whiteboard that only we can see, and the commit phase as erasing and rewriting the whiteboard that the entire room is watching. We can sketch, erase, and redraw our private whiteboard as many times as we like with zero consequences. The moment we start editing the public whiteboard in front of everyone, we finish that edit completely before stepping back, because nobody wants to watch a half erased sentence.

### Quick Revision

- **Definition** Every update happens in two phases, a pure phase that calculates changes and a synchronous phase that applies them to the real DOM.
- **Why it exists** Calculating changes must be pausable, but mutating the real DOM must never be left half finished.
- **Key points** Render phase is pure and interruptible, commit phase is synchronous and uninterruptible, `useLayoutEffect` runs before paint, `useEffect` runs after paint.
- **Most common interview question** Why must the render phase stay pure.
- **Pitfalls** Assuming a state setter updates the DOM immediately, or thinking the commit phase can also be interrupted.
- **Performance considerations** Keeping side effects out of render avoids duplicate or wasted work whenever React retries or discards a render.
- **Mental model** A private whiteboard we can erase freely, versus a public whiteboard we only edit once we are fully ready.
- **Related concepts** Strict Mode, automatic batching, `useEffect`, `useLayoutEffect`.

## Render Versus Browser Paint

### What It Is

This is one of the single most common sources of confusion for anyone learning React internals, mostly because the word render sounds like it should mean "draw something on screen," but inside React it means something much narrower. React's render simply means calling our component functions and figuring out, entirely in memory, what the UI should look like. The browser's paint is a completely separate, later process where the browser actually fills in pixels on the physical screen. In an interview we could say it plainly, React rendering is a JavaScript calculation, browser painting is the browser physically drawing the result, and confusing the two is where most misunderstandings about React performance come from.

### Why This Distinction Matters

If we assume React's render phase is the moment something appears on screen, a whole set of React's behavior stops making sense. Why can React call our component function more than once for a single update. Why does `useLayoutEffect` block something while `useEffect` does not. Why can React pause a render halfway through without the user ever seeing a flicker. Every one of these questions has a clean answer once we accept that React finishing its render and commit work is not the same moment as anything appearing visually different on the user's screen. There is an entire browser pipeline sitting between "React finished updating the DOM" and "the user's eyes actually see new pixels," and that pipeline belongs entirely to the browser, not to React.

### Build Intuition First

Think of how a daily newspaper actually gets produced. A reporter drafts an article, and while drafting, they can rewrite a paragraph fifty times, delete a whole section, restart from scratch, and none of that indecision ever reaches a single reader, because nothing has been printed yet. This drafting stage, fully revisable and completely invisible to the public, is our React render phase.

Once the reporter and editor finalize the article, the editor sends one final, locked version to the print floor. This handoff happens exactly once per edition, and there is no going back to revise a paragraph after this point, this is our commit phase, applying the one final agreed version to the real DOM.

But even after the final text reaches the print floor, the newspaper is still not sitting on anyone's doorstep yet. The printing press has to physically typeset where each column and photo goes on the page, this is Layout. Ink rollers then physically deposit the actual visible marks onto the paper based on that layout, this is Paint. Finally, separate printed sheets, color plates, inserts, and folded sections get assembled together into the single physical newspaper we actually receive, this is Composite. All three of these final steps, typesetting, inking, and assembling, are done entirely by the printing press, a completely different machine, running on a completely different schedule, from the reporter's laptop where the writing happened. React is the reporter and editor. The browser's rendering pipeline is the printing press.

### Internal Working

Let us walk through the complete path from a single state update all the way to actual pixels changing on the user's screen.

```
State update triggered (for example, a click handler calls setState)
        |
        v
React Render Phase                (JavaScript, on the main thread)
  call component functions
  diff new output against old
  build the workInProgress tree
  PURE, INTERRUPTIBLE
        |
        v
React Commit Phase                (JavaScript, on the main thread)
  mutate the real DOM
  attach and detach refs
  run useLayoutEffect callbacks
  SYNCHRONOUS, NOT INTERRUPTIBLE
        |
        v
Browser Layout, also called Reflow   (browser engine, not React)
  recalculate size and position of affected elements
        |
        v
Browser Paint                       (browser engine, not React)
  fill in actual pixels, colors, text, borders, images
        |
        v
Browser Composite                   (browser engine, often GPU assisted)
  combine painted layers into the single final frame
        |
        v
Pixels genuinely change on the user's screen
        |
        v
Shortly after, useEffect callbacks run (scheduled, non blocking)
```

Everything from the state update down through the commit phase belongs entirely to React, and it all happens as plain synchronous JavaScript execution on the main thread. Layout, Paint, and Composite belong entirely to the browser's own rendering engine. React does not calculate element positions, does not decide pixel colors, and does not composite layers together. React's only real job is producing an updated, correct DOM. What that updated DOM should visually look like, and the actual work of drawing it, is completely outside React's control and entirely the browser's responsibility.

This explains the interruption question directly. React's render phase can be paused because it is nothing more than JavaScript function calls building an in memory description, and pausing plain computation has no visible consequence. The commit phase cannot be paused because a partially mutated DOM tree is an invalid, inconsistent tree, and refs and layout effects depend on the DOM being in one complete, coherent state when they run. The browser's own Layout, Paint, and Composite steps are not something React could interrupt even if it wanted to, because they are not React's code at all, they belong to a separate engine that runs its own pipeline once it receives a finished, valid DOM and stylesheet to work from. React finishing the commit phase does not itself cause a paint, it simply hands the browser an updated DOM, and the browser decides when it is ready to run its own Layout, Paint, and Composite steps, typically aligned with the display's refresh rate.

**Interesting fact.** A single browser frame budget is usually somewhere around sixteen milliseconds, based on a common sixty times per second refresh rate. React's commit phase itself is often a tiny fraction of that budget, but Layout and Paint, especially on a page with a lot of elements or expensive CSS, can consume a large share of it. This is precisely why a React specific optimization like `React.memo` or reducing unnecessary re renders sometimes provides less visible benefit than expected, if the actual bottleneck is happening downstream in the browser's own Layout or Paint step rather than in React's JavaScript work at all.

### Related Prerequisite Concepts

**The browser rendering pipeline.** Modern browsers turn a DOM tree and its associated styles into pixels through a repeatable sequence, generally described as Layout, Paint, and Composite, sometimes with additional steps depending on the browser engine. Layout determines geometry, Paint determines the actual visible marks, and Composite assembles separately painted layers, sometimes using the graphics card, into the single frame ultimately shown on screen.

**The main thread and the event loop.** Both React's render and commit phases execute as regular JavaScript on the browser's single main thread, competing for time with everything else that thread needs to do, including responding to user input and eventually running the browser's own Layout and Paint work for that frame.

### Related React Concepts

**Fiber.** Fiber's pausable unit of work model is specifically what makes the render phase, and only the render phase, safely interruptible. Fiber has no equivalent involvement in Layout, Paint, or Composite, since those steps happen entirely inside the browser, outside any code Fiber walks through.

**Concurrent rendering.** Concurrent rendering slices up and prioritizes work strictly within the render phase. It never attempts to slice up the commit phase or the browser's own Layout, Paint, and Composite steps, because those must always run as complete, atomic units for the screen to ever show a valid, non broken frame.

**`useLayoutEffect` versus `useEffect`.** `useLayoutEffect` callbacks run synchronously right after the commit phase finishes mutating the DOM, but before the browser is allowed to Layout and Paint that frame, which is exactly why it exists for measurements or adjustments that must be invisible to the user, since they complete before any pixels for that frame are ever painted. `useEffect` callbacks are deliberately scheduled to run after the browser has already painted, so they never delay the pixels the user is waiting to see, which is the right choice for the overwhelming majority of side effects that do not need to block a paint.

### Step By Step Example

Consider clicking a button that expands a collapsed panel, changing its height and revealing new content inside it.

We click the button. A state update is scheduled. React runs its render phase, calling the panel component with its new expanded state, comparing the new output against the previous collapsed version, and building a workInProgress tree describing the new, taller panel with its new children. This entire calculation could, in principle, be paused if something more urgent came in, though for a simple click like this it typically finishes in a single, uninterrupted pass. React then enters the commit phase, mutating the real DOM in one synchronous step, updating the panel's height related attributes and inserting the newly revealed child elements, and running any `useLayoutEffect` callbacks tied to that panel, for example one that measures the new content's height to adjust an animation value before anything is shown.

At this point React's own work for this update is completely finished, but nothing has visually changed for the user yet. The browser now takes over. It runs Layout, recalculating the size and position of the panel and everything below it that shifted down to make room. It runs Paint, filling in the actual visible pixels for the now taller panel and its revealed content. It runs Composite, combining that freshly painted region with the rest of the already painted page into one final frame. Only at the end of this browser driven sequence does the user actually see the panel visually expand. Shortly after that paint, any `useEffect` tied to this update, for example one logging that the panel was expanded, finally runs.

### The Interview Answer

Here is a natural way to explain this distinction directly. "React's render is purely a JavaScript step, it means calling our component functions and figuring out, in memory, what the DOM should look like, and it never touches actual pixels. The browser's paint is a completely separate, later process where the browser's own rendering engine takes the finished DOM and stylesheet and physically draws pixels on screen, going through its own Layout, Paint, and Composite steps. The full path from a state update to something actually appearing different on screen goes React render, React commit, then browser Layout, browser Paint, and browser Composite, with only the first two steps belonging to React and the rest belonging entirely to the browser. React can pause the render phase because it is only in memory computation with no visible consequence, but it cannot pause the commit phase, since that must leave the DOM in one complete, valid state, and it has zero control over the browser's own Layout and Paint pipeline, which runs as its own atomic sequence once it receives a finished DOM to work from. This is also exactly why `useLayoutEffect` runs before that browser paint and `useEffect` runs after it, one is meant to block the visual result if needed, the other deliberately is not."

### Common Interview Follow Up Questions

**If React finishes the commit phase, does the browser paint immediately afterward?** Not necessarily instantly in the sense of zero elapsed time, but yes, generally on the very next opportunity the browser has to produce a frame, which is typically the next display refresh. React itself does not control exactly when that happens, it simply hands the browser a finished DOM, and the browser's own scheduling decides when Layout and Paint actually run for that frame.

**Can a browser paint happen without any React render or commit happening at all?** Yes. Plenty of visual changes, like a pure CSS hover effect or a scroll position change, never involve React's render or commit phases at all, and still trigger the browser's own Layout, Paint, and Composite steps entirely on their own. This is a good reminder that paint is a general browser concept that exists completely independently of React.

**Why can concurrent rendering interrupt a render but not a paint?** Because concurrent rendering is a feature of React's own JavaScript execution, and it only has authority over code React itself controls, which is the render phase. The browser's Layout, Paint, and Composite steps are outside React's code entirely, running inside the browser engine as its own atomic sequence, so there is nothing for React's scheduler to interrupt there even in principle.

### Common Misconceptions

**Misconception, when React finishes rendering, the screen has already updated.** React finishing its render and commit work only means the DOM itself has been updated correctly. The user still has to wait for the browser's separate Layout, Paint, and Composite steps before anything visually changes, even though this usually happens within a single frame and feels instantaneous.

**Misconception, render is a general term meaning drawing something visually.** Outside of React, the word render often does mean producing a visual result, which is exactly why this causes so much confusion. Inside React specifically, render refers narrowly to calling component functions and calculating the DOM in memory, a step that never itself draws a single pixel.

### Production Insights

This distinction matters most when debugging perceived slowness that does not respond to typical React optimizations. If reducing unnecessary re renders, memoizing components, or optimizing hooks does not meaningfully improve a sluggish interaction, the actual bottleneck may be sitting downstream in the browser's own Layout or Paint step, often caused by things entirely outside React's control, like triggering layout altering CSS properties on many elements at once, deeply nested elements causing expensive reflow calculations, or overly complex box shadows and gradients that are expensive to paint. Browser developer tools performance panels specifically separate Scripting, which includes React's render and commit work, from Rendering, which covers Layout and Paint, and from Painting or Compositing, and learning to read that separation is often the fastest way to correctly diagnose whether a slowdown is truly a React problem or a browser rendering problem wearing a React costume.

### Mental Model

Picture a courier delivering a finished, sealed package versus the recipient actually opening it and seeing what is inside. React's job ends the moment the package is sealed and correctly assembled, that is the commit phase. The browser is the recipient who still has to physically walk to the door, take the package, unwrap it, and look inside, that unwrapping and looking is Layout, Paint, and Composite. The package being correctly sealed and the recipient actually seeing its contents are two different moments in time, handled by two entirely different parties.

### Quick Revision

- **Definition** React's render means calling component functions and calculating an updated DOM in memory, browser paint means the browser physically drawing pixels on screen, and they are two separate systems running one after the other.
- **Why it exists** Understanding this gap explains why React finishing work does not itself mean anything visually changed yet, and why React can pause its own work but not the browser's.
- **Key points** Full flow is state update, React render, React commit, browser Layout, browser Paint, browser Composite, pixels change. React owns only the first two steps, the browser owns the rest.
- **Most common interview question** What is the complete path from a state update to pixels actually changing on screen, and which parts does React control.
- **Pitfalls** Assuming React finishing its render or commit means the screen has already visually updated, or treating render as a general term for drawing pixels.
- **Performance considerations** A slow interaction that does not improve after typical React optimizations may actually be bottlenecked in the browser's own Layout or Paint step, not in React at all.
- **Mental model** A sealed package being correctly assembled by a courier is not the same moment as the recipient actually opening it and seeing what is inside.
- **Related concepts** Fiber, concurrent rendering, `useLayoutEffect`, `useEffect`, the browser rendering pipeline.

## Double Buffering, Current Tree Versus WorkInProgress Tree

### What It Is

React keeps two Fiber trees alive at the same time. The current tree represents exactly what is on screen right now. The workInProgress tree is the new version React is actively building while processing an update. Once that new tree is fully ready, React switches which one counts as current by flipping a single reference, instantly, rather than rebuilding or replacing anything piece by piece. In an interview we could describe it as, React never edits the live tree directly, it builds a full replacement off to the side and swaps it in only once it is completely ready.

### Why React Needed This

If React only kept one tree and mutated it directly while figuring out an update, any pause or restart, exactly the kind of pause Fiber's architecture is designed to allow, would leave that single tree in a half finished, inconsistent state. There would be no clean "current" version to fall back to or display while the new version was still being built. By keeping the current tree fully untouched while building an entirely separate workInProgress tree, React always has a complete, valid tree it can safely display no matter when work gets interrupted, retried, or abandoned.

### Build Intuition First

This exact pattern has a well known name in computer graphics, double buffering, used for decades in video game rendering. A game never draws the next frame directly onto the buffer currently being shown on our monitor. Instead, it draws the upcoming frame into a separate, invisible buffer, completely off screen, and only once that frame is entirely finished does the system swap which buffer the monitor reads from. This swap happens instantly, so we only ever see complete frames, never a frame that was caught mid draw, which is what would cause the visual tearing and flicker every game developer wants to avoid.

### Internal Working

Every Fiber node has a property called `alternate`, which points to its counterpart in the other tree. The Fiber for a given component in the current tree points to that same component's Fiber in the workInProgress tree, and vice versa. When an update begins, React does not create a brand new object graph from nothing for every single update. Instead, it reuses the existing alternate Fiber where possible, updating its fields to reflect the new props and state, which is a deliberate memory optimization that avoids putting constant pressure on the garbage collector during frequent updates like fast typing.

```
        current tree                 workInProgress tree
        (on screen now)              (being built)

            App  <---alternate--->        App
             |                             |
          ProductList <--alternate-->  ProductList
```

Once the render phase finishes building the workInProgress tree completely, and the commit phase applies the real DOM changes, React performs the swap by updating its internal root pointer so that the workInProgress tree now becomes the current tree. The previous current tree does not get thrown away either, it becomes the new workInProgress tree, ready to be reused as the starting point for the next update. This ping pong reuse between exactly two tree objects, rather than continuously allocating new ones, is the core efficiency win behind this design.

**Interesting fact.** The word double buffering makes this feel like a rendering specific trick, but the underlying principle shows up anywhere a system needs to present something as instantly complete while quietly preparing it in the background, from database systems performing atomic swaps between old and new versions of a table, to operating systems handling screen buffers at the driver level. React essentially imported a decades old graphics and systems programming pattern directly into a JavaScript UI library.

### Related Prerequisite Concepts

**JavaScript references and object identity.** In JavaScript, variables holding objects actually hold a reference to that object's location in memory, not the object's contents directly. Flipping which tree counts as current in React is, at its core, just reassigning a reference, which is why the swap can happen instantly regardless of how large the tree is, we are not copying any data, only repointing a reference.

**Immutable style updates.** React encourages treating state as something we replace rather than mutate directly, for instance returning a new array instead of pushing into an existing one. The current versus workInProgress tree split mirrors this same philosophy at React's own internal level, the previous complete tree is left untouched while a new one is prepared separately, and only swapped in once ready.

### Related React Concepts

**Suspense.** When a component suspends while data is loading, React can pause building that particular workInProgress tree and continue showing the existing current tree, including a fallback UI, precisely because the current tree was never touched and remains fully valid and displayable the entire time.

**Concurrent rendering.** Everything concurrent rendering promises, the ability to prepare an update in the background without disturbing what the user currently sees, depends directly on double buffering. Without a guaranteed valid current tree sitting untouched the whole time, there would be nothing safe to keep showing the user while a lower priority update is still being prepared behind the scenes.

### Step By Step Example

Suppose we are on a chat application, actively scrolled through a long conversation, current tree fully rendered and visible. A new message arrives through a websocket, triggering a state update to add it to the message list.

React does not touch the tree currently on screen. It begins building a workInProgress tree, walking through the Fiber nodes that need updating, in this case mainly the message list component, and constructs the version of that subtree that includes the new message. While this is happening, if we happen to scroll or click something, the current tree is still fully there and fully interactive, completely unaffected by the in progress work happening on the side. Once the workInProgress tree finishes building and passes through the commit phase, React flips the pointer, the workInProgress tree instantly becomes the current tree showing the new message, and the previous current tree becomes the new workInProgress slot, ready for the next incoming message.

### The Interview Answer

A solid way to phrase this in an interview. "React keeps two Fiber trees at once, the current tree that matches what is on screen, and a workInProgress tree that React builds separately whenever there is a pending update. Each Fiber has an alternate pointer connecting it to its counterpart in the other tree, so React can reuse the same two tree objects across many updates instead of allocating brand new ones every time, which reduces garbage collection pressure. Once the workInProgress tree is fully built and committed, React swaps which tree counts as current with a single reference update, which is instant regardless of tree size. This means users only ever see fully completed trees, never a version that was midway through being constructed, similar to double buffering in graphics rendering, where a game never draws directly onto the frame currently being displayed."

### Common Interview Follow Up Questions

**Does React allocate two entirely new trees for every update?** No, and this is a key nuance. React reuses the same pair of tree objects across updates through the alternate pointers, updating fields in place on the reused workInProgress tree rather than constructing a brand new object graph from scratch every single time. Only truly new Fiber nodes, like ones created for brand new elements added to the tree, get freshly allocated.

**What happens to the workInProgress tree if an update is abandoned partway through, for example due to a higher priority interruption?** The unfinished workInProgress tree is simply discarded or reused as the starting point for a fresh attempt later, since it was never swapped in as current and never affected anything visible. The current tree remains completely valid and displayed the whole time, exactly the safety guarantee this whole pattern exists to provide.

### Common Misconceptions

**Misconception, double buffering means React renders two versions of the UI on screen simultaneously.** Users only ever see one tree at a time, the current one. The second tree exists purely as an internal in progress workspace, never rendered or shown to anyone.

**Misconception, this is the same thing as the virtual DOM concept.** The virtual DOM broadly refers to representing UI as JavaScript objects instead of manipulating the real DOM directly. Current and workInProgress trees are a specific internal strategy for managing exactly two such object representations safely and efficiently across updates, a more specific mechanism sitting on top of the general virtual DOM idea.

### Production Insights

We will almost never interact with this directly, but it explains why React feels instant even during fairly heavy updates, and why partially completed work never leaks onto the screen as a broken intermediate state, even when an update gets interrupted or discarded midway under concurrent rendering. It is also a good example of a broader lesson worth carrying into our own systems design work, that keeping a stable, fully valid version of something available at all times while preparing changes separately, and swapping only once ready, is a powerful and reusable pattern well beyond UI rendering.

### Mental Model

Picture two identical picture frames on a wall, one currently displaying a photo everyone can see, and one turned around, facing the wall, where we are carefully placing a new photo. Once the new photo is perfectly placed, we spin both frames around together in one motion. The room only ever sees a fully composed photo, never someone's hand halfway through repositioning a print.

### Quick Revision

- **Definition** React keeps a current tree matching what is on screen and a separate workInProgress tree it builds off to the side, then swaps between the two.
- **Why it exists** A paused or restarted update must never leave the visible tree in a broken, half built state.
- **Key points** Every Fiber has an alternate pointer linking it to its counterpart tree, the swap is a single reference flip, the same two trees get reused across many updates.
- **Most common interview question** What happens to the workInProgress tree if a higher priority update interrupts it partway through.
- **Pitfalls** Thinking two trees are shown at once, or confusing this with the general virtual DOM concept.
- **Performance considerations** Reusing the same two tree objects avoids constant garbage collection pressure from allocating fresh trees on every update.
- **Mental model** Two picture frames, one facing the room and one facing the wall, spun around together only once the new photo is ready.
- **Related concepts** Suspense, concurrent rendering, JavaScript references.

## Reconciliation and Why Array Index As A Key Breaks It

### What It Is

Reconciliation is the algorithm React uses to compare the previous tree against the newly rendered tree and figure out the smallest set of real changes needed to bring the actual DOM up to date. Said simply, it is React's diffing process, deciding what genuinely changed so it only touches exactly that, instead of throwing away and rebuilding everything on every single update.

### Why React Needed It

Rebuilding the entire real DOM from scratch on every state change would be extremely slow, since DOM operations are comparatively expensive compared to plain JavaScript object operations. React's whole value proposition rests on being able to describe the desired UI declaratively and let the library figure out the minimal real changes required. Diffing two arbitrary trees in the fully general computer science sense is known to be an expensive problem to solve perfectly. React deliberately does not attempt a perfect general solution. It applies a small number of pragmatic assumptions about how real UI trees typically change, which makes the algorithm fast in practice at the cost of occasionally doing slightly more work than a theoretically perfect diff would.

### Build Intuition First

Imagine we manage inventory in a warehouse using a checklist compared against yesterday's checklist to figure out what changed overnight. If an entire shelf category was swapped out entirely, say the shelf that used to hold electronics now holds furniture, the fastest and safest thing to do is treat that shelf as fully replaced rather than trying to match up individual electronics items against individual furniture items one by one, since they are not really related at all. But if the shelf still holds the same category of items, just reordered or with a couple of items added or removed, we would want a system that recognizes each item by its own tag or barcode, not by its position on the shelf, since items constantly get physically reordered, and matching purely by position would confuse a newly added item with whatever item happened to be sitting in that same physical spot before.

### Internal Working

React's reconciliation relies on two main heuristics rather than a fully general tree diff.

First, if the type of an element changes at a given position in the tree, for example a `div` becomes a `span`, or one component type is swapped for a completely different component type, React does not try to patch one into the other. It tears down the old subtree entirely, including unmounting any state living inside it, and builds a fresh subtree from scratch. This keeps the algorithm simple by avoiding the need to figure out partial compatibility between fundamentally different element types.

Second, for lists of sibling elements, React relies on a `key` prop to match elements across renders by identity rather than by position. Without an explicit key, React falls back to matching purely by index, meaning it assumes whatever sits at position zero in the new render corresponds to whatever sat at position zero in the previous render, and so on for every position. This assumption holds up fine as long as the list never gets reordered, and breaks down the moment items are inserted, removed, or reordered anywhere except the very end.

```
Without stable keys, matched by position

previous render          new render (item inserted at top)
[ Buy groceries ]         [ Book flight   ]   <- React thinks this
[ Call plumber  ]         [ Buy groceries ]      "Buy groceries" item
[ Pay rent      ]         [ Call plumber  ]      just changed text
                          [ Pay rent      ]

With stable keys, matched by identity

previous render                 new render (item inserted at top)
[ id 1 Buy groceries ]          [ id 4 Book flight   ]  <- new item
[ id 2 Call plumber  ]          [ id 1 Buy groceries ]  <- correctly
[ id 3 Pay rent       ]          [ id 2 Call plumber  ]     recognized
                                 [ id 3 Pay rent      ]     as unchanged
```

With a stable key, typically an id coming from our actual data rather than the array's index, React can correctly recognize that the item with id one simply moved from position zero to position one, rather than incorrectly believing the item at position zero changed its text from "Buy groceries" to "Book flight." This matters far beyond just avoiding wasted work. If those list items hold internal state, like a checked checkbox, a focused text input, or a mid flight CSS transition, an incorrect match caused by using index as key will attach that internal state to the wrong logical item after a reorder, producing exactly the kind of confusing bug where checking one checkbox seems to affect a completely different row after the list changes shape.

**Interesting fact.** React specifically uses `Object.is` for many of its equality comparisons, including detecting whether state actually changed, rather than a deep comparison. A full deep comparison would need to recursively inspect every nested field of every object involved on every single update, which would itself become a performance problem, especially for large or deeply nested state. Using a fast identity based comparison keeps this check cheap, at the cost of requiring us to create new object references when we genuinely want React to notice a change, which is exactly why immutable update patterns matter so much in React code.

### Related Prerequisite Concepts

**Tree data structures.** A UI is naturally a tree, a root element containing child elements, which may contain their own children. Reconciliation is fundamentally a tree comparison problem, comparing the previous tree against the new one, level by level, to find differences.

**Object identity versus value equality.** Two different objects can hold identical looking data yet still be considered different by JavaScript, because equality checks like `===` compare references, not contents. Reconciliation and hooks like `useState` and `useMemo` all lean heavily on this reference based notion of sameness rather than deeply inspecting contents, which is faster but requires us to be deliberate about creating new references when something genuinely changes.

### Related React Concepts

**Diffing.** Diffing is really just another name for the comparison step inside reconciliation, the part where React lines up the previous and new versions of a subtree and determines exactly what differs.

**Keys and lists.** The `key` prop is the primary tool we have as developers to directly influence how reconciliation behaves for lists, essentially giving React the identity information index based matching cannot provide on its own.

### Step By Step Example

Consider a simple task list rendered from an array of task objects, each with a stable database id, initially showing three tasks.

We add a new task at the very beginning of the array through a state update. React enters the render phase and produces a new list of three task elements. During reconciliation, because each task element carries `key={task.id}` rather than relying on its index, React compares the new list against the previous one by matching ids. It sees the new task's id was not present before, so it mounts a fresh Fiber and a fresh DOM node for it. It sees the three previously existing ids are all still present, just shifted down by one position, so it reuses their existing Fiber nodes and DOM nodes entirely, including whatever local component state or focus those tasks already held, and simply repositions them in the DOM rather than recreating them. React then moves into the commit phase and applies exactly one DOM insertion and some position adjustments, rather than tearing down and rebuilding all four rows from scratch.

If instead we had used the array index as the key, React would have compared position by position, concluded the item at index zero changed its text, the item at index one changed its text, and so on for the entire list, unnecessarily discarding and reapplying far more than truly changed, and potentially misplacing any internal state those rows were holding.

### The Interview Answer

Here is a way to explain this naturally in an interview. "Reconciliation is how React figures out the minimal set of real DOM changes needed after a re render, by comparing the previous tree against the new one instead of rebuilding everything from scratch. For lists specifically, React needs a way to match up elements across renders, and it does that using the key prop. If we do not provide a meaningful key, React falls back to matching by array index, which works fine as long as the list order never changes, but breaks the moment items are inserted, removed, or reordered anywhere except the end, because React ends up comparing the wrong old element against the wrong new element. This can silently attach internal state, like a checkbox's checked value or a focused input, to the wrong row after the list changes. The fix is always to use a stable identifier from our actual data, like a database id, as the key, so React can correctly track each item's real identity across renders regardless of its current position."

### Common Interview Follow Up Questions

**Why not just always use a proper unique id instead of index, even if it takes more code?** Because index based matching is a positional assumption that quietly breaks the instant a list gets reordered, filtered, or has items inserted anywhere but the end, and the resulting bugs, misapplied internal state or unnecessary re mounting, are often subtle and hard to trace back to the key prop specifically. A real, stable id costs nothing extra to use correctly and removes this entire category of bugs.

**Is it ever acceptable to use index as a key?** It is reasonably safe only for lists that are fully static and will genuinely never be reordered, filtered, or have items inserted or removed from the middle, for example a hardcoded list of navigation tab labels that never changes at runtime. Even then, using a real identifier when one is available is generally the safer default habit.

### Common Misconceptions

**Misconception, keys are only about performance.** Keys are fundamentally about correctness first, performance second. The performance benefit is real, but the more serious risk of poor keys is genuinely incorrect behavior, like state ending up attached to the wrong row after a reorder, which can be far more damaging in production than a small amount of wasted rendering work.

**Misconception, React deeply compares objects to detect changes during reconciliation.** React's comparisons, both for reconciliation and for hooks generally, rely on reference equality through mechanisms like `Object.is`, not a recursive deep comparison of contents. This is precisely why replacing an object or array with a new reference, rather than mutating the existing one in place, is the expected pattern in React code.

### Production Insights

Key related bugs are some of the most common real world React issues, and they are almost always traceable to either missing keys entirely or using array index as a key on a list that gets reordered, filtered, or paginated. This shows up frequently in features like drag and drop reordering, filterable data tables, or infinite scrolling feeds where new items get prepended, all situations where a list's order or contents change in ways that defeat index based matching. Whenever a bug report describes a checkbox, input value, or animation seemingly jumping to the wrong row after some list interaction, checking the key prop should be one of the very first things we investigate.

### Mental Model

Think of key as a name tag, and index as a seat number. If we identify people at a party purely by seat number and someone gets up and everyone shifts down one seat, we would now be calling the wrong person by the wrong name, even though nobody's actual identity changed, only their seat did. A name tag travels with the actual person regardless of which seat they end up in, which is exactly what a proper key does for our data.

### Quick Revision

- **Definition** Reconciliation is the algorithm React uses to compare the previous and new trees and find the smallest real set of changes needed.
- **Why it exists** Rebuilding the entire real DOM on every single update would be far too slow for any meaningfully sized app.
- **Key points** A changed element type causes a full subtree replacement, list items are matched using keys, matching purely by index silently breaks the moment order changes.
- **Most common interview question** Why does using array index as a key cause bugs after a list is reordered.
- **Pitfalls** Believing keys are only a performance detail, or assuming React deep compares objects during diffing.
- **Performance considerations** Stable keys let React reuse existing DOM nodes and internal component state instead of needlessly remounting them.
- **Mental model** A key is a name tag, an index is only a seat number.
- **Related concepts** Diffing, `Object.is`, immutable updates.

## React.memo And Shallow Comparison

### What It Is

`React.memo` is a wrapper we can put around a component that tells React, before re rendering this component again, first check whether its props have genuinely changed compared to last time, and if every prop looks the same, skip re rendering it entirely and reuse the previous result. In an interview terms, it is an opt in performance guard that lets a component sit out a re render its parent triggered, as long as nothing it actually depends on has changed.

### Why React Needed It

By default, whenever a parent component re renders, React re renders every child beneath it as well, regardless of whether that particular child's own props changed at all. This default exists because it is simple and correct, but it can become wasteful for components that are expensive to render and sit inside a tree that re renders frequently for reasons unrelated to that specific component. `React.memo` gives us a deliberate, opt in way to tell React it is safe to skip a component when nothing relevant to it has changed, trading a small comparison cost for potentially skipping a much larger rendering cost.

### Build Intuition First

Picture a large open kitchen in a restaurant, where a change to one order, say someone at table five asking for their steak a little more done, should not require every single chef station to redo every dish already sitting ready for other tables. A well run kitchen only reworks the one dish that actually needs to change. A poorly run kitchen might reflexively remake every dish on every ticket whenever any single change comes in, which is safe in the sense that nothing gets forgotten, but wastes enormous amounts of effort. `React.memo` is our way of telling a particular station, "you only need to remake this dish if the actual order details for it changed, not just because some other order in the restaurant changed."

### Internal Working

When we wrap a component using `React.memo`, React attaches a comparison step that runs before that component would otherwise re render due to its parent re rendering. This comparison is shallow by default, meaning for primitive values like strings, numbers, and booleans, React compares by value, and for anything else, objects, arrays, and functions, React compares by reference using something conceptually equivalent to `Object.is`. If every individual prop passes this comparison as unchanged, React skips calling that component's function entirely for this update and reuses its previous rendered output.

```jsx
const ProductCard = React.memo(function ProductCard({ product, onAddToCart }) {
  return (
    <div className="card">
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button onClick={() => onAddToCart(product.id)}>Add to cart</button>
    </div>
  );
});
```

This works cleanly as long as `product` and `onAddToCart` remain referentially stable across renders when nothing about them has actually changed. If the parent recreates a brand new object or a brand new function on every single render and passes it down, the shallow comparison will always report a difference, and the memoized component will re render every time anyway, gaining nothing from the wrapper while still paying the small cost of running the comparison itself.

**Interesting fact.** React cannot simply deep compare props by default, and this is a deliberate design choice rather than an oversight. Deep comparison means recursively walking every nested field inside every prop object to check for differences, which itself takes time proportional to how large and deeply nested that data is. For components receiving large objects or arrays as props, a deep comparison could easily cost more than simply re rendering the component in the first place, completely defeating the purpose of memoization. Shallow, reference based comparison stays fast and predictable regardless of how large or deeply nested the underlying data happens to be.

### Related Prerequisite Concepts

**Object identity and references.** As covered earlier under reconciliation, JavaScript objects are compared by reference by default, not by their contents. Two arrays holding the exact same numbers are still considered different if they are two separate array literals. `React.memo` leans entirely on this reference based notion of sameness for its shallow comparison.

**Immutable updates.** Because `React.memo` and hooks like `useMemo` and `useCallback` all rely on reference stability to detect "nothing changed," the common React pattern of replacing state with new objects and arrays, rather than mutating existing ones, is what makes reference based comparisons actually meaningful and trustworthy across renders.

### Related React Concepts

**`useCallback` and `useMemo`.** These two hooks exist largely to make `React.memo` actually effective in real code. `useCallback` preserves a stable function reference across renders as long as its dependencies have not changed, and `useMemo` does the same for computed values and object or array literals. Without them, a parent would constantly hand memoized children brand new function and object references on every render, defeating the shallow comparison entirely.

**Re rendering versus committing.** It is worth separating two ideas clearly here. `React.memo` can prevent a component's render phase work from happening at all for a given update. This is different from a component rendering but React's diffing deciding no DOM mutation is actually needed during commit. `React.memo` skips work earlier and more completely than diffing alone would.

### Step By Step Example

Consider a product catalog page holding search text and a selected price range as state in a parent component, rendering a grid of two hundred `ProductCard` components below it, along with an `onAddToCart` handler defined using `useCallback` and each product object coming from a stable array that only changes when the underlying data actually changes.

We adjust the price range slider. The parent re renders because its own state changed. Without memoization, React would, by default, also re render all two hundred `ProductCard` components beneath it, even though the actual product data and the add to cart handler are completely unrelated to the price range and have not changed at all. Because `ProductCard` is wrapped in `React.memo`, and because `product` and `onAddToCart` remain referentially stable across this particular update, React's shallow comparison for every single card reports no change, and React skips re rendering all two hundred cards entirely, only doing the small amount of work needed to update whatever part of the UI actually depends on the price range itself.

Now consider the opposite case, where `onAddToCart` was instead defined as an inline arrow function directly inside the parent's render output, recreated fresh on every single parent render. In that case, every `ProductCard`'s shallow comparison would report a changed prop on every single render, regardless of price range changes or anything else, and all two hundred cards would re render every time anyway, with the added overhead of running two hundred unnecessary comparisons first.

### The Interview Answer

A natural way to explain this. "`React.memo` lets a component skip re rendering when its parent re renders, as long as its own props have not changed, checked using a shallow comparison, meaning primitives are compared by value and objects, arrays, and functions are compared by reference. It genuinely helps when we have a reasonably expensive component deep in a tree that re renders often for unrelated reasons, as long as its props are kept referentially stable using things like `useCallback` and `useMemo` where needed. It can actually hurt in two situations, either when the wrapped component is cheap enough that the comparison itself costs about as much as just re rendering it, or when the props passed in are not stable, like inline functions or object literals recreated on every render, since then the comparison always fails and we pay its cost without ever getting the skipped render benefit."

### Common Interview Follow Up Questions

**Why does React use shallow comparison instead of deep comparison by default?** Because deep comparison cost scales with how large and deeply nested the props are, and for sufficiently complex props, that cost can exceed the cost of simply re rendering the component, which would make memoization actively counterproductive. Shallow comparison keeps the check fast and predictable, at the cost of requiring us to manage reference stability ourselves through immutable updates and hooks like `useCallback` and `useMemo`.

**Can we provide a custom comparison function to `React.memo`?** Yes, `React.memo` accepts an optional second argument, a custom comparison function, letting us define our own logic for when a component should skip re rendering, for example comparing only a specific subset of fields inside a larger prop object. This is generally reserved for cases where the default shallow comparison genuinely is not sufficient, since custom comparison logic adds complexity and its own maintenance burden.

**Does wrapping every component in `React.memo` make an app faster overall?** Not necessarily, and often the opposite for cheap components. Every memoized component pays a small, constant comparison cost on every potential re render. Applying `React.memo` broadly and indiscriminately, especially to cheap components, can add up to more total overhead than it saves, which is why memoization is best treated as a targeted tool for specific, measured bottlenecks rather than a default habit applied everywhere.

### Common Misconceptions

**Misconception, `React.memo` prevents a component from ever re rendering.** It only prevents re rendering triggered by a parent re render when props have not changed. If the component itself has internal state that changes, or if a context value it consumes changes, it will still re render regardless of the `React.memo` wrapper.

**Misconception, passing the same looking object as props means `React.memo` will treat it as unchanged.** Looking the same and being the same reference are different things. A brand new object literal with identical field values is still a different reference from the previous render's object, and the shallow comparison will treat it as changed, unless that object was memoized using something like `useMemo` to preserve its actual reference across renders.

### Production Insights

`React.memo` earns its keep on genuinely expensive components sitting deep in frequently updating trees, classic examples being complex chart components, large data grid rows, or heavy visual components rendered many times inside a list. It tends to backfire when applied reflexively to small, cheap components, or when the surrounding code has not been written with stable references in mind, since inline callbacks and inline object literals are extremely common patterns that quietly defeat memoization without anyone noticing. A good production habit is to reach for `React.memo` only after actually measuring a real rendering bottleneck using the profiler, rather than applying it preemptively everywhere on the assumption that it can only help.

### Mental Model

Think of `React.memo` as a bouncer standing in front of a component, checking IDs before letting a re render through. Checking an ID takes a small amount of time no matter what. If the person is clearly a returning guest whose details have not changed at all, turning them away at the door saves the much larger cost of reseating and reserving them inside. But if every single guest arrives wearing a slightly different disguise every single time, even though it is genuinely the same person underneath, the bouncer ends up checking every single ID carefully and still letting everyone through anyway, paying the cost of the check while gaining none of its benefit.

### Quick Revision

- **Definition** `React.memo` skips a component's re render whenever its props are shallowly equal to what they were last time.
- **Why it exists** By default every child re renders whenever its parent re renders, even when that child's own props never changed.
- **Key points** Primitives are compared by value, objects and functions are compared by reference, effectiveness depends on `useCallback` and `useMemo` keeping references stable.
- **Most common interview question** When can `React.memo` actually make performance worse instead of better.
- **Pitfalls** Wrapping cheap components in memo everywhere, or passing inline functions and object literals that quietly break the comparison.
- **Performance considerations** Worth using only for genuinely expensive components that also receive referentially stable props.
- **Mental model** A bouncer checking IDs at the door, useful only when most guests are recognizable repeat visitors.
- **Related concepts** `useCallback`, `useMemo`, reconciliation.

## Concurrent Rendering, Time Slicing And Interruptible Rendering

### What It Is

Concurrent rendering is React's ability to work on preparing an update without that work being forced to run to completion in one uninterrupted block, meaning React can pause a lower priority render partway through, immediately handle something more urgent like a keystroke or click, and then resume or restart the paused work afterward. Said simply for an interview, it means React can juggle multiple pending pieces of work by breaking them into small time slices and always prioritizing whichever one matters most to the user right now.

### Why React Needed It

Even with Fiber making individual units of work small and resumable, React still needed an actual policy layer deciding when to pause, what counts as urgent, and how to resume gracefully. Without that policy layer, a large, low priority update, say re rendering a big filtered list after a search box changes, could still end up hogging the main thread across many consecutive units of work, making the search input itself feel sluggish even though each individual unit of work was small. Concurrent rendering is the feature that actually uses Fiber's pausability purposefully, ensuring urgent, interactive updates always get the main thread's attention ahead of less urgent background updates.

### Build Intuition First

Think of a home cook preparing a multi dish dinner alone, one dish needing occasional stirring and another needing occasional checking in the oven. A cook does not stand frozen stirring one pot continuously until it is completely finished before ever looking at the oven. They stir for a bit, step over and check the oven, go back and stir again, and if the doorbell rings, they answer it immediately and return to both dishes afterward. The cook is still only one person, doing one thing at any literal instant, but by working in small slices and switching attention based on what is currently most pressing, dinner as a whole comes together smoothly and nothing burns. Concurrent React works the exact same way on a single main thread, switching attention across pending pieces of work in small slices rather than committing entirely to one piece until it is fully done.

### Internal Working

Concurrent rendering builds directly on the priority lanes described in the Fiber section. Every scheduled update carries a lane reflecting how urgent it is. Direct, synchronous user interactions, like typing into a controlled input or clicking a button, get treated with the highest urgency. Updates explicitly wrapped using `startTransition`, or values wrapped with `useDeferredValue`, are treated as lower urgency and are allowed to be interrupted or delayed slightly under load.

React's work loop, walking the Fiber tree as described earlier, checks periodically, roughly once per unit of work, whether it has used up its allotted time slice for the current turn of the event loop. This is the actual meaning of time slicing, cutting a potentially large render into many small slices, each bounded by a time check, rather than one continuous block. If the time slice runs out, and a higher priority update is waiting, React yields control back to the browser immediately, letting the browser paint or handle input, and later resumes or restarts the interrupted lower priority work once the more urgent update has been fully handled.

```
Without concurrent rendering

  [ big low priority render ............................ ] then handle click

With concurrent rendering, time sliced

  [ chunk ][ chunk ][ click handled here! ][ chunk ][ chunk ] done
```

**Interesting fact.** Concurrent rendering existed in experimental form for a long time before React's team considered it production ready, and it only became officially available starting with React 18 through the new `createRoot` root API, replacing the older `ReactDOM.render`. Simply upgrading React's version alone does not turn on concurrent behavior, an app must actually be rendered through a concurrent capable root, which is a good reminder that concurrent rendering is a feature we deliberately opt into through our app's setup, not an automatic side effect of upgrading a dependency.

### Related Prerequisite Concepts

**The JavaScript event loop.** JavaScript runs on a single main thread, processing one task at a time from a queue, and only moving to the next task once the current one finishes or explicitly yields. Concurrent rendering's entire strategy of yielding back to the browser between small units of work only makes sense once we understand there genuinely is just one thread available, and that being a good citizen on that one thread means voluntarily stepping aside periodically.

**Scheduling and priority queues.** A scheduler is a system that decides in what order pending pieces of work should run, often using a priority queue that always surfaces the most urgent pending item first. React's internal Scheduler package plays exactly this role for pending Fiber work, using lanes as the priority signal, conceptually similar to how an operating system's own task scheduler decides which process gets the CPU next.

### Related React Concepts

**`useTransition`.** This hook lets us explicitly mark a state update as a transition, meaning it is allowed to be treated as lower priority and interrupted by more urgent updates, and it also gives us a boolean flag indicating whether that transition is still pending, useful for showing a subtle loading indicator without blocking the rest of the UI.

**`useDeferredValue`.** This hook lets us take a value that changes quickly, like search input text, and derive a version of it that is allowed to lag slightly behind under heavy load, so that expensive UI depending on it, like a large filtered list, does not block the fast changing part, like the input field itself, from feeling instant.

**Suspense.** Suspense and concurrent rendering are closely related. Suspense lets a component signal that it is not ready yet, typically while waiting on data, and concurrent rendering's ability to keep showing the existing current tree, thanks to double buffering, while a suspended update prepares in the background is what makes Suspense feel smooth rather than jarring.

**The React Compiler.** The React Compiler automatically inserts fine grained memoization into our components at build time, reducing how often components actually need to re render or recompute values in the first place, which pairs naturally with concurrent rendering, since less unnecessary work overall means the scheduler has even less to juggle and prioritize.

### Step By Step Example

Consider a product search page, where typing into a search box filters a list of a few thousand products displayed below it, and the filtering update is wrapped using `useTransition`.

We type a character into the search box. This triggers an update to the input's own value, which is treated as high urgency since it is direct user input, and separately triggers, through the transition wrapper, a lower urgency update to recompute the filtered list. React's work loop immediately prioritizes the high urgency input update, rendering and committing it right away so the character we typed appears in the box instantly. It then begins working through the low urgency filtered list update in small time sliced chunks. If we type a second character before that filtering work finishes, React interrupts the in progress low priority work, handles the new high urgency input update immediately again, and then restarts or continues the filtering work factoring in the latest search text, rather than wastefully finishing a filter calculation based on text that is already outdated. The `isPending` flag from `useTransition` can be used the whole time to show a subtle, non blocking indicator that the list is still catching up.

### The Interview Answer

A natural interview level explanation. "Concurrent rendering is React's ability to break rendering work into small time sliced chunks and prioritize between multiple pending updates rather than treating every render as one uninterruptible block. It relies on the same pausable Fiber structure we use for normal rendering, combined with a priority system called lanes, so that direct user interactions like typing always get handled ahead of lower priority background work like a large list re render triggered by that same typing. Concretely, we opt into this behavior using APIs like `useTransition` and `useDeferredValue`, which mark certain updates as safe to interrupt or delay slightly, so the interactive parts of our UI stay responsive even while more expensive updates are still being prepared behind the scenes."

### Common Interview Follow Up Questions

**Does concurrent rendering mean React runs code in parallel across multiple threads?** No, JavaScript on the main thread remains single threaded. Concurrent rendering is about cooperative time slicing and prioritization on that single thread, interleaving small pieces of different pending work rather than literally executing multiple things at the exact same instant. The word concurrent here refers to managing multiple in progress tasks over time, not literal parallel execution.

**What is the actual difference between `useTransition` and `useDeferredValue`?** `useTransition` is used when we control the state update itself and want to mark it explicitly as low priority, and it also gives us a pending flag. `useDeferredValue` is used when we receive a value, often from a parent or from props, that we cannot wrap in a transition ourselves, and instead we derive a deliberately lagging version of that value locally to use in an expensive part of our UI.

**Do we need to enable concurrent rendering explicitly, or is it automatic once we upgrade React?** It must be opted into through rendering the app using the `createRoot` API rather than the legacy root API. Simply having a recent React version installed does not automatically enable concurrent behavior for an app still using the older rendering entry point.

### Common Misconceptions

**Misconception, concurrent rendering makes every update faster.** It does not make any individual piece of work computationally cheaper. What it changes is the order and scheduling of work, ensuring urgent updates are not stuck waiting behind less urgent ones, which improves perceived responsiveness rather than raw total throughput.

**Misconception, wrapping something in `startTransition` guarantees it will always be delayed.** A transition is a hint about priority, not a hard guarantee of deferred timing. If nothing more urgent is competing for the main thread at that moment, a transition update can still complete essentially immediately.

### Production Insights

Concurrent features earn their value specifically in interactive heavy scenarios under real load, like live search and filtering over large datasets, dashboards with frequent background data refreshes alongside active user interaction, or any UI where a fast changing input coexists with an expensive derived computation. For pages that are mostly static or have no meaningfully expensive re renders happening, concurrent rendering has little to offer, since there is no competition for the main thread's attention in the first place. A common production mistake is wrapping too much in transitions indiscriminately, which can make otherwise simple, cheap updates feel oddly delayed without any real performance benefit to justify it, so like `React.memo`, this is best applied to a measured, genuine bottleneck rather than sprinkled everywhere by default.

### Mental Model

Picture an air traffic controller managing multiple planes at once, where landing an ambulance flagged flight always takes priority over a routine cargo flight already mid approach, even if that means briefly instructing the cargo flight to circle and wait. Nothing about the cargo flight's actual flying speed changed, the controller simply reordered whose turn it is to land based on genuine urgency, exactly what React's scheduler does with pending renders competing for the main thread.

### Quick Revision

- **Definition** Concurrent rendering lets React pause a lower priority render, handle something urgent immediately, then resume or restart the paused work.
- **Why it exists** Without prioritization, a large low priority update could still make urgent interactions like typing feel sluggish.
- **Key points** Built on Lanes and Fiber's pausable structure, time slicing breaks big renders into small chunks, must be opted into through `createRoot`.
- **Most common interview question** Does concurrent rendering mean React runs code in parallel across multiple threads.
- **Pitfalls** Thinking it makes individual work computationally cheaper, or that `startTransition` guarantees a delay.
- **Performance considerations** Most valuable in scenarios pairing a fast changing input with an expensive derived computation, like live search over a large list.
- **Mental model** An air traffic controller landing an urgent flight first without changing any single plane's actual flying speed.
- **Related concepts** `useTransition`, `useDeferredValue`, Suspense, Scheduler.

## Bringing It All Together

If we zoom all the way back out, every piece we covered here solves one link in the same overall chain. Fiber gives React a pausable, resumable way to walk the component tree using a linked list structure instead of plain recursion. The render phase uses that pausable walk to safely calculate what should change, while the commit phase applies those changes to the real DOM in one fast, uninterruptible pass, because a half finished DOM mutation would be far worse than a slightly delayed one. Double buffering, keeping a current tree and a workInProgress tree and swapping between them with a single reference flip, guarantees users only ever see a fully completed tree, never one caught mid construction. Reconciliation decides exactly which parts of that tree genuinely changed, relying on keys to correctly track identity across renders, which is precisely why array index as a key quietly breaks the moment a list gets reordered. `React.memo` lets us skip an entire subtree's rendering work when its shallow props have not changed, though it only pays off when those props are actually kept referentially stable. And concurrent rendering is the feature that finally puts all of this pausability to active use, prioritizing urgent, interactive updates over less urgent background ones using lanes, so our apps stay responsive even under real production load.

None of these six pieces exist in isolation. Each one is a direct answer to a limitation exposed by the one before it, and together they explain almost everything about why modern React behaves the way it does, well beyond what any hooks cheat sheet alone could ever cover.

 
## 🚀 Quick Revision Hub

Condensed study notes for a fast pass before an interview: should take about 2-3 minutes to read end to end. If any point feels unclear, jump back to that section using the table of contents.

### 1. Fiber Architecture

* **Definition:** Fiber is React's internal engine: every component and DOM element gets a plain object ("Fiber") linked to its siblings, children, and parent, letting React walk the tree with a loop instead of recursion.
* **Why it exists:** The old stack reconciler used recursive calls that couldn't pause mid-way, so large trees could freeze the main thread; Fiber makes rendering pausable and resumable.
* **Key points:** `child`/`sibling`/`return` pointers replace an array of children so the "current position" lives on the heap, not the call stack: that's *how* pausing is even possible; updates are tagged with priority **lanes** (bitwise flags) so urgent work (typing) can jump ahead of background work (a data refresh).
* **Interview Q:**
    - *What problem does Fiber solve vs. the old reconciler?* : It replaces uninterruptible recursive rendering with a linked, iterative structure so React can pause after any unit of work and resume exactly where it left off.
* **Pitfall:** Thinking Fiber is a public API or gives true multi-threaded parallelism: it's purely internal, and it's cooperative time slicing on one thread, not real parallel execution.
* **Performance:** Prevents one large tree from blocking the main thread for too long in a single go.
* **Mental model:** Sticky notes on a corkboard connected by string: step away from any note and come back to the exact same spot.
* **Related:** The **Scheduler** decides *when* Fiber's work loop runs; **lanes** are the priority signal that pausability makes actionable.

### 2. Render Phase vs. Commit Phase

* **Definition:** Every update splits into a render phase (calculate changes, in memory) and a commit phase (apply changes to the real DOM).
* **Why it exists:** Calculating changes must be pausable; mutating the real DOM must never be left half-finished, or the user sees a broken screen: so React keeps the two concerns strictly separate.
* **Key points:** Render must stay **pure** (no side effects) because it might run more than once or get discarded under concurrent rendering; commit is synchronous and uninterruptible, running refs and `useLayoutEffect` before the browser paints; `useEffect` runs after paint so it never blocks what the user sees.
* **Interview Q:**
    - *Why must the render phase be pure?* : Because React may pause, discard, or restart it: an impure side effect could fire multiple times or for work that's never actually committed.
* **Pitfall:** Assuming `setState` updates the DOM immediately, it only schedules an update; the DOM changes later, after render and commit both run. Also: commit is *never* interruptible, only render is.
* **Performance:** Keeping side effects out of render avoids duplicate/wasted work whenever a render is retried or discarded; this split also explains most "fires twice in dev" bugs (Strict Mode double-invokes render on purpose).
* **Mental model:** A private whiteboard you can erase freely (render) vs. the public whiteboard the room is watching, which you only edit once, completely (commit).
* **Related:** Strict Mode's double-invocation only works because render is pure; automatic batching combines multiple updates into one render+commit cycle.

### 3. Render vs. Browser Paint

* **Definition:** React's "render" is just calling component functions and calculating an updated DOM in memory: it never draws a pixel. The browser's separate Layout -> Paint -> Composite pipeline is what actually puts pixels on screen, running afterward, on its own schedule.
* **Why it exists:** Understanding this gap explains why React finishing work does not equal anything visually changing yet, and why React can pause its own step but has zero control over the browser's.
* **Key points:** Full path is: `state update -> React render -> React commit -> browser Layout -> Paint -> Composite -> pixels change`; React owns only the first two, non-React code owns the rest: so a "React optimization" can't fix a bottleneck that's actually sitting in browser Layout/Paint.
* **Interview Q:** 
    - *What's the complete path from a state update to pixels changing, and which parts does React control?* -> React render + commit (JS, main thread) hand off a finished DOM; the browser's own Layout, Paint, and Composite steps (its engine, its schedule) turn that into visible pixels.
* **Pitfall:** Assuming finishing render/commit means the screen already updated: it only means the DOM is correct; the browser still has to Layout/Paint/Composite it, usually within the same frame but as a genuinely separate step.
* **Performance:** If typical React fixes (fewer re-renders, memoization) don't help a slow interaction, the real bottleneck may be downstream in browser Layout/Paint (e.g., expensive CSS, deep reflow): check DevTools' Rendering/Painting panels, not just Scripting.
* **Mental model:** A courier sealing a package (React's job ends at commit) vs. the recipient actually opening it and looking inside (Layout/Paint/Composite): two different moments, two different parties.
* **Related:** Fiber's pausability only ever applies to render, never to browser paint; `useLayoutEffect` runs before this browser paint, `useEffect` after.

### 4. Double Buffering (Current Tree vs. WorkInProgress Tree)

* **Definition:** React keeps two Fiber trees at once: the **current** tree matching what's on screen, and a **workInProgress** tree it builds separately for a pending update: then swaps which one counts as current with a single reference flip.
* **Why it exists:** If React edited the live tree directly, a paused or restarted update (which Fiber explicitly allows) would leave the visible tree half-built; keeping current fully untouched guarantees there's always something valid to show.
* **Key points:** Each Fiber has an `alternate` pointer linking it to its counterpart in the other tree, so React reuses the same two tree objects across updates (less garbage collection) instead of allocating fresh ones each time; the swap is just reassigning a reference, so it's instant regardless of tree size.
* **Interview Q:** 
    - *What happens to the workInProgress tree if a higher-priority update interrupts it?* -> It's discarded or reused as the starting point for the next attempt; since it was never swapped in, the current tree stays valid and displayed the whole time.
* **Pitfall:** Thinking two trees are ever shown at once: users only ever see the current tree; the other is an invisible internal workspace. Also not the same thing as "the virtual DOM" in general: this is one specific mechanism built on top of that idea.
* **Performance:** Reusing the same two tree objects avoids constant GC pressure from allocating brand-new trees on every keystroke or update.
* **Mental model:** Two picture frames: one facing the room, one facing the wall while you place a new photo: spun around together only once the new photo is ready.
* **Related:** Suspense keeps showing the current tree (plus a fallback) while a suspended workInProgress tree prepares in the background; concurrent rendering depends entirely on this guarantee to be safe.

### 5. Reconciliation & Why Array Index as a Key Breaks It

* **Definition:** Reconciliation is the diffing algorithm that compares the previous and new trees and computes the minimal real DOM changes needed: instead of rebuilding everything from scratch.
* **Why it exists:** A perfect general tree-diff is computationally expensive; React trades that for two fast, pragmatic heuristics that work well for how real UIs typically change.
* **Key points:** A changed element **type** at a position causes a full subtree teardown and rebuild (no partial patching between unrelated types); list items are matched by their **key**, not position: without one, React falls back to matching by index, which silently misattributes state (checkboxes, focus, transitions) the moment a list is reordered, filtered, or has items inserted anywhere but the end.
* **Interview Q:** 
    - *Why does array index as key cause bugs after reordering?* -> React compares position-by-position, so inserting an item at the top makes React think every existing item "changed": including reattaching internal state (like a checked box) to the wrong logical row.
* **Pitfall:** Thinking keys are only about performance: the bigger risk is *correctness*: state silently ending up on the wrong row. Also, React does **not** deep-compare objects; it uses fast reference equality (`Object.is`-style), which is why immutable updates matter.
* **Performance:** Stable keys let React reuse existing DOM nodes and component state instead of needlessly remounting them: a real win, but secondary to correctness.
* **Mental model:** A `key` is a name tag; an index is only a seat number: shift everyone down one seat and you're now calling the wrong person by the wrong name.
* **Related:** Relies on the same reference-equality principle `React.memo` uses; diffing is just the comparison step inside reconciliation.

### 6. `React.memo` & Shallow Comparison

* **Definition:** `React.memo` wraps a component so React skips re-rendering it: reusing the previous output: whenever a parent re-renders but this component's own props are shallowly unchanged.
* **Why it exists:** By default every child re-renders whenever its parent does, even if that child's props are untouched; `React.memo` is an opt-in escape hatch for genuinely expensive components in that position.
* **Key points:** Comparison is **shallow**: primitives by value, objects/arrays/functions by reference: because a *deep* comparison would itself cost more than just re-rendering for large/nested props; this only pays off if props stay referentially stable, which is why `React.memo` is almost always paired with `useCallback`/`useMemo` in the parent.
* **Interview Q:** 
    - *When can `React.memo` make things worse?* -> When the component is cheap enough that the comparison itself costs as much as re-rendering, or when props (inline functions/objects) are recreated every render: the comparison always fails, so you pay its cost with none of the benefit.
* **Pitfall:** Believing `React.memo` stops all re-renders: it only blocks parent-triggered re-renders with unchanged props; internal state changes or consumed context changes still re-render it regardless.
* **Performance:** Worth it only for genuinely expensive components with stable props, deep in a frequently-updating tree: not a "wrap everything" default, since indiscriminate use adds net overhead.
* **Mental model:** A bouncer checking IDs at the door: useful when most guests are recognizable repeat visitors, wasted effort if everyone shows up in a different disguise every time.
* **Related:** `useCallback`/`useMemo` exist largely to make `React.memo` actually effective by keeping prop references stable; it skips render-phase work entirely, earlier than reconciliation deciding "no DOM change needed."

### 7. Concurrent Rendering, Time Slicing & Interruptible Rendering

* **Definition:** React's ability to break a render into small time-sliced chunks, pause a lower-priority one mid-way to handle something urgent (a keystroke, a click), and resume or restart it afterward.
* **Why it exists:** Fiber makes pausing *possible*, but without an actual scheduling policy, a big low-priority update could still hog the main thread across many small chunks, making urgent interactions like typing feel sluggish.
* **Key points:** Built directly on **lanes**: direct interactions get high urgency, `startTransition`/`useDeferredValue` work gets low urgency and can be interrupted; must be explicitly opted into via `createRoot` (not automatic just from upgrading React).
* **Interview Q:** 
    - *Does this mean React runs in parallel across threads?* -> No: JS stays single-threaded; concurrent rendering is cooperative time slicing and priority scheduling on that one thread, not literal parallel execution.
* **Pitfall:** Thinking it makes individual work computationally cheaper (it only reorders/schedules work) or that `startTransition` guarantees a delay (it's a priority hint: if nothing urgent competes, it can still finish immediately).
* **Performance:** Most valuable when a fast-changing input coexists with an expensive derived computation (live search over a large list); adds no benefit: and can add odd delay: on mostly static pages with nothing to prioritize.
* **Mental model:** An air traffic controller landing an urgent flight first without changing any single plane's actual flying speed: just reordering whose turn it is based on urgency.
* **Related:** Depends on double buffering to safely keep showing the current tree while a low-priority update is prepared; pairs with Suspense (smooth loading) and the React Compiler (less unnecessary work to schedule in the first place).