import { Router } from 'express'
import { login } from '../controllers/auth.controller'
import { authValidator } from '../validators/auth.validator'
import { validatorMiddleware } from '../middlewares/validator.middleware'

export default Router()
    .post('/login', authValidator, validatorMiddleware, login)