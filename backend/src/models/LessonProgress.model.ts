import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class LessonProgress extends Model {
  declare id: string;
  declare user_id: string;
  declare lesson_id: string;
  declare course_id: string;
  declare is_completed: boolean;
  declare watch_duration: number;
  declare last_position: number;
  declare quiz_score: number | null;
  declare completed_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LessonProgress.init(
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
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'lessons', key: 'id' },
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'courses', key: 'id' },
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    watch_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    quiz_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'lesson_progress',
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'lesson_id'] },
      { fields: ['user_id', 'course_id'] },
    ],
  }
);
