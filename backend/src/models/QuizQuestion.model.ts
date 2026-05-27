import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class QuizQuestion extends Model {
  declare id: string;
  declare assignment_id: string;
  declare question_text: string;
  declare question_type: 'single' | 'multiple' | 'true_false';
  declare options: any;
  declare explanation: string | null;
  declare points: number;
  declare sort_order: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

QuizQuestion.init(
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
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    question_type: {
      type: DataTypes.ENUM('single', 'multiple', 'true_false'),
      allowNull: false,
      defaultValue: 'single',
    },
    options: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'quiz_questions',
    underscored: true,
  }
);
