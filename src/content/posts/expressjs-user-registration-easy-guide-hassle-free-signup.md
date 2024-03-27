---
title: "Express.js User Registration: Easy Guide for Hassle-Free Sign-Up"
publishedOn: 2020-05-14
summary: "Learn user registration with schema creation, password hashing, and MongoDB insertion for authentication."
tags: ["backend", "node.js", "express.js"]
keywords: "Express.js, Node.js, User registration, Authentication process, Schema creation, Password hashing, MongoDB insertion, User security, Web authentication, Secure user management, Bcrypt"
author: Sanjib Roy
---

Authentication is a way to identify a user and giving him/her access to specific content depending on the user's id.

Authentication contains various steps. In this article, I will discuss the user registration part. So let's begin our discussion.

## Dependencies
In this article following packages are used
- express
- nodemon
- mongoose
- bcrypt

## A. User Registration:

In order to authenticate a user, first of all, we have to create or register a user.

### 1. Create Schema:
MongoDB is a document-based database, which stores JSON like data. Schema is the structure of the document. The schema describes the fields we have in our form.

Suppose that our registration form has 3 fields- name, email and password. Then it should look something like this.

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const userSchema = new Schema( {
 name : {
   type: String,
   required: true
 },
 email: {
   type: String,
   required: true,
   unique: true
 },
 password : {
   type: String,
   minlength: 8,
   maxlength: 20  
 }
},{timestamps : true} );

module.exports = mongoose.model("User", userSchema);
```
After designing schema we have to export the model so that we can use it later. A model is the instance of documents.

### 2. Hashing:

When a user submits the registration form now it's our responsibility to protect his/her data. So before storing all his data into the database, we have to encrypt or hash user's confidential data like password, etc. In that case, we will use prehook what it does, it simply performs a specific task before the registered event occurs which is in our case "save".

So we will hash the user's password before saving or storing all his information into the database. So in order to hash the password, we need to install "bcrypt" package. After that, we will add a prehook to our mongoose schema. Then we will use "bcrypt.hash" to hash the password.
```js
/* syntax: */
    
bcrypt.hash(PlaintextPassword, saltRounds, function(err, hash){
  ...
})
```
`saltRounds` indicates the amount of time needed to calculate a single bcrypt hash. Higher the salt rounds, the more hashing rounds are done. You should use the maximum number of rounds which is tolerable, performance-wise, in your application.

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const userSchema = new Schema( {
name : {
   type: String,
   required: true
 },
email: {
   type: String,
   required: true,
   unique: true
 },
password : {
   type: String,
   minlength: 8
 }
},{timestamps : true} );
//Prehook part
userSchema.pre("save", function(next) {
this.password = bcrypt.hash(this.password, 10,(err, hashedPassword) => {
      if(err) return next(err);
      this.password = hashedPassword;
      next();
   });
})
module.exports = mongoose.model("User", userSchema);
```

### 3. Insert Data into MongoDB:

- First, we have to require the User model.
- To insert data into MongoDB we have to parse it. We can parse form's data using " express.urlencoded". It stores all the value of the filled out from inside the `request.body`.
- Create a POST route for sending the data to the server. Here I'm redirecting the request to the "/users/login" route after the user has been successfully registered.

it should look like this:

```js
var express = require('express');
var router = express.Router();
var User = require('../models/user');

router.post('/register', (req, res, next)=> {
  User.create(req.body, (err, createdUser) => {
    if(err) return next(err);
    res.redirect("/users/login");
  })
})
```