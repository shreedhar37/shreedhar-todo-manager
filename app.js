const express = require("express");
let csrf = require("tiny-csrf");
const path = require("path");
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
let cookieParser = require("cookie-parser");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10;
// eslint-disable-next-line no-unused-vars
const todo = require("./models/todo");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("123456789iamasecret987654321look", ["PUT", "POST", "DELETE"]));

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
// eslint-disable-next-line no-undef
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "my-super-secret-key-13123123123123112312",
    cookie: {
      maxAge: 24 * 60 * 1000, // 24hrs
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Credentials" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "Invalid Credentials" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session : ", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log("Deserializing user in session");
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", (request, response) => {
  if (request.user) {
    return response.redirect("/todos");
  }
  return response.render("index", {
    title: "Todo Application",
    csrfToken: request.csrfToken,
  });
});

app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log(request.user);
    request.flash("success", "welcome back");
    response.redirect("/todos");
  }
);

// eslint-disable-next-line no-unused-vars
app.get("/signout", (request, response, next) => {
  //signout
  request.logout((error) => {
    if (error) return;
    request.flash("success", "Logged out sucessfully");
    response.redirect("/");
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    //  response.locals.messages.forEach((msg) => console.log(msg));
    const loggedInUser = request.user.id;
    const userName =
      request.user.firstName.charAt(0).toUpperCase() +
      "" +
      request.user.firstName.slice(1);

    try {
      const overdueItems = await Todo.getOverdueItems(loggedInUser);
      const dueTodayItems = await Todo.getDueTodayItems(loggedInUser);
      const dueLaterItems = await Todo.getDueLaterItems(loggedInUser);
      const completedItems = await Todo.getCompletedTodos(loggedInUser);
      const pageTitle = "TO-DO Manager";

      if (request.accepts("html")) {
        return response.render("todos", {
          title: pageTitle,
          overdueItems: overdueItems,
          dueTodayItems: dueTodayItems,
          dueLaterItems: dueLaterItems,
          completedItems: completedItems,
          userName: userName,
          csrfToken: request.csrfToken(),
        });
      } else {
        return response.json({
          title: pageTitle,
          overdueItems: overdueItems,
          dueTodayItems: dueTodayItems,
          dueLaterItems: dueLaterItems,
          completedItems: completedItems,
          userName: userName,
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const todo = await Todo.findByPk(request.params.id);
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      //return response.json(todo);
      request.flash("success", "Added one todo successfully");
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      request.flash("error", "Please add todo with atleast 5 characters");
      return response.redirect("/todos");
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    // console.log(request.body.completed);

    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      request.flash("success", "Updated one todo successfully");

      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);

    const todo = await Todo.findByPk(request.params.id);
    if (todo) {
      try {
        const deletedTodo = await todo.deleteTodo();
        request.flash("success", "Deleted one todo successfully");

        return response.send(deletedTodo ? true : false);
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else return response.send(false);
  }
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Sign up",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  // creating user
  try {
    const alreadyUsedEmail = await User.findOne({
      where: { email: request.body.email },
    });

    if (alreadyUsedEmail) {
      request.flash("error", "A user with this email is already registered");
      response.redirect("/signup");
    }

    if (request.body.firstName.length < 3) {
      request.flash("error", "Firstname should contain atleast 3 characters");
      response.redirect("/signup");
    }

    if (request.body.password.length < 8) {
      request.flash("error", "Password should contain atleast 8 characters");
      response.redirect("/signup");
    }
    
    else {
    // secure the password
    const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);

    const user = await User.createUser(
      request.body.firstName,
      request.body.lastName,
      request.body.email,
      hashedPassword
    );
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      request.flash("success", "Account created successfully");
      response.redirect("/todos");
    });
  }} catch (error) {
    console.log(error);
  }
});

module.exports = app;
