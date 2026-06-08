import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class UserCertificate extends Model {
  declare id: string;
  declare user_id: string;
  declare certificate_id: string;
  declare course_id: string;
  declare cert_code: string;
  declare issued_at: Date;
  declare expires_at: Date | null;
  declare file_url: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserCertificate.init(
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
    certificate_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'certificates', key: 'id' },
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'courses', key: 'id' },
    },
    cert_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'user_certificates',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['cert_code'] },
      { fields: ['course_id'] },
    ],
  }
);
