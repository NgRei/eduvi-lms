import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Course extends Model {
  declare id: string;
  declare category_id: string | null;
  declare title: string;
  declare slug: string;
  declare short_description: string | null;
  declare description: string | null;
  declare thumbnail: string | null;
  declare price: number;
  declare sale_price: number | null;
  declare target_level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  declare language: string;
  declare is_published: boolean;
  declare published_at: Date | null;
  declare max_students: number | null;
  declare duration_weeks: number | null;
  declare total_lessons: number;
  declare total_students: number;
  declare rating_avg: number;
  declare deleted_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    short_description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    thumbnail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    sale_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    target_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'all'),
      defaultValue: 'all',
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'vi',
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    max_students: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    duration_weeks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    total_lessons: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_students: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rating_avg: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'courses',
    underscored: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['category_id'] },
      { fields: ['is_published', 'deleted_at'] },
      { fields: ['slug'] },
    ],
  }
);
