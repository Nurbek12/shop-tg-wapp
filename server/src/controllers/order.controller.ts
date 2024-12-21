import { prisma } from '../config/prisma'
import { Request, Response } from 'express'
import { setStatistics } from './statistic.controller'

interface BodyOrderItems {
    product_id: number
    quantity: number
}

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const where: any = {}
        const orderBy: any = req.query.sorting || {}
        const page = Number(req.query?.page) || 1
        const limit = Number(req.query?.limit) || 20
        const status = req.query.status || ''

        if(status) where.status = status

        const [count,orders] = await Promise.all([
            prisma.order.count({where}),
            prisma.order.findMany({
                where,
                orderBy,
                skip: (page-1)*limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            phone: true,
                            first_name: true,
                            last_name: true,
                        }
                    }
                }
            })
        ])

        return res.status(200).json({ data: orders, count })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const getOrdersForDeliver = async (req: Request, res: Response) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: { created_at: { gte: startOfDay, lte: endOfDay, } },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        address: true,
                        geolocation: true,
                        phone: true,
                    }
                }
            }
        })

        return res.status(200).json({ data: orders })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const where: any = { user_id: +req.params.id }
        const orderBy: any = req.query.sorting || { created_at: 'desc' }
        const page = Number(req.query?.page) || 1
        const limit = Number(req.query?.limit) || 20
        const status = req.query?.status || ''

        if(status) where.status = status

        const [count,orders] = await Promise.all([
            prisma.order.count({where}),
            prisma.order.findMany({
                where,
                orderBy,
                skip: (page-1)*limit,
                take: limit
            })
        ])

        return res.status(200).json({ data: orders, count })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const getOrder =  async (req: Request, res: Response) => {
    try {
        const order = await prisma.order.findFirst({
            where: { id: +req.params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        phone: true,
                        address: true,
                        last_name: true,
                        first_name: true,
                    }
                },
                order_items: {
                    select: {
                        id: true,
                        quantity: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                discount: true,
                                category_id: true,
                                images: {
                                    select: {
                                        url: true
                                    },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        })
        return res.status(200).json({ data: order })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const createOrder =  async (req: Request, res: Response) => {
    try {
        const order_items: any[] = [] 
        const { body_order_items, ...order_data } = req.body
        const order = await prisma.order.create({ data: order_data, include: { user: { select: { id: true, first_name: true, last_name: true, phone: true } } } })

        await prisma.user.update({ where: { id: order.user_id }, data: { count_of_orders: { increment: 1 } } })

        await Promise.all((body_order_items as BodyOrderItems[]).map(async oi => {
            await prisma.product.update({ where: { id: oi.product_id }, data: { sold: { increment: 1 }, stock_count: { decrement: oi.quantity } } })
            const new_order_item = await prisma.orderItem.create({
                data: {
                    quantity: oi.quantity,
                    order_id: order.id,
                    product_id: oi.product_id,
                }
            })
            order_items.push(new_order_item)
        }))
        setStatistics('orders', 1)
        return res.status(200).json({ data: {...order, order_items} })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const updateStatusOrder =  async (req: Request, res: Response) => {
    try {
        const order = await prisma.order.update({ 
            where: { id: +req.params.id }, 
            data: { status: req.body.status },
        })

        if(order.status === 'finish') setStatistics('amount', order.total)

        return res.status(200).json({ data: true })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const deleteOrder = async (req: Request, res: Response) => {
    try {
        await prisma.orderItem.deleteMany({ where: { order_id: +req.params.id } })
        await prisma.order.delete({ where: { id: +req.params.id } })

        return res.status(200).json({ data: true })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}