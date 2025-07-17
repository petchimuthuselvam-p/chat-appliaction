const { DataTypes } = require('sequelize');
const sequelize = require('../db/db.config');

const User = sequelize.define('User', {
    user_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: true },
    phone_no: { type: DataTypes.STRING, allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    roleName: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USER' },
    created_on: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)) // IST time
    }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = { User };


