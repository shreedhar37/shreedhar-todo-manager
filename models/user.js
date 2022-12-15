"use strict";
//const { last } = require("cheerio/lib/api/traversing");
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Todo, {
        foreignKey: "userId",
      });
    }

    static createUser(firstName, lastName, email, password) {
      console.log(firstName, lastName, email, password);
      return this.create({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      });
    }
  }
  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 3,
        },
      },

      lastName: {
        type: DataTypes.STRING,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
        },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 8,
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
