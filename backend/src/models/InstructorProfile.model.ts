import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class InstructorProfile extends Model {
  declare id: string;
  declare user_id: string;
  declare expertise: string | null;
  declare experience_years: number;
  declare degree: string | null;
  declare linkedin_url: string | null;
  declare total_students: number;
  declare rating_avg: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InstructorProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    expertise: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    experience_years: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    degree: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    total_students: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rating_avg: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
    },
  },
  {
    sequelize,
    tableName: 'instructor_profiles',
    underscored: true,
  }
);
