import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Category extends Model {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare parent_id: string | null;
  declare icon_url: string | null;
  declare sort_order: number;
  declare is_active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    icon_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    underscored: true,
  }
);
