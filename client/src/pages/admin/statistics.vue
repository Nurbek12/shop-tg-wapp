<template>
    <div class="w-full p-2 space-y-4">

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div v-for="c,i in statistic_cards" :key="i" class="py-2 px-3 bg-white border rounded-xl flex gap-4 items-center justify-between">
                <div class="text-white rounded-lg p-2" :class="c.color">
                    <component :is="c.icon" class="size-6" />
                </div>
                <div class="text-right">
                    <span class="text-sm">{{ c.title }}</span>
                    <h1 class="font-bold">{{ counts[c.value as keyof typeof counts] }}</h1>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1">
            <div class="py-2 px-3 bg-white border rounded-xl flex gap-4">
                <app-chart title="Количество продажы, пользователи, репорты за последние 30 дней" :icon="BxBarChartAlt" :data="data" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { statistic_cards } from '@/constants'
import { IStatistics } from '@/constants/types'
import AppChart from '@/components/app-chart.vue'
import { BxBarChartAlt } from '@kalimahapps/vue-icons'
import { get_statistics_count, get_statistics } from '@/api/statistics'

const data = ref<IStatistics[]>([])
const counts = reactive({
    users_count: 0,
    orders_count: 0,
    reports_count: 0,
    products_count: 0
})

const init = async () => {
    try {
        const [c,s] = await Promise.all([
            get_statistics_count(),
            get_statistics()
        ])

        data.value = s.data.data
        Object.assign(counts, c.data.data)
    } catch (error) {
        console.log(error)
    }
}

init()
</script>