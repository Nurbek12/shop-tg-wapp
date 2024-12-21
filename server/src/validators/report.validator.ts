import { body } from 'express-validator'

export const authValidator = [
    body('text').isString().withMessage('`name` must be string type'),
    body('status').isString().withMessage('`status` must be string type'),
    body('order_id').isInt({min:0}).withMessage('`order_id` must be int type'),
    body('user_id').isInt({min:0}).withMessage('`user_id` must be int type'),
]