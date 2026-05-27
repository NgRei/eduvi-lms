import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class CourseInstructor extends Model {
  declare course_id: string;
  declare instructor_id: string;
  declare is_primary: boolean;
  declare readonly createdAt: Date;
}

CourseInstructor.init(
  {
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    instructor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'course_instructors',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);
