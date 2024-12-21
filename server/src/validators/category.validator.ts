import { body } from 'express-validator'

export const authValidator = [
    body('name').isString().withMessage('`name` must be string type'),
    body('description').isString().withMessage('`description` must be string type'),
    body('parent_id').isInt().optional().withMessage('`parent_id` must be int type'),
]