import { DataTypes, Sequelize, Model, Optional } from 'sequelize';
import sequelize from '../db/db.config';
import bcrypt from 'bcrypt';

function generate16DigitId(): string {
  return Math.floor(1e15 + Math.random() * 9e15).toString();
}

// ==================== User Model Types ====================
interface UserAttributes {
  id?: number;
  user_name: string;
  email: string;
  password?: string;
  phone_no: string;
  dob: string;
  status?: string;
  roleName?: string;
  created_on?: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'password' | 'status' | 'roleName' | 'created_on'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public user_name!: string;
  public email!: string;
  public password?: string;
  public phone_no!: string;
  public dob!: string;
  public status!: string;
  public roleName!: string;
  public created_on!: Date;
}

User.init({
  user_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: true },
  phone_no: { type: DataTypes.STRING, allowNull: false },
  dob: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  roleName: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USER' },
  created_on: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: () => new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000)
  }
}, {
  sequelize,
  tableName: 'users',
  timestamps: false
});

// ==================== Admin Model Types ====================
interface AdminAttributes {
  adminId?: string;
  adminName: string;
  adminEmail: string;
  password: string;
  roleName?: string;
}

type AdminCreationAttributes = Optional<AdminAttributes, 'adminId' | 'roleName'>;

class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  public adminId!: string;
  public adminName!: string;
  public adminEmail!: string;
  public password!: string;
  public roleName!: string;
}

Admin.init({
  adminId: {
    type: DataTypes.STRING(16),
    primaryKey: true,
    allowNull: false,
    defaultValue: generate16DigitId
  },
  adminName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  adminEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roleName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ADMIN'
  }
}, {
  sequelize,
  tableName: 'tbl_admin',
  timestamps: false,
  hooks: {
    beforeCreate: async (admin: Admin) => {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);
    }
  }
});

// ==================== Export Models ====================
export { User, Admin };
