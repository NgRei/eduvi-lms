import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Submission extends Model {
  declare id: string;
  declare assignment_id: string;
  declare user_id: string;
  declare attempt_number: number;
  declare answers: any;
  declare score: number | null;
  declare status: 'in_progress' | 'submitted' | 'graded';
  declare feedback: string | null;
  declare graded_by: string | null;
  declare graded_at: Date | null;
  declare submitted_at: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Submission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'assignments', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    attempt_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'submitted', 'graded'),
      allowNull: false,
      defaultValue: 'submitted',
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    graded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: { model: 'users', key: 'id' },
    },
    graded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'submissions',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['assignment_id', 'user_id', 'attempt_number'],
        name: 'uk_assignment_user_attempt',
      },
      { fields: ['assignment_id'], name: 'idx_submission_assignment' },
      { fields: ['user_id'], name: 'idx_submission_user' },
    ],
  }
);
