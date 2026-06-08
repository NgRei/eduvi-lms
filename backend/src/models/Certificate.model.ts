import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Certificate extends Model {
  declare id: string;
  declare course_id: string;
  declare template_url: string | null;
  declare title: string;
  declare description: string | null;
  declare valid_days: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Certificate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'courses', key: 'id' },
    },
    template_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
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
    valid_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'certificates',
    underscored: true,
  }
);
