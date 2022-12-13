const express = require("express");
let csrf = require("tiny-csrf");
const path = require("path");
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
let cookieParser = require("cookie-parser");

// eslint-disable-next-line no-unused-vars
const todo = require("./models/todo");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("123456789iamasecret987654321look", ["PUT", "POST", "DELETE"]));

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", async function (request, response) {
  try {
    const overdueItems = await Todo.getOverdueItems();
    const dueTodayItems = await Todo.getDueTodayItems();
    const dueLaterItems = await Todo.getDueLaterItems();
    const completedItems = await Todo.getCompletedTodos();
    const pageTitle = "TO-DO Manager";

    if (request.accepts("html")) {
      return response.render("index", {
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
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE

  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
  try {
    const todos = await Todo.getTodos();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo(request.body);
    //return response.json(todo);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  // console.log(request.body.completed);

  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
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
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Sign up",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  // creating user

  try {
    const user = await User.createUser(request.body);
    console.log(user);
    response.redirect("/");
  } catch (error) {
    console.log(error);
  }
});
module.exports = app;
