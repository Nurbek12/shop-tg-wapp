export interface IUser {
    id: number
    
    first_name: string
    last_name: string
    user_id: number
    address: string
    phone: string
    geolocation?: string
    latitude: number
    longitude: number

    count_of_orders?: number
  
    orders:  IOrder[]
    reviews: IReview[]
  
    created_at: string
    updated_at: string
}

export interface IProduct {
    id: number

    name: string
    description: string
    price: number | null
    discount: number | null
    stock_count: number | null
    quantity: number | null
    rate: number | null
    sold: number | null
  
    category_id: number | null
    category: ICategory
  
    images:    IImage[]
    reviews:   IReview[]
    order_items: IOrderItem[]
  
    created_at: string
    updated_at: string
}

export interface ICategory {
    id: number

    name: string
    image: string
    description: string
  
    parent: ICategory
    parent_id: number | null
    childrens: ICategory[]
    products: IProduct[]
  
    created_at: string
    updated_at: string
}

export interface IImage {
    id: number

    name: string
    url: string
    size: number
    product_id: number

    product: IProduct
  
    created_at: string
    updated_at: string
}

export interface IOrder {
    id: number

    status: "pending" | "finish" | "canceled"
    total: number
    address?: string
    user_id: number | null
    user_tg_id: string | null
    user: IUser
    order_items: IOrderItem[]
    is_reported: boolean
    
    latitude: number
    longitude: number
  
    created_at: string
    updated_at: string
}

export interface IOrderItem {
    id: number

    order_id: number
    order: IOrder
    quantity: number
  
    product_id: number
    product: IProduct
  
    created_at: string
    updated_at: string
}

export interface IReview {
    id: number

    rate: number
    text: string
  
    user_id: number
    user: IUser
  
    product_id: number
    product: IProduct
  
    created_at: string
    updated_at: string
}

export interface IReport {
    id: number
  
    text: string
    status: "pending" | "in progress" | "resolved"

    order_id: number
    order: IOrder
  
    user_id: number
    user: IUser
  
    created_at: string
    updated_at: string
}

export interface IStatistics {
    id: number
  
    date: string

    day: number
    year: number
    month: number
  
    users: number
    amount: number
    orders: number
    reports: number
  
    created_at: string
    updated_at: string
}