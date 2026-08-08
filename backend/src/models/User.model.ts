import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
  declare id: string;
  declare email: string;
  declare username: string;
  declare password_hash: string;
  declare full_name: string;
  declare user_type: 'student' | 'instructor' | 'admin';
  declare avatar_url: string | null;
  declare timezone: string;
  declare bio: string | null;
  declare locale: string;
  declare is_active: boolean;
  declare email_verified: boolean;
  declare last_login_at: Date | null;
  declare deleted_at: Date | null;
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
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'Asia/Ho_Chi_Minh',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    locale: {
      type: DataTypes.STRING(10),
      defaultValue: 'vi',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
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
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['email'] },
      { fields: ['user_type'] },
      { fields: ['is_active', 'deleted_at'] },
    ],
  }
);
