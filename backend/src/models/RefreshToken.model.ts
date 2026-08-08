import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class RefreshToken extends Model {
  declare id: string;
  declare user_id: string;
  declare token_hash: string;
  declare device_info: string | null;
  declare ip_address: string | null;
  declare expires_at: Date;
  declare revoked_at: Date | null;
  declare readonly createdAt: Date;
}

RefreshToken.init(
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
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
    ],
  }
);
