import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class StudentProfile extends Model {
  declare id: string;
  declare user_id: string;
  declare date_of_birth: string | null;
  declare phone: string | null;
  declare address: string | null;
  declare school_name: string | null;
  declare grade_level: string | null;
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
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    school_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    grade_level: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'student_profiles',
    underscored: true,
  }
);
