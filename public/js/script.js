//console.log("First JS import on EJS application!!");

let csrfToken = document
  .querySelector('meta[name="csrf-token"]')
  .getAttribute("content");

// eslint-disable-next-line no-unused-vars
const updateTodo = (id) => {
  let completedStatus = document.querySelector(`#todo-checkbox-${id}`).checked;
  //console.log(completedStatus);

  fetch(`/todos/${id}`, {
    method: "put",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _csrf: csrfToken,
      completed: completedStatus,
    }),
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
    body: JSON.stringify({
      _csrf: csrfToken,
    }),
  })
    .then((res) => {
      if (res.ok) {
        window.location.reload();
      }
    })
    .catch((err) => console.error(err));
};
