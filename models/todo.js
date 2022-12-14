"use strict";
const { Model, where } = require("sequelize");
const { Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }

    setCompletionStatus(completedStatus) {
      return this.update({
        completed: completedStatus,
      });
    }

    static getTodos() {
      const todos = Todo.findAll({
        order: [["id", "ASC"]],
      });
      return todos;
    }

    static getOverdueItems(userId) {
      const overdueItems = Todo.findAll({
        where: {
          dueDate: { [Op.lt]: new Date() },
          completed: { [Op.eq]: false },
          userId,
        },
        order: [["id", "ASC"]],
      });

      return overdueItems;
    }

    static getDueTodayItems(userId) {
      const dueTodayItems = Todo.findAll({
        where: {
          dueDate: new Date(),
          completed: { [Op.eq]: false },
          userId,
        },
        order: [["id", "ASC"]],
      });

      return dueTodayItems;
    }

    static getDueLaterItems(userId) {
      const dueLaterItems = Todo.findAll({
        where: {
          dueDate: { [Op.gt]: new Date() },
          completed: { [Op.eq]: false },
          userId,
        },
        order: [["id", "ASC"]],
      });

      return dueLaterItems;
    }

    deleteTodo(userId) {
      return this.destroy({
        where: {
          id: this.id,
          userId,
        },
      });
    }

    static getCompletedTodos(userId) {
      return this.findAll({
        where: { completed: { [Op.eq]: true }, userId },
        order: [["id", "DESC"]],
      });
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 5,
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
