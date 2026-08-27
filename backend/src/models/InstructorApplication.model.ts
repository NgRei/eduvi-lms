import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class InstructorApplication extends Model {
  declare id: string;
  declare user_id: string;
  declare headline: string;
  declare bio: string;
  declare expertise: string;
  declare experience_years: number;
  declare education_degree: string | null;
  declare phone_number: string | null;
  declare linkedin_url: string | null;
  declare portfolio_url: string | null;
  declare cv_url: string | null;
  declare intro_video_url: string | null;
  declare teaching_reason: string | null;
  declare course_proposal: string | null;
  declare status: 'pending' | 'approved' | 'rejected' | 'need_info';
  declare rejection_reason: string | null;
  declare admin_notes: string | null;
  declare reviewed_by: string | null;
  declare reviewed_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InstructorApplication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    headline: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expertise: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    education_degree: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    portfolio_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cv_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    intro_video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    teaching_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    course_proposal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'need_info'),
      allowNull: false,
      defaultValue: 'pending',
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'instructor_applications',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
    ],
  }
);
