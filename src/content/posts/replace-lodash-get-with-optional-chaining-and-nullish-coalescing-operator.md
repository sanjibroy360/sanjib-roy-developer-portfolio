---
title: Replace lodash.get method with optional chaining and nullish-coalescing operator
publishedOn: 2023-03-02
summary: "Learn how to replace the popular lodash.get() method with the new optional chaining and nullish-coalescing operator introduced in ES11(ES2020)."
tags: ["frontend", "javascript"]
keywords: "lodash.get, optional chaining, nullish-coalescing, javascript, frontend"
author: Sanjib Roy
---

> This blog is also published in [blog.saeloun.com](https://blog.saeloun.com/2023/03/02/replace-lodash-get-with-optional-chaining-and-nullish-coalescing-operator/)

[Lodash](https://www.npmjs.com/package/lodash) is a well-known JavaScript library
that simplifies accessing nested object properties using its [get](https://lodash.com/docs/4.17.15#get) method.
However, [get](https://lodash.com/docs/4.17.15#get) method has some limitations,
hich can slow down our code.
Here, we will discuss how we can use ES11's optional chaining and nullish-coalescing operators to simplify our code and avoid some of the limitations of [lodash.get](https://lodash.com/docs/4.17.15#get).

## Why we preferred lodash.get earlier?

We used [lodash.get](https://lodash.com/docs/4.17.15#get) earlier as it's a popular
utility method for accessing properties of nested objects.
The [get](https://lodash.com/docs/4.17.15#get) method is
less prone to errors and offers features such as default values
and support for accessing properties using dot notation
or array notation.

```js
const user = {
  name: "John Doe",
  address: {
    city: "San Francisco",
  },
};

const cityName = lodash.get(user, "address.city", "No City");
console.log(cityName); // 'San Francisco'
```

## Limitations of using lodash.get

The [lodash.get](https://lodash.com/docs/4.17.15#get) method is a powerful tool
that can help access deeply nested values in JavaScript objects.
However, it has some limitations:

- It can be slower than other methods of accessing nested values, especially when dealing with large objects.

- It requires the entire lodash library, which can significantly increase the size of our codebase.

- It doesn't work with some types of objects, such as arrays and null values.

```js
const arr = [1, 2, 3];
const value = lodash.get(arr, "0");

console.log(value); // undefined
```

- It can be difficult to read and understand when used with deeply nested objects.
  On the other hand,
  optional chaining offers a simpler syntax that looks like accessing properties directly on an object,
  making it easier to read
  and understand.

```js
const customer = {
  name: "John Doe",
  orders: [
    {
      id: "101",
      date: "2022-02-20",
      items: [
        {
          product_id: "456",
          name: "Product B",
          price: 20.99,
          quantity: 1,
          details: {
            weight: 2.5,
            dimensions: {
              width: 10,
              height: 20,
              depth: 5,
            },
          },
        },
      ],
    },
  ],
};

const orderItemWidth = _.get(
  customer,
  "orders[0].items[0].details.dimensions.width",
  0
); // lodash.get method
const orderItemHeight =
  customer?.orders?.[0]?.items?.[0]?.details?.dimensions?.height ?? 0; // Optional Chaining and Nullish-Coalescing
```

## Optional Chaining

The [Optional chaining](https://262.ecma-international.org/11.0/#sec-optional-chains) is a new syntax introduced in ES11(ES2020)
that allows us to safely access deeply nested properties without causing errors.
With this syntax, if the object is `null` or `undefined`,
the expression will return `undefined`,
instead of throwing an error.

```js
const user = {
  id: 371,
  name: "John Doe",
  contact: {
    email: "johndoe@example.com",
    phone: {
      mobile: "123-456-780",
      home: "187-654-3201",
    },
  },
};

const mobilePhone = user?.contact?.phone?.mobile;
const city = user?.contact?.phone?.city;

console.log(mobilePhone); // "123-456-780"
console.log(city); // undefined
```

## Nullish-Coalescing Operator

The [Nullish-Coalescing](https://262.ecma-international.org/11.0/#sec-expressions) Operator is another new feature in JavaScript introduced in ES11(ES2020) that lets us set a default value for variables
that are either `undefined` or `null`.
This can be helpful when we want to ensure that a variable has a specific value,
even if the original value is `falsy`.

```js
async function fetchBlogs() {
  const response = await fetch("https://www.saeloun.com/blogs");
  const blogs = await response.json();
  const defaultThumbnail =
    "https://www.saeloun.com/images/default-thumbnail.jpg";

  return blogs.map((blog) => {
    return {
      title: blog.title,
      author: blog.author,
      thumbnail: blog.thumbnail ?? defaultThumbnail, // thumbnail is set to defaultThumbnail if it is undefined or null
      date: new Date(blog.date),
    };
  });
}
```

```js
const convertCelsiusToFahrenheitTemp = (celsiusTemp) => {
  const isValidTemp =
    typeof (celsiusTemp ?? false) === "number" && !isNaN(celsiusTemp);
  const fahrenheitTemp = isValidTemp
    ? (celsiusTemp * 9) / 5 + 32
    : "Invalid temperature data";

  return fahrenheitTemp;
};

console.log(convertCelsiusToFahrenheitTemp(0)); // 32
console.log(convertCelsiusToFahrenheitTemp(20)); // 68
console.log(convertCelsiusToFahrenheitTemp(null)); // "Invalid temperature data"
console.log(convertCelsiusToFahrenheitTemp(undefined)); // "Invalid temperature data"
console.log(convertCelsiusToFahrenheitTemp()); // "Invalid temperature data"
```

We can also use this operator to set a default value for a function parameter -

```js
const customDebounce = (func, waitTime) => {
  let timeoutId;

  return (...args) => {
    const later = () => {
      clearTimeout(timeoutId);
      func(...args);
    };

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, waitTime ?? 500); // waitTime is set to 500 if it is undefined or null
  };
};

const myFunction = () => console.log("Hello World!");
const myDebouncedFunction = customDebounce(myFunction);
myDebouncedFunction();
```

## Replicating lodash.get default value functionality with Optional Chaining and Nullish-Coalescing

While optional chaining is useful,
it doesn't offer the same default value functionality as [lodash.get](https://lodash.com/docs/4.17.15#get). However, we can replicate this behavior by combining optional chaining with the nullish-coalescing operator.

```js
const user = {
  id: 321,
  name: "John Doe",
  contact: {
    email: "johndoe@example.com",
    phone: {
      mobile: "123-456-780",
      home: "187-654-3201",
    },
  },
};

// Using lodash.get
const cityLodash = lodash.get(user, "address.city", "N/A");
console.log(cityLodash); // 'N/A'

// Using optional chaining with nullish coalescing operator
const cityChaining = person?.address?.city ?? "N/A";
console.log(cityChaining); // 'N/A'
```

## Conclusion

Lodash is indeed a popular JavaScript library with a lot of useful functions.
However, using it solely for the get method might not be the best approach
as it would result in adding an unnecessary dependency to your project.
Additionally, if you only need to retrieve a single value from an object
and provide a default value if the property is absent,
it may be more efficient to use JavaScript's native optional chaining(?.) and nullish-coalescing(??) operators.
