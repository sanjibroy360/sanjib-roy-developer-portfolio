---
title: "Deciding which state management to use: opting between useContext and Redux"
publishedOn: 2023-08-24
summary: "In this article, we will explore two effective strategies for managing state in React apps: the useContext hook and Redux Toolkit. The article provides practical code examples for both the useContext hook and Redux Toolkit, and it discusses the advantages, disadvantages, and best-fit scenarios for each approach."
tags: ["frontend", "react", "redux"]
keywords: "useContext, redux, state management"
author: Sanjib Roy
---

> This blog is also published in [blog.saeloun.com](https://blog.saeloun.com/2023/08/24/deciding-which-state-management-to-use-opting-between-use-context-and-redux/)

In the world of React development, managing state is a big challenge. Luckily, we have tools like the useContext hook and Redux to help. Even though they might seem similar, they have different jobs. In this article, we will explore both tools, explaining when to use them, their pros and cons, and the best times to use them in our projects. Let's dive in and understand these tools better.

## useContext

The useContext hook is a built-in feature of React. It enables the transfer of data throughout the component tree, relieving the complexities associated with props.

### Using useContext hook:

Consider the scenario of developing a todo list application,, where different components require access to the list items:

```js
import React, { useState } from 'react';

// Create a context
const TodoContext = React.createContext();

function App() {
  // Initial tasks for the todo list
  const initialTasks = [
    { id: 1, title: 'Buy groceries', completed: false },
    { id: 2, title: 'Learn JavaScript', completed: false },
    { id: 3, title: 'Finish project', completed: false },
  ];

  // State to hold the tasks and the function to update tasks
  const [tasks, setTasks] = useState(initialTasks);

  // Function to update tasks
  const updateTasks = (updatedTasks) => {
    setTasks(updatedTasks);
  };

  // Function to add a new task
  const addTask = (title = '') => {
    const newTask = { id: tasks.length + 1, title, completed: false };
    updateTasks([...tasks, newTask]);
  };

  {% raw %}
  return (
    // Provide the tasks and updateTasks function to the context
    <TodoContext.Provider value={{ tasks, updateTasks, addTask }}>
      <div>
        <h1>Todo App</h1>
        {/* AddTaskForm component to handle adding new tasks */}
        <AddTaskForm />
        {/* TodoList component to display the list of tasks */}
        <TodoList />
      </div>
    </TodoContext.Provider>
  );
  {% endraw %}
}

function AddTaskForm() {
  // Access the addTask function from the context
  const { addTask } = React.useContext(TodoContext);
  // State to handle the input value
  const [inputValue, setInputValue] = useState('');

  // Handle input change event
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    if (inputValue.trim()) {
      // Call the addTask function to add a new task
      addTask(inputValue);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Add a new task"
      />
      <button type="submit">Add</button>
    </form>
  );
}

function TodoList() {
  // Access tasks and updateTasks function from the context
  const { tasks, updateTasks } = React.useContext(TodoContext);

  // Function to toggle task status
  const toggleTaskStatus = (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    // Update tasks using the updateTasks function
    updateTasks(updatedTasks);
  };

  {% raw %}
  return (
    <div>
      {tasks?.length > 0 ? (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <span
                style={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => toggleTaskStatus(task.id)}
              >
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No task added</p>
      )}
    </div>
  );
  {% endraw %}
}

export default App;
```

### Pros of useContext hook:

- Easy to learn and use: The useContext hook is a relatively simple hook to learn and use. It has a small API surface and is easy to understand.
- Lightweight: The useContext hook is a lightweight hook that does not add any overhead to our application. It is a good choice for small to medium-sized applications.
- Flexible: The useContext hook is a flexible hook that can be used to share any type of state between components. We can use it to share simple state, such as a counter, or complex state, such as an object containing the user's information.
- Efficient: The useContext hook is efficient in terms of performance. It only re-renders the components that need to be re-rendered when the context value changes.

### Cons of useContext hook:

- Not good for large applications: The useContext hook can be difficult to manage in large applications. It can be difficult to keep track of all of the different contexts and their values.
- Not as scalable as Redux: The useContext hook is not as scalable as Redux. Redux is a more mature library that is designed to be used in large and complex applications.

## Redux Toolkit

On the other hand, Redux offers a comprehensive state management solution, and Redux Toolkit simplifies the process. Redux provides a centralized store for our app's state, enabling components to interact with it seamlessly.

### Using Redux Toolkit:

Imagine building an e-commerce app, where users can interact with a shopping cart:

- Install Redux Toolkit:

```bash
yarn add @reduxjs/toolkit react-redux
```

- Create a Redux Slice for Cart:

```js
// Define the initial state and reducers
const initialState = {
  cartItems: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action) => {
      state.cartItems.push(action.payload);
    },
    removeItem: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (item) => item.id !== action.payload
      );
    },
  },
});

// Export actions and reducer
export const { addItem, removeItem } = cartSlice.actions;
export default cartSlice.reducer;
```

- Configure the Redux Store:

```js
// Configure the store
// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";

const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

export default store;
```

- Wrap our app with the Redux store using the `Provider` from `react-redux`:

```js
// src/index.js
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "./App";
import store from "./store";
import "./index.css";

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
```

### Pros of Redux Toolkit:

- Structured State Management: Offers a structured way to manage complex application states.
- Predictable Updates: Ensures state updates are predictable, avoiding unexpected side effects.
- Centralized State: All data is stored centrally, making it accessible across components.
- DevTools Integration: Provides powerful debugging tools to track state changes.
- Scalability: Ideal for larger applications with intricate state management needs.

### Cons of Redux Toolkit:

- Learning Curve: Requires understanding Redux concepts, which might be challenging for beginners.
- Setup Overhead: Initial setup might seem overwhelming for small projects.
- Limited Local State: Better suited for global state management; local state might be overkill.

## Conclusion

To sum up, picking between useContext and Redux Toolkit depends on how big and complicated our project is. If our project is small and we want things to be simple, useContext is great. But if we're working on a bigger and more complex project, Redux Toolkit is better. By knowing the good and not-so-good parts of each tool, we can decide what's best for our project.
