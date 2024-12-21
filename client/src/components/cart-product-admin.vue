<template>
    <div class="flex items-center gap-2">
        <div>
            <div class="rounded-xl overflow-hidden relative h-[55px] w-[55px]">
                <img :src="product.images[0].url" class="w-full h-full object-cover" alt="">
            </div>
        </div>

        <div class="w-full">
            
            <div class="flex items-start justify-between">
                <router-link :to="`/product/${product.id}`">{{ product.name }}</router-link>

                <div class="flex gap-2 items-center">
                    
                    <app-btn type="button" @click="emits('add_to_cart', product)" class="text-white">
                        <AkPlus class="size-3" />
                    </app-btn>
                    <app-btn type="button" @click="emits('remove_from_cart', product)" :disabled="!cart.find(p => p.id === product.id)?.quantity" class="text-white">
                        <AkMinus class="size-3" />
                    </app-btn>
    
                </div>

            </div>

            <div class="flex items-center gap-1">
                <span class="text-sm">{{ cart.find(p => p.id === product.id)?.quantity || 0 }} x {{ (product.price! - (product.price! * product.discount!/100))?.toLocaleString('en-EN') }} =</span>
                <b class="text-primary-500">{{ ((cart.find(p => p.id === product.id)?.quantity||0) * (product.price! - (product.price! * product.discount!/100)))?.toLocaleString('en-EN') }} сум</b>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import AppBtn from './app-btn.vue'
import { IProduct } from '../constants/types'
import { AkPlus, AkMinus } from '@kalimahapps/vue-icons'

const emits = defineEmits(['add_to_cart', 'remove_from_cart'])
defineProps<{
    product: IProduct,
    cart: IProduct[]
}>()
</script>