console.log("First JS import on EJS application!!");

// eslint-disable-next-line no-unused-vars
const updateTodo = (id) => {
  fetch(`/todos/${id}/markAsCompleted`, {
    method: "put",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (res.ok) {
        window.location.reload();
      }
    })
    .catch((err) => console.error(err));
};

// eslint-disable-next-line no-unused-vars
const deleteTodo = (id) => {
  fetch(`/todos/${id}`, {
    method: "delete",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (res.ok) {
        window.location.reload();
      }
    })
    .catch((err) => console.error(err));
};
