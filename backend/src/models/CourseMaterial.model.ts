import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class CourseMaterial extends Model {
  declare id: string;
  declare course_id: string;
  declare lesson_id: string | null;
  declare title: string;
  declare material_type: 'pdf' | 'video' | 'slide' | 'link' | 'zip' | 'other';
  declare file_url: string;
  declare file_size_kb: number | null;
  declare sort_order: number;
  declare is_downloadable: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CourseMaterial.init(
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
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'lessons',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    material_type: {
      type: DataTypes.ENUM('pdf', 'video', 'slide', 'link', 'zip', 'other'),
      allowNull: false,
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    file_size_kb: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_downloadable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'course_materials',
    underscored: true,
  }
);
