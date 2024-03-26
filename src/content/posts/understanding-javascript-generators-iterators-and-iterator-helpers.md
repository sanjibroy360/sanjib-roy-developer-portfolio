---
title: Understanding Generators, Iterators, and Iterator Helpers in JavaScript
publishedOn: 2023-11-23
summary: Understand JavaScript generators for pausing functions, ideal with large datasets. Learn iterator basics, next() method, and efficient iteration with helpers.
tags: ["frontend", "javascript"]
keywords: "frontend, javascript, Generators, Iterators, Iterator Helpers, yield, yield in javascript"
author: Sanjib Roy
---

> This blog is also published in [blog.saeloun.com](https://blog.saeloun.com/2023/11/23/understanding-javascript-generators-iterators-and-iterator-helpers/)

When working with collections of data in JavaScript, iterators and iterator helpers are essential concepts to grasp. They allow developers to traverse through elements efficiently and manipulate data in various ways. In this article, we will explore the concepts of iterators, generators, yield, next(), and iterables, focusing on JavaScript, and understand how iterator helpers simplify our coding experience.

## Understanding Generators:

- ### Generator:

  Generators are special functions that can be paused and resumed. They allow us to define an iterative algorithm by writing a single function which can maintain its state, and the state can be paused at any time and later resumed. Generators are defined using `function*` syntax in JavaScript.

- ### yield:

  The `yield` keyword is used within generator functions to pause the function's execution and return a value to the caller. When the generator function is called, it doesn't immediately execute; instead, it returns a `generator` object. The first invocation of the `next()` method on this object initiates the function's execution until it reaches the first `yield` statement. Here, the generator pauses and produces an object with `{value: yieldedValue, done: false}`. The `yieldedValue` corresponds to the value specified after yield, and `done` is `false`, signifying that the generator is still in progress and can be further advanced using subsequent `next()` calls. This feature is incredibly useful when dealing with large datasets or time-consuming computations.

- ### next() method:

  The `next()` method is used to control the generator's execution. When we call `next()`, the generator function runs until it encounters a yield statement or until the function completes. The combination of `yield` and `next()` provides a powerful way to iterate over data incrementally.

Here is an example of a generator function that generates random numbers between 1000 and 9999 -

```js
function* randomNumbers() {
  while (true) {
    yield Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
  }
}

const randomNumbersGeneratorObj = randomNumbers();

const randomNumber = randomNumbersGeneratorObj.next().value;
console.log(randomNumber); // 3973

const randomNumber2 = randomNumbersGeneratorObj.next().value;
console.log(randomNumber2); // 5899
```

## Understanding Iterators and Iterables:

- ### Iterator:

  An iterator is an object that provides a way to access elements in a collection one at a time, without exposing the underlying representation of the collection. It keeps track of the current position and returns the next value when requested. In JavaScript, any object with a `next()` method is considered an iterator.

```js
const colors = ["red", "green", "blue"];

const colorIterator = {
  index: 0,
  next: function () {
    if (this.index < colors.length) {
      return { value: colors[this.index++], done: false };
    } else {
      return { done: true };
    }
  },
};

// Using the iterator
console.log(colorIterator.next()); // { value: 'red', done: false }
console.log(colorIterator.next()); // { value: 'green', done: false }
console.log(colorIterator.next()); // { value: 'blue', done: false }
console.log(colorIterator.next()); // { done: true }
```

- ### Iterable:

  An iterable is an object that implements the Symbol.iterator method, which returns an iterator object. Arrays, strings, maps, and sets are examples of iterables in JavaScript. Iterables can be looped over using for...of loops, making it easy to access their elements sequentially.

```js
// Iterable: Shopping Cart
class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(name, price) {
    this.items.push({ name, price });
  }

  // Iterable protocol implementation
  [Symbol.iterator]() {
    let index = 0;
    const items = this.items;

    return {
      next: () => {
        if (index < items.length) {
          return { value: items[index++], done: false };
        } else {
          return { done: true };
        }
      },
    };
  }
}

// Example usage
const cart = new ShoppingCart();
cart.addItem("Laptop", 800);
cart.addItem("Mouse", 50);
cart.addItem("Keyboard", 30);

let totalPrice = 0;
for (const item of cart) {
  totalPrice += item.price;
}

console.log(`Total Price: $${totalPrice}`); // Total Price: $880
```

## Iterator Helpers

In JavaScript, [iterator helpers](https://github.com/tc39/proposal-iterator-helpers) are a collection of methods that provide additional functionality for iterators. They are designed to make iterating over data more concise and expressive. Iterator helpers are part of the [ECMAScript proposal](https://tc39.es/proposal-iterator-helpers/) for iterator helpers, which is currently in Stage 3 of the TC39 process.

### 1. .map(mapperFunction):

The `.map(mapperFunction)` method takes a mapping function as an argument and returns an iterator that produces transformed elements based on the results of applying the mapping function to the elements produced by the underlying iterator.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const squaredNumbersGeneratorObj = naturalNumbers().map((value) => value ** 2);

squaredNumbersGeneratorObj.next(); //  {value: 0, done: false};
squaredNumbersGeneratorObj.next(); //  {value: 1, done: false};
squaredNumbersGeneratorObj.next(); //  {value: 4, done: false};
```

### 2. .filter(filtererFunction):

The `.filter(filtererFunction)` method takes a filtering function as an argument and returns an iterator that produces only those elements of the underlying iterator for which the filtering function returns a truthy value. It's like selecting only the items that match a certain condition from an iterator.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const evenNumbersGeneratorObj = naturalNumbers().filter((value) => value % 2);

evenNumbersGeneratorObj.next(); //  {value: 0, done: false};
evenNumbersGeneratorObj.next(); //  {value: 2, done: false};
evenNumbersGeneratorObj.next(); //  {value: 4, done: false};
```

### 3. .take(limit):

The `.take(limit)` method takes an integer(limit) as an argument and returns an iterator that produces, at most, the given number of elements produced by the underlying iterator. It's like taking a slice of an array, but for iterators.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const generatorObj = naturalNumbers().take(4);

generatorObj.next(); //  {value: 0, done: false};
generatorObj.next(); //  {value: 1, done: false};
generatorObj.next(); //  {value: 2, done: false};
generatorObj.next(); //  {value: 3, done: false};
generatorObj.next(); //  {value: 4, done: false};
generatorObj.next(); //  {value: undefined, done: true};
```

### 4. .drop(limit):

The `.drop(limit)` method takes an integer as an argument and returns an iterator that skips the given number of elements produced by the underlying iterator before itself producing any remaining elements. It's like skipping the first few items in a queue.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const generatorObj = naturalNumbers().drop(3);

generatorObj.next(); //  {value: 3, done: false};
generatorObj.next(); //  {value: 4, done: false};
generatorObj.next(); //  {value: 5, done: false};
```

### 5. .flatMap(mapperFunction):

The .flatMap() method takes a mapping function as an argument and returns an iterator that produces all elements of the iterators produced by applying the mapping function to the elements produced by the underlying iterator. It's like flattening a nested structure of iterators.

```js
const students = [
  {
    name: "John Doe",
    courses: ["Math", "Science", "English"],
  },
  {
    name: "Jane Doe",
    courses: ["History", "Art", "Music"],
  },
  {
    name: "Peter Jones",
    courses: ["Computer Science", "Economics", "Math"],
  },
].values();

const allCourses = students.flatMap((student) => student.courses.values());

console.log(allCourses); // ['Math', 'Science', 'English', 'History', 'Art', 'Music', 'Computer Science', 'Economics', 'Math']
```

### 6. .reduce(reducer [, initialValue ]):

The `.reduce()` method takes a reducer function and an optional initial value as arguments. It applies the reducer function to every element produced by the iterator, accumulating the results into a single value. It's like combining multiple values into a single accumulator.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const factorial = naturalNumbers()
  .take(4)
  .reduce((acc, value) => {
    if (value == 0) {
      return 1;
    } else {
      return acc * value;
    }
  }, 1);

console.log(factorial); // 6
```

### 7. .toArray():

The `.toArray()` method, as the name suggests, converts an iterator into an array. It's useful when we want to store the iterator's elements in a more accessible array format.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const numbersArr = naturalNumbers().take(4).toArray();

console.log(numbersArr); // [0, 1, 2, 3, 4]
```

### 8. .forEach(function):

The `.forEach(function)` method takes a function as an argument and executes it for each element produced by the iterator. It's useful for performing side effects, such as logging or updating data, without explicitly storing the iterator's values. The `.forEach(function)` method returns undefined.

```js
const studentsArr = [];
const iter = ["Alice", "Bob", "Charlie", "David", "Emily"].values();

iter.forEach((value) => studentsArr.push(value));
console.log(studentsArr.join(", ")); // "Alice, Bob, Charlie, David, Emily"
```

### 9. .some(predicateFunction):

The `.some(predicateFunction)` method takes a predicate function as an argument and returns true if any element produced by the iterator satisfies the predicate function. It's useful for checking if any element matches a certain condition.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const iter = naturalNumbers().take(10);

iter.some((value) => value % 2 == 0); // true
iter.some((value) => value > 10); // false
```

### 10. .every(predicateFunction):

The `.every(predicateFunction)` method takes a predicate function as an argument and returns true if all elements produced by the iterator satisfy the predicate function. It's useful for checking if every element matches a certain condition.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const iter = naturalNumbers().take(10);

iter.some((value) => value % 2 == 0); // false, because 1,3,5,7,9 is not divisible by 2
iter.some((value) => value <= 10); // true
```

### 11. .find(predicateFunction):

The `.find(predicateFunction)` method takes a predicate function as an argument and returns the first element produced by the iterator that satisfies the predicate function. It's useful for finding the first occurrence of an element that matches a certain condition.

```js
function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const iter = naturalNumbers().take(10);

iter.some((value) => value % 2 == 0); // 0, because 0 is first number which is divisible by 2
```

### 12. Iterator.from(object):

The `.from(object)` method is a static method that takes an object as an argument and returns an iterator for the object. It's useful for creating an iterator from various data structures, such as arrays, strings, or custom objects.

```js
class CountryIterator {
  constructor(countries) {
    this.countries = countries;
    this.index = 0;
  }

  next() {
    if (this.index < this.countries.length) {
      const country = this.countries[this.index];
      this.index++;
      return {
        value: country,
        done: false,
      };
    } else {
      return {
        value: undefined,
        done: true,
      };
    }
  }
}

const countries = [
  { name: "China", population: 1444151882 },
  { name: "India", population: 1380000000 },
  { name: "United States", population: 332915073 },
  { name: "Indonesia", population: 273523621 },
  { name: "Pakistan", population: 227162775 },
];

const countriesIterator = new CountryIterator(countries);

const iter = Iterator.from(countriesIterator);

console.log(iter.next()); // {done: false, value: {name: "China", population: 1444151882}}
console.log(iter.next()); // {done: false, value: {name: "India", population: 1380000000}}
```

## Conclusion:

In conclusion, JavaScript generators and iterators are powerful tools that help manage data effectively. With the ability to pause and resume functions, generators simplify handling large datasets. Iterators provide a step-by-step approach to accessing collection elements. Together, they streamline data manipulation. Iterator helpers like .map(), .filter(), .reduce(), .find(), .some(), .every(), .forEach(), etc further enhance this process, making it more efficient and straightforward.
