import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Payment extends Model {
  declare id: string;
  declare txn_ref: string;
  declare user_id: string;
  declare course_id: string;
  declare amount: number;
  declare payment_method: string;
  declare status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  declare qr_code_url: string | null;
  declare bank_id: string;
  declare account_no: string;
  declare account_name: string;
  declare paid_at: Date | null;
  declare expires_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    txn_ref: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'courses', key: 'id' },
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'VIETQR',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    qr_code_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bank_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'ACB',
    },
    account_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '15781537',
    },
    account_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Cao Trong Nguyen',
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    underscored: true,
    indexes: [
      { unique: true, fields: ['txn_ref'] },
      { fields: ['user_id'] },
      { fields: ['course_id'] },
      { fields: ['status'] },
    ],
  }
);
