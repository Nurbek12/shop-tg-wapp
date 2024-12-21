import { prisma } from '../config/prisma'
import { Request, Response } from 'express'

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const where: any = {}
        const orderBy: any = req.query.sorting || {}
        const category: any = req.query.category || null
        const page = Number(req.query?.page) || 1
        const limit = Number(req.query?.limit) || 20
        const min_price = Number(req.query?.min_price) || null
        const max_price = Number(req.query?.max_price) || null
        const search = req.query.search || ''

        if(search) Object.assign(where, {
            name: {
                contains: search,
                mode: "insensitive"
            },
        })
        if(category!==null) Object.assign(where, {
            category_id: {
                in: [+category]
            }
        })
        if (min_price !== null || max_price !== null) {
            where.price = {};
            
            if (min_price !== null)
                Object.assign(where.price, { gte: min_price });
            
            if (max_price !== null)
                Object.assign(where.price, { lte: max_price });
        }
        const [count,products] = await Promise.all([
            prisma.product.count({where}),
            prisma.product.findMany({
                where,
                orderBy,
                skip: (page-1)*limit,
                take: limit,
                include: {
                    images: {
                        select: {
                            id: true,
                            url: true,
                            size: true,
                            name: true,
                        }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            parent_id: true,
                        }
                    },
                    reviews: {
                        select: {
                            id: true
                        }
                    }
                }
            })
        ])

        return res.status(200).json({ data: products, count })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const getProduct = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findFirst({
                where: { id: +req.params.id },
                include: {
                    images: {
                        select: {
                            id: true,
                            url: true,
                            size: true,
                            name: true,
                        }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            parent_id: true,
                        }
                    },
                    reviews: {
                        select: {
                            id: true,
                            rate: true,
                            text: true,
                            created_at: true,
                            user: {
                                select: {
                                    first_name: true,
                                    last_name: true,
                                }
                            }
                        }
                    }
                }
            })

        return res.status(200).json({ data: product })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const createProduct =  async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.create({ data: req.body, include: { category: { select: { name: true, id: true } } } })

        return res.status(200).json({ data: product })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const addPhotoToProduct =  async (req: Request, res: Response) => {
    try {
        const images = await Promise.all((req.body.images).map((file: any) => {
            // console.log('before_creating', file.name)
            return prisma.image.create({
                data: {
                    url: file.url,
                    size: file.size,
                    name: file.name,
                    product_id: +req.params.id,
                }
            })
        }))
        // console.log('after_creating', images)
        return res.status(200).json({ data: images })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const removePhoto =  async (req: Request, res: Response) => {
    try {
        await prisma.image.delete({ where: { id: +req.params.id } })

        return res.status(200).json({ data: true })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const updateProduct =  async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.update({ where: { id: +req.params.id }, data: req.body })

        return res.status(200).json({ data: product })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        await prisma.image.deleteMany({ where: { product_id: +req.params.id } })
        await prisma.review.deleteMany({ where: { product_id: +req.params.id } })
        await prisma.orderItem.deleteMany({ where: { product_id: +req.params.id } })
        
        await prisma.product.delete({ where: { id: +req.params.id } })

        return res.status(200).json({ data: true })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 'error', message: 'Interlan server error.' })
    }
}