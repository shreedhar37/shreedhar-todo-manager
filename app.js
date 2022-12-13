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
            return done("Invalid Credentials");
          }
        })
        .catch((error) => {
          return error;
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

app.get("/", async function (request, response) {
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
  passport.authenticate("local", { failureRedirect: "/login" }),
  (request, response) => {
    console.log(request.user);
    response.redirect("/todos");
  }
);

// eslint-disable-next-line no-unused-vars
app.get("/signout", (request, response, next) => {
  //signout
  request.logout((error) => {
    if (error) return;
    response.redirect("/");
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
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
          csrfToken: request.csrfToken(),
        });
      } else {
        return response.json({
          title: pageTitle,
          overdueItems: overdueItems,
          dueTodayItems: dueTodayItems,
          dueLaterItems: dueLaterItems,
          completedItems: completedItems,
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

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
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
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
    // FILL IN YOUR CODE HERE

    // First, we have to query our database to delete a Todo by ID.
    // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
    // response.send(true)
    const todo = await Todo.findByPk(request.params.id);
    if (todo) {
      try {
        const deletedTodo = await todo.deleteTodo();

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
  // secure the password
  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPassword);

  // creating user
  try {
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
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
