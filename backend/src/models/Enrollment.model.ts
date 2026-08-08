import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Enrollment extends Model {
  declare id: string;
  declare user_id: string;
  declare course_id: string;
  declare status: 'active' | 'completed' | 'dropped' | 'expired';
  declare progress_percentage: number;
  declare completed_at: Date | null;
  declare certificate_issued: boolean;
  declare payment_id: string | null;
  declare enrolled_by: string | null;
  declare enrolled_at: Date;
  declare expired_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Enrollment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'courses', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'dropped', 'expired'),
      allowNull: false,
      defaultValue: 'active',
    },
    progress_percentage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    certificate_issued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    payment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    enrolled_by: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    enrolled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'enrollments',
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'course_id'] },
      { fields: ['user_id'] },
      { fields: ['course_id'] },
      { fields: ['status'] },
    ],
  }
);
