import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Assignment extends Model {
  declare id: string;
  declare course_id: string;
  declare lesson_id: string | null;
  declare title: string;
  declare description: string | null;
  declare assignment_type: 'quiz' | 'essay' | 'upload';
  declare total_points: number;
  declare passing_score: number;
  declare time_limit_minutes: number | null;
  declare attempts_allowed: number;
  declare show_answer_after: boolean;
  declare due_date: Date | null;
  declare is_published: boolean;
  declare deleted_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Assignment.init(
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
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: { model: 'lessons', key: 'id' },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    assignment_type: {
      type: DataTypes.ENUM('quiz', 'essay', 'upload'),
      allowNull: false,
      defaultValue: 'quiz',
    },
    total_points: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    passing_score: {
      type: DataTypes.FLOAT,
      defaultValue: 50,
    },
    time_limit_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    attempts_allowed: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    show_answer_after: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'assignments',
    underscored: true,
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);
