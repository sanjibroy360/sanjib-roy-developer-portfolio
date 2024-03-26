---
title: "React.memo vs. useMemo: When to use each for better React performance?"
publishedOn: 2024-02-15
summary: "Ever wondered when to use React.memo and useMemo? This in-depth guide clarifies their differences and shows how to leverage them for optimal performance."
tags: ["frontend", "react"]
keywords: "React.memo, memo, useMemo, Memoization, React Optimization, React, React.js, Performance Optimization"
author: Sanjib Roy
---

>  This blog is also published in [blog.saeloun.com](https://blog.saeloun.com/2024/02/15/memo-vs-usememo-when-to-use-each-for-better-react-performance/)

Optimizing React applications for better performance is an ongoing pursuit in the ever-evolving landscape of web development. Two key tools within the React toolkit, `React.memo()` and `useMemo()`, play pivotal roles in enhancing efficiency. In this article, we'll explore the importance of these tools, delve into the concept of memoization, shallow comparison, provide insights into React.memo() and useMemo(), weigh their advantages and disadvantages, analyze the differences between them, and offer strategic guidance on when to deploy each for optimal results. Additionally, we also discussed some complex rendering scenarios and how we can avoid unnecessary child re-renders.

![](../../assets/Images/posts/react-memo-vs-usememo-when-to-use-each-for-better-react-performance/banner.jpg)

<p style="text-align: center">Source: <a href="https://wallpapercave.com/w/wp5542612" target="_blank" rel="noopener noreferrer nofollow">WallpaperCave</a></p>

## Understanding Memoization

[Memoization](https://www.freecodecamp.org/news/memoization-in-javascript-and-react/) is a technique used to optimize the performance of functions by caching the results of expensive function calls and reusing them when the same inputs occur again. In React, [memoization](https://www.freecodecamp.org/news/memoization-in-javascript-and-react/) helps avoid redundant rendering of components, ultimately leading to a smoother user experience.

## Understanding Shallow Comparison

A comparison that compares only the references, not the actual content of the objects. If two variables reference the same object in memory, the shallow comparison will consider them equal. It doesn't go into nested objects or arrays to check for equality.

```js
const obj1 = { name: "John", age: 25 };
const obj2 = { name: "John", age: 25 };
const obj3 = obj1;

console.log(obj1 === obj2); // Shallow comparison: false (different references)
console.log(obj1 === obj3); // Shallow comparison: true (same reference)
```

## React.memo():

[React.memo()](https://react.dev/reference/react/memo) is a Higher Order Component (HOC) provided by React, specifically designed to automatically memoize functional components. When a component is wrapped with [React.memo()](https://react.dev/reference/react/memo), it will re-render only if its props have changed.

The `React.memo` function takes [two parameters](https://react.dev/reference/react/memo#parameters):

- **Component:**

  The first parameter is the component that we want to memoize. This is the component that we want to wrap with memoization.

  <iframe src="https://codesandbox.io/embed/2l8qc7?view=Editor+%2B+Preview&module=%2Fsrc%2FApp.js"
    style="width:100%; height: 600px; border:0; border-radius: 4px; overflow:hidden; margin: 20px auto;"
    title="basic-react-memo-example"
    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>

- **arePropsEqual function (optional):**

  The second parameter is an optional function called [arePropsEqual](https://react.dev/reference/react/memo#specifying-a-custom-comparison-function). This function is used to customize the comparison logic for the props of the component to determine whether the component should be re-rendered or not. If the `arePropsEqual` function is not provided, [React.memo()](https://react.dev/reference/react/memo) will perform a `shallow comparison` of props by default using [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).

  The [arePropsEqual](https://react.dev/reference/react/memo#specifying-a-custom-comparison-function) function takes two sets of props, the previous props, and the next props, and returns a boolean indicating whether the component should re-render (`true` for skip re-render, `false` for allow re-render).

  <iframe src="https://codesandbox.io/embed/y7fx2l?view=Editor+%2B+Preview&module=%2Fsrc%2FApp.js"
    style="width:100%; height: 600px; border:0; border-radius: 4px; overflow:hidden; margin: 20px auto;"
    title="React-Memo-example"
    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>

  Using [React.memo()](https://react.dev/reference/react/memo) with the appropriate [arePropsEqual](https://react.dev/reference/react/memo#specifying-a-custom-comparison-function) function can help improve the performance of our React application by preventing unnecessary re-renders when the props haven't changed.

### Advantages of React.memo():

1. **Automatic Memoization**: `React.memo()` automatically handles memoization of entire components, reducing the need for manual optimization.

2. **Ease of Use**: Applying `React.memo()` is simple and involves minimal code changes.

3. **Ideal for Pure Components**: Suited for functional components that purely depend on their props for rendering.

### Disadvantages of React.memo():

1. **Limited Scope**: Memoizes the entire component, which might be unnecessary if only specific values need memoization.

2. **Not Suitable for Complex Logic**: May not be suitable for components with intricate internal state or logic that doesn’t solely depend on props.

## useMemo():

[useMemo()](https://react.dev/reference/react/useMemo) is a Hook in React that memoizes the result of a function, preventing unnecessary recalculations. It takes [two arguments](https://react.dev/reference/react/useMemo#parameters) – a function to calculate the memoized value and an array of dependencies. The memoized value is recalculated only when one of the dependencies changes.

<iframe src="https://codesandbox.io/embed/86q258?view=editor&module=%2Fsrc%2FApp.js"
  style="width:100%; height: 600px; border:0; border-radius: 4px; overflow:hidden;  margin: 20px auto;"
  title="useMemo-example"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

In this example, the `searchUsers` function will be called whenever the `searchTerm` changes, and the fetched results will be memoized using [useMemo()](https://react.dev/reference/react/useMemo).

### Advantages of useMemo():

1.  **Selective Memoization**: Allows selective memoization of specific values or calculations within a component.

2.  **Fine-tuned Optimization**: Useful for optimizing performance in components with complex computations.

3.  **Dependency Control**: Developers have control over the dependencies, ensuring memoization occurs only when necessary.

### Disadvantages of useMemo():

1. **Manual Configuration**: Requires more explicit configuration and understanding of dependencies compared to `React.memo()`.

2. **Potential Overhead**: In some cases, the overhead of managing memoization might outweigh the performance benefits.

## Difference between React.memo() and useMemo()

The primary distinction lies in their use cases:

- **React.memo()** is designed to memoize entire components and is suitable for functional components that purely depend on their props.

- **useMemo()** is geared towards memoizing specific values or calculations within a component and is beneficial for components with more complex internal logic.

## When to use React.memo() and useMemo()?

- **Use `React.memo()` when:**

  - Dealing with functional components.

  - The component's rendering is solely based on its props.

  - We want to avoid unnecessary renders for unchanged props.

- **Use `useMemo()` when:**

  - Working with expensive calculations or functions inside a component.

  - We want to memoize a specific value and not the entire component.

  - There are computations that don’t solely depend on props but also on other local variables.

## Complex Rendering Scenarios:

- **Passing function as a Prop** : When [passing functions as props](https://react.dev/reference/react/memo#troubleshooting), their reference changes on parent rerenders, causing unnecessary child re-renders. Here we can use the [useCallback](https://react.dev/reference/react/useCallback) hook to maintain a consistent function reference across rerenders, optimizing performance. For example, consider a button component that receives an `onClick` function as a prop. By using [useCallback](https://react.dev/reference/react/useCallback), we ensure that the `onClick` function remains the same, preventing unnecessary re-renders of the button component.

  <iframe src="https://codesandbox.io/embed/26dxn9?view=Editor+%2B+Preview&module=%2Fsrc%2Fapp.js"
    style="width:100%; height: 600px; border:0; border-radius: 4px; overflow:hidden; margin: 20px auto;"
    title="React-Memo-Passing-Function-As-Prop"
    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>

- **Passing object as a Prop**: When [passing objects as props](https://react.dev/reference/react/memo#troubleshooting), React.memo may not prevent child re-renders on parent rerenders due to changing object references. Here we can use the useMemo hook to memoize the object itself, preventing unnecessary child component updates.

  <iframe src="https://codesandbox.io/embed/tqs9jw?view=Editor+%2B+Preview&module=%2Fsrc%2FApp.js"
    style="width:100%; height: 600px; border:0; border-radius: 4px; overflow:hidden; margin: 20px auto;"
    title="React-Memo-Passing-Object-As-Prop"
    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>

## Conclusion:

In conclusion, the importance of memoization in React cannot be overstated. By strategically leveraging tools like `React.memo()` and `useMemo()`, developers can strike a balance between performance optimization and code simplicity. Understanding the advantages, disadvantages, and use cases of each tool empowers developers to make informed decisions, ultimately contributing to the creation of efficient and responsive React applications.
