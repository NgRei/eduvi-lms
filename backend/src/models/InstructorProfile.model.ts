import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class InstructorProfile extends Model {
  declare id: string;
  declare user_id: string;
  declare expertise?: string;
  declare experience_years?: number;
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
  },
  {
    sequelize,
    tableName: 'instructor_profiles',
    underscored: true,
  }
);
