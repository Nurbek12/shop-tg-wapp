import { prisma } from '../config/prisma'
import { Request, Response } from 'express'

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const where: any = {}
        const orderBy: any = req.query.sorting || {}
        const page = Number(req.query?.page) || 1
        const limit = Number(req.query?.limit) || 20
        const search = req.query.search || ''

        if(search) Object.assign(where, {
            first_name: {
                contains: search
            },
            last_name: {
                contains: search
            },
            phone: {
                contains: search
            },
        })

        const [count,users] = await Promise.all([
            prisma.user.count({where}),
            prisma.user.findMany({
                where,
                orderBy,
                skip: (page-1)*limit,
                take: limit,
                // select:{
                //     count_of_orders: true,
                //     created_at: true,
                //     first_name: true,
                //     id: true,
                //     last_name: true,
                // }
            })
        ])

        return res.status(200).json({ data: users, count })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const getMe = async (req: Request, res: Response) => {
    try {const user = await prisma.user.findFirst({
            where: { user_tg_id: ''+req.params.id },
        })
        return res.status(200).json({ data: user })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const createUser =  async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.create({ data: req.body })

        return res.status(200).json({ data: user })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const updateUser =  async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.update({
            where: { id: +req.params.id },
            data: req.body,
            // select:{
            //     count_of_orders: true,
            //     created_at: true,
            //     first_name: true,
            //     id: true,
            //     last_name: true,
            // }
        })

        return res.status(200).json({ data: user })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        await prisma.user.delete({ where: { id: +req.params.id } })

        return res.status(200).json({ data: true })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}