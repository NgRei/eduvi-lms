import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class CourseReview extends Model {
  declare id: string;
  declare course_id: string;
  declare user_id: string;
  declare rating: number;
  declare comment: string | null;
  declare is_visible: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CourseReview.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'courses', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    is_visible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'course_reviews',
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'course_id'] },
      { fields: ['course_id'] },
    ],
  }
);
