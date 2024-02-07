
module.exports = (sequelize, Sequelize) => {
  const employees = sequelize.define('Employee', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    dob: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    designation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    education: {
      type: Sequelize.STRING,
      allowNull: true,
    },

  });
  return employees;
};
