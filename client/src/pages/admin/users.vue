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
            </template>
            <template #table-item-created_at="{tableItem}">
                <span class="text-xs">{{ new Date(tableItem.created_at!).toLocaleString() }}</span>
            </template>
            <template #table-item-actions="{tableItem,index}">
                <div class="flex gap-1">
                    <app-btn @click="deleteItem(tableItem.id!, index)">
                        <MdDelete class="w-4 h-4 text-white" />
                    </app-btn>
                </div>
            </template>
        </app-table>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IUser } from '@/constants/types'
import AppBtn from '@/components/app-btn.vue'
import AppTable from '@/components/app-table.vue'
import { MdDelete } from '@kalimahapps/vue-icons'
import { get_users, delete_user } from '@/api/users'

const count = ref(0)
const loading = ref(false)
const items = ref<IUser[]>([])

const headers = [
    { name: "ID", value: "id", sortable: true, balancedText: false, custom: false },
    { name: "Имя", value: "first_name", sortable: true, balancedText: false, custom: false },
    { name: "Фамилия", value: "last_name", sortable: true, balancedText: true, custom: false },
    { name: "Телефон", value: "phone", sortable: false, balancedText: false, custom: false },
    { name: "Адрес", value: "address", sortable: false, balancedText: false, custom: false },
    { name: "Количество заказов", value: "count_of_orders", sortable: true, balancedText: false, custom: false },
    { name: "Добавлено", value: "created_at", sortable: true, balancedText: false, custom: true },
    { name: "Управлять", value: "actions", sortable: false, balancedText: false, custom: true },
]

const deleteItem = async (id: number, index: number) => {
    if(!confirm('Вы хотите удалить это?')) return
    await delete_user(id)
    items.value.splice(index, 1)
}

const get_items = async (params: any) => {
    try {
        loading.value = true
        const { data } = await get_users(params)
        items.value = data.data
        count.value = data.count
    } catch (error) {
        console.log(error)
    } finally {
        loading.value = false
    }

}
</script>