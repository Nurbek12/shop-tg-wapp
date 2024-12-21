import { body } from 'express-validator'

export const authValidator = [
    body('status').isString().withMessage('`name` must be string type'),
    body('total').isInt({min:0}).withMessage('`total` must be int type'),
    body('user_id').isInt({min:0}).withMessage('`total` must be int type'),
    body('address').isString().optional().withMessage('`address` must be string type'),
    body('latitude').isFloat().optional().withMessage('`latitude` must be string type'),
    body('longitude').isFloat().optional().withMessage('`longitude` must be string type'),
    body('body_order_items').isArray().withMessage('`body_order_items` must be array'),
    body('body_order_items.*.count').isInt({min:0}).withMessage('`body_order_items.count` must be int type'),
    body('body_order_items.*.product_id').isInt({min:0}).withMessage('`body_order_items.product_id` must be int type'),
]