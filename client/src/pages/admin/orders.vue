<template>
    <div class="w-full p-2">
        <app-table
            :headers="headers"
            :items="items"
            :count="count"
            :loading="loading"
            @fetching="get_items">
            <template #table-top>
                <div class="hidden lg:block"></div>
                <div class="hidden lg:block"></div>
                <app-btn class="rounded-[0.25rem] text-white text-sm" @click="dialog=true">Добавить</app-btn>
            </template>
            <template #table-item-created_at="{tableItem}">
                <span class="text-xs">{{ new Date(tableItem.created_at!).toLocaleString() }}</span>
            </template>
            <template #table-item-user="{tableItem}">
                <span class="text-xs">{{ tableItem.user?.first_name }} {{ tableItem.user?.last_name }}</span>
            </template>
            <template #table-item-status="{tableItem}">
                <span class="text-xs text-primary-500">{{ order_statuses[tableItem.status as keyof typeof order_statuses || 'pending'] }}</span>
            </template>
            <template #table-item-actions="{tableItem,index}">
                <div class="flex gap-1">
                    <app-btn @click="openOrder(tableItem.id!, index)">
                        <AkShoppingBag class="w-4 h-4 text-white" />
                    </app-btn>
                    <app-btn @click="deleteItem(tableItem.id!, index)">
                        <MdDelete class="w-4 h-4 text-white" />
                    </app-btn>
                </div>
            </template>
        </app-table>
    </div>
    <app-dialog title="Детали заказа" :max_w="500" :model-value="view_order!==null" @close-dialog="view_order=null">
        <order hide_report v-if="view_order!==null" :order="items[view_order]" />
    </app-dialog>
    <app-dialog title="Добавить заказ" :max_w="700" v-model="dialog" @close-dialog="close">
        <form @submit.prevent="handle_order" class="mt-4 flex flex-col gap-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <app-select required v-model="order.user_id" :items="users" value="id" placeholder="Клиент">
                    <template #name="{item}">
                        <span>{{ item.first_name }} {{ item.last_name }}, {{ item.phone }}</span>
                    </template>
                </app-select>
                <app-input required v-model="order.address" type="text" placeholder="Адрес" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <cart-product v-for="product in products" :key="product.id" :product="product" :cart="cart" @add_to_cart="add_to_cart" @remove_from_cart="remove_from_cart" />
            </div>
            Общая сумма: {{ (total).toLocaleString('en-EN') }} сум
            <app-btn class="rounded-[0.25rem] text-white text-sm" :disabled="createLoading" type="submit">
                {{ createLoading?'Загружается':'Сохранить' }}
            </app-btn>
        </form>
    </app-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { get_users } from '@/api/users'
import Order from '@/components/order.vue'
import { order_statuses } from '@/constants'
import { get_products } from '@/api/products'
import AppBtn from '@/components/app-btn.vue'
import AppInput from '@/components/app-input.vue'
import AppTable from '@/components/app-table.vue'
import AppDialog from '@/components/app-dialog.vue'
import AppSelect from '@/components/app-select.vue'
import { IOrder, IProduct, IUser } from '@/constants/types'
import CartProduct from '@/components/cart-product-admin.vue'
import { MdDelete, AkShoppingBag } from '@kalimahapps/vue-icons'
import { get_orders, create_order, delete_order } from '@/api/orders'

const count = ref(0)
const dialog = ref(false)
const loading = ref(false)
const users = ref<IUser[]>([])
const items = ref<IOrder[]>([])
const createLoading = ref(false)
const cart = ref<IProduct[]>([])
const products = ref<IProduct[]>([])
const view_order = ref<null|number>(null)

const order = ref<Partial<IOrder>>({
    address: '',
    status: 'pending',
    user_id: undefined,
})

const headers = [
    { name: "ID", value: "id", sortable: true, balancedText: false, custom: false },
    { name: "Имя и Фамилия", value: "user", sortable: false, balancedText: false, custom: true },
    { name: "Статус", value: "status", sortable: true, balancedText: false, custom: true },
    { name: "Добавлено", value: "created_at", sortable: true, balancedText: false, custom: true },
    { name: "Управлять", value: "actions", sortable: false, balancedText: false, custom: true },
]

const deleteItem = async (id: number, index: number) => {
    if(!confirm('Вы хотите удалить это?')) return
    await delete_order(id)
    items.value.splice(index, 1)
}

const openOrder = async (id: number, index: number) => {
    // if(!items.value[index]?.order) {
    //     const { data } = await get_order(id)
    //     items.value[index].order = data.data
    // }
    view_order.value = index
}

const get_items = async (params: any) => {
    try {
        loading.value = true
        const { data } = await get_orders(params)
        items.value = data.data
        count.value = data.count
    } catch (error) {
        console.log(error)
    } finally {
        loading.value = false
    }

}



const handle_order = async () => {
    createLoading.value = true
    const { data } = await create_order({
        ...order.value,
        total: total.value,
        body_order_items: cart.value.map(({id, quantity}) => ({product_id: id, quantity})),
    })
    const { order_items, ...order_data } = data.data
    items.value.unshift(order_data as any)
    createLoading.value = false
    close()
    alert('Успешно создано!')
}

const init = async () => {
    const [U,P] = await Promise.all([get_users({page: 1, limit: 100}),get_products({page: 1, limit: 100})])

    users.value = U.data.data
    products.value = P.data.data
}

const total = computed(() => cart.value.reduce((a, b) => {
    return a + (b.quantity! * (b.price! - (b.price! * b.discount! / 100)))
}, 0))

const add_to_cart = (product: IProduct) => {
    const p_index = cart.value.findIndex(p => p.id === product.id)
    p_index > -1 ? cart.value[p_index].quantity!++ : cart.value.push({...product, quantity: 1}) 
}

const remove_from_cart = (product: IProduct) => {
    const p_index = cart.value.findIndex(p => p.id === product.id)
    if(!cart.value[p_index]?.quantity) cart.value.splice(p_index, 1)

    else if(p_index > -1) {
        cart.value[p_index].quantity > 1 ?
            cart.value[p_index].quantity-- :
            cart.value.splice(p_index, 1)
    }
}

const close = () => {
    order.value = Object.assign({}, {
        address: '',
        status: 'pending',
        user_id: undefined,
    }) as any
    cart.value = []
    dialog.value = false
    // itemIndex.value = null
}

init()
</script>