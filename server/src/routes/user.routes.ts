import { Router, type Response } from 'express'
import mongoose from 'mongoose'

import { UserModel, type UserRecord } from '../models/user.model.js'

const router = Router()

/** Escape regex syntax so a search such as "a+b" is treated as text. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Map Mongo's `_id` to the simpler `id` used by the Vue app. */
function toApiUser(user: UserRecord & { _id: unknown }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    dateOfBirth: user.dateOfBirth,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

/** Convert Mongoose validation failures into field errors the form can display. */
function sendMongooseError(response: Response, error: unknown): void {
  if (error instanceof mongoose.Error.ValidationError) {
    const fieldErrors = Object.fromEntries(
      Object.entries(error.errors).map(([field, validationError]) => [
        field,
        validationError.message,
      ]),
    )

    response.status(400).json({
      message: 'Please correct the highlighted fields.',
      fieldErrors,
    })
    return
  }

  // MongoDB duplicate-key errors expose code 11000. We keep this small check
  // here rather than adding a full backend error framework to a Vue project.
  if (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 11000
  ) {
    response.status(409).json({
      message: 'A user with this email already exists.',
      fieldErrors: {
        email: 'A user with this email already exists.',
      },
    })
    return
  }

  console.error(error)
  response.status(500).json({ message: 'Unexpected server error.' })
}

/** GET /api/users?search=alex */
router.get('/', async (request, response) => {
  try {
    const search = typeof request.query.search === 'string'
      ? request.query.search.trim()
      : ''

    const filter = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: 'i' } },
            { email: { $regex: escapeRegex(search), $options: 'i' } },
          ],
        }
      : {}

    // `.lean()` returns plain objects because this route only needs to read and
    // serialize data; Mongoose document instance methods are unnecessary here.
    const users = await UserModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    response.json(users.map(toApiUser))
  } catch (error: unknown) {
    sendMongooseError(response, error)
  }
})

/** POST /api/users */
router.post('/', async (request, response) => {
  try {
    const createdUser = await UserModel.create(request.body)
    response.status(201).json(toApiUser(createdUser.toObject()))
  } catch (error: unknown) {
    sendMongooseError(response, error)
  }
})

/** PUT /api/users/:id */
router.put('/:id', async (request, response) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      request.params.id,
      request.body,
      {
        new: true,
        runValidators: true,
      },
    ).lean()

    if (!updatedUser) {
      response.status(404).json({ message: 'User not found.' })
      return
    }

    response.json(toApiUser(updatedUser))
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.CastError) {
      response.status(400).json({ message: 'Invalid user id.' })
      return
    }

    sendMongooseError(response, error)
  }
})

/** DELETE /api/users/:id */
router.delete('/:id', async (request, response) => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(request.params.id)

    if (!deletedUser) {
      response.status(404).json({ message: 'User not found.' })
      return
    }

    response.status(204).send()
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.CastError) {
      response.status(400).json({ message: 'Invalid user id.' })
      return
    }

    sendMongooseError(response, error)
  }
})

export default router
