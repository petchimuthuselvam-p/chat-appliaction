const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

// Employee table
const Employee = sequelize.define('Employee', {
    user_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone_no: { type: DataTypes.STRING, allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'active' }
}, {
    tableName: 'employees',
    timestamps: false
});

// User table
const User = sequelize.define('User', {
    user_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = {
    Employee,
    User
};
