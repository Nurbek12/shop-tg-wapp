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
            <template #table-item-category="{tableItem}">
                <span class="text-xs px-2 py-1 rounded-xl bg-green-500 text-white">{{ tableItem.category?.name }}</span>
            </template>
            <template #table-item-created_at="{tableItem}">
                <span class="text-xs">{{ new Date(tableItem.created_at!).toLocaleString() }}</span>
            </template>
            <template #table-item-actions="{tableItem,index}">
                <div class="flex gap-1">
                    <app-btn @click="editItem(tableItem, index)" >
                        <BxSolidPencil class="w-4 h-4 text-white" />
                    </app-btn>
                    <app-btn @click="deleteItem(tableItem.id!, index)">
                        <MdDelete class="w-4 h-4 text-white" />
                    </app-btn>
                </div>
            </template>
        </app-table>
    </div>
    <app-dialog :title="itemIndex==null?'Добавить продукт':'Изменить продукта'" :max_w="600" v-model="dialog" @close-dialog="close">
        <form @submit.prevent="save" class="mt-4 flex flex-col gap-4">
            <input @change="addImages" type="file" id="files" hidden multiple accept="image/jpg,image/jpeg,image/png,image/bmp">
            
            <app-input required v-model="item.name" type="text" placeholder="Название" />
            <app-input required v-model="item.price" type="number" placeholder="Цена" />
            <app-input required v-model="item.discount" type="number" placeholder="Скидка" />
            <app-input required v-model="item.stock_count" type="number" placeholder="Количество на складе" />
            <app-select required v-model="item.category_id" :items="categories" name="name" value="id" placeholder="Категория" />
            <app-textarea required v-model="item.description" type="text" placeholder="Описание" />
            <app-btn @click="clickToInput()" class="w-min rounded-[0.25rem] px-4 text-white text-sm" type="button">Добавить фотографию</app-btn>

            <app-images v-if="images.length!>0" :is_file="true" :images="images" title="Новые фотографии" @remove_image="removeImage($event[0])" />
            
            <app-images v-if="item.images?.length!>0" :is_file="false" :images="item.images!" title="Фотографии продукта" @remove_image="handle_remove_image($event[0], $event[1])" />

            <!-- <div class="text-center" v-show="imgLoading">Загружается фотографии</div> -->
            <app-btn class="rounded-[0.25rem] text-white text-sm" :disabled="createLoading" type="submit">
                {{ createLoading?'Загружается':'Сохранить' }}
            </app-btn>
        </form>
    </app-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppBtn from '@/components/app-btn.vue'
import { get_categories } from '@/api/categories'
import AppInput from '@/components/app-input.vue'
import AppTable from '@/components/app-table.vue'
import AppDialog from '@/components/app-dialog.vue'
import AppSelect from '@/components/app-select.vue'
import AppImages from '@/components/app-images.vue'
import { IProduct, ICategory } from '@/constants/types'
import AppTextarea from '@/components/app-textarea.vue'
import { MdDelete, BxSolidPencil } from '@kalimahapps/vue-icons'
import { create_product, delete_product, get_products, update_product, add_image, delete_image } from '@/api/products'

const count = ref(0)
const dialog = ref(false)
const loading = ref(false)
const imgLoading = ref(false)
const images = ref<File[]>([])
const items = ref<IProduct[]>([])
const categories = ref<ICategory[]>([])
const itemIndex = ref<number|null>(null)
const createLoading = ref<boolean>(false)

const headers = [
    { name: "ID", value: "id", sortable: true, balancedText: false, custom: false },
    { name: "Название", value: "name", sortable: true, balancedText: false, custom: false },
    { name: "Цена", value: "price", sortable: true, balancedText: false, custom: false },
    { name: "Скидка", value: "discount", sortable: false, balancedText: false, custom: false },
    { name: "Количество на складе", value: "stock_count", sortable: true, balancedText: false, custom: false },
    { name: "Количество продаж", value: "sold", sortable: true, balancedText: false, custom: false },
    { name: "Бал", value: "rate", sortable: true, balancedText: false, custom: false },
    { name: "Категория", value: "category", sortable: false, balancedText: false, custom: true },
    { name: "Добавлено", value: "created_at", sortable: false, balancedText: false, custom: true },
    { name: "Управлять", value: "actions", sortable: false, balancedText: false, custom: true },
]

const item = ref<Partial<IProduct>>({
    name: "",
    price: null,
    discount: null,
    description: "",
    stock_count: null,
    category_id: undefined,
})

const clickToInput = () => {
    document.getElementById('files')?.click()
}

const addImages = (e: any) => {
    if(!e.target?.files) return
    for(let i=0; i<e.target.files.length; i++) {
        images.value.push(e.target.files[i])
    }
}

const removeImage = (index: number) => {
    images.value.splice(index, 1)
    if(images.value.length === 0) images.value = []
}

const editItem = (el: Partial<IProduct>, index: number) => {
    Object.assign(item, el)
    itemIndex.value = index
    dialog.value = true
}

const deleteItem = async (id: number, index: number) => {
    if(!confirm('Вы хотите удалить это?')) return
    await delete_product(id)
    items.value.splice(index, 1)
}

const handle_remove_image = async (id: number, index: number) => {
    if(!confirm('Вы хотите удалить это фото?')) return
    await delete_image(id)
    items.value[itemIndex.value!].images.splice(index, 1)
}

const handle_add_image = async (id: number) => {
    try {
        imgLoading.value = true
        const formdata = new FormData()
        images.value.map(img => formdata.append('image', img))
        const { data } = await add_image(id, formdata)
        const index = items.value.findIndex(p => p.id === id)
        items.value[index].images = [...items.value[index].images||[], ...data.data]
    } catch (error) {
        console.log(error)
    } finally {
        imgLoading.value = false
    }
}

const add = async (body: any) => {
    const { data } = await create_product(body)
    items.value.push(data.data)
    return data.data
}

const update = async (index: number, body: any) => {
    const { id, images, created_at, updated_at, category, reviews, ...other } = body
    const { data } = await update_product(id, other)
    Object.assign(items.value[index], data.data)
    return data.data
}

const save = async () => {
    try {
        if(item.value.category) delete item.value.category
        createLoading.value = true
        let res_product

        if(itemIndex.value !== null)
            res_product = await update(itemIndex.value, item.value)
        else
            res_product = await add(item.value)

        images.value.length > 0 &&
            handle_add_image(res_product.id)

        close()
    } catch (error: any) {
        // appStore.push_alert(error?.response?.data?.message||'', 'warning')
    } finally {
        createLoading.value = false
    }
}

const get_items = async (params: any) => {
    try {
        loading.value = true
        const { data } = await get_products(params)
        items.value = data.data
        count.value = data.count
    } catch (error) {
        console.log(error)
    } finally {
        loading.value = false
    }

}

const init = async () => {
    try {
        const { data } = await get_categories({page:1, limit: 10000})
        categories.value = data.data
    } catch (error) {
        console.log(error)
    }
}

const close = () => {
    item.value = Object.assign({}, {
        name: "",
        price: null,
        discount: null,
        description: "",
        stock_count: null,
        category_id: undefined,
    })
    images.value = []
    dialog.value = false
    itemIndex.value = null
}

init()
</script>