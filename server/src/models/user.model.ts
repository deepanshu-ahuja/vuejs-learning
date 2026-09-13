import { model, Schema } from 'mongoose'

export type UserRole = 'admin' | 'developer' | 'viewer'
export type UserStatus = 'active' | 'inactive'

/** Shape stored in MongoDB. */
export interface UserRecord {
  name: string
  email: string
  role: UserRole
  status: UserStatus
  dateOfBirth: string
  bio: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserRecord>(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.'],
    },
    role: {
      type: String,
      enum: ['admin', 'developer', 'viewer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      required: true,
    },
    // Keep YYYY-MM-DD as a string here so the backend does not distract from
    // the Vue form lesson with timezone/date-conversion concerns.
    dateOfBirth: {
      type: String,
      required: [true, 'Date of birth is required.'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must use YYYY-MM-DD.'],
      validate: [
        {
          // Date parsing can normalize February 31 into March. Round-trip the
          // UTC date to reject normalization, invalid months, and invalid days.
          validator: (value: string) => {
            const date = new Date(`${value}T00:00:00.000Z`)
            return Number.isFinite(date.getTime())
              && date.toISOString().slice(0, 10) === value
          },
          message: 'Date of birth must be a valid calendar date.',
        },
        {
          validator: (value: string) => value <= new Date().toISOString().slice(0, 10),
          message: 'Date of birth cannot be in the future.',
        },
      ],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio cannot exceed 300 characters.'],
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

export const UserModel = model<UserRecord>('User', userSchema)
