import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Video extends Model {
  declare id: string;
  declare cloudinary_id: string;
  declare public_id: string;
  declare original_name: string;
  declare format: string;
  declare duration: number;
  declare size_bytes: number;
  declare width: number | null;
  declare height: number | null;
  declare thumbnail_url: string | null;
  declare lesson_id: string | null;
  declare course_id: string;
  declare uploaded_by: string;
  declare is_processed: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Video.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cloudinary_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    public_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    format: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    size_bytes: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    thumbnail_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'lessons', key: 'id' },
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'courses', key: 'id' },
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    is_processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'videos',
    underscored: true,
    indexes: [
      { fields: ['course_id'] },
      { fields: ['lesson_id'] },
      { fields: ['cloudinary_id'] },
    ],
  }
);
