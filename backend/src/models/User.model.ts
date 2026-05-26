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
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
  }
);
