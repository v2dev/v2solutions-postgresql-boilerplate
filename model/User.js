module.exports = (sequelize, Sequelize) => {
  const users = sequelize.define('User', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    country: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    mfaSecret: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    resetPasswordToken: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    token: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });
  return users;
};
