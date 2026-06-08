import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
  declare id: string;
  declare email: string;
  declare username: string;
  declare password_hash: string;
  declare full_name: string;
  declare user_type: 'student' | 'instructor' | 'admin';
  declare is_active: boolean;
  declare reset_password_token: string | null;
  declare reset_password_expires: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    user_type: {
      type: DataTypes.ENUM('student', 'instructor', 'admin'),
      allowNull: false,
      defaultValue: 'student',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['user_type'] },
      { fields: ['is_active'] },
    ],
  }
);
