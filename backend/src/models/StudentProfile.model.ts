import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class StudentProfile extends Model {
  declare id: string;
  declare user_id: string;
  declare grade_level?: string;
  declare school_name?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StudentProfile.init(
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
    grade_level: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    school_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'student_profiles',
    underscored: true,
  }
);
