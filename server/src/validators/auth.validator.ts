import { body } from 'express-validator'

export const authValidator = [
    body('login').isString().withMessage('`login` must be string type'),
    body('password').isString().withMessage('`password` must be string type')
]