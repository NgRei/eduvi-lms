import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class AuditLog extends Model {
  declare id: number;
  declare user_id: string | null;
  declare action: string;
  declare entity_type: string | null;
  declare entity_id: string | null;
  declare detail: object | null;
  declare ip_address: string | null;
  declare readonly createdAt: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: { model: 'users', key: 'id' },
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    detail: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: [{ name: 'created_at', order: 'DESC' }] },
    ],
  }
);
