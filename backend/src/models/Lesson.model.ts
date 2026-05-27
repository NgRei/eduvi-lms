import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Lesson extends Model {
  declare id: string;
  declare course_id: string;
  declare title: string;
  declare sort_order: number;
  declare lesson_type: 'video' | 'text' | 'quiz' | 'live';
  declare content_url: string | null;
  declare content_text: string | null;
  declare duration_minutes: number | null;
  declare is_preview: boolean;
  declare is_published: boolean;
  declare deleted_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Lesson.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lesson_type: {
      type: DataTypes.ENUM('video', 'text', 'quiz', 'live'),
      allowNull: false,
      defaultValue: 'video',
    },
    content_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    content_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    is_preview: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'lessons',
    underscored: true,
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);
