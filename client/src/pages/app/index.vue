<template>
    <div class="relative w-full h-full bg-white">
        <router-view />
        <bottom-nav />
    </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store'
import { useWebApp } from 'vue-tg'
import { get_me } from '@/api/users'
import { useRouter } from 'vue-router'
import BottomNav from '@/components/bottom-nav.vue'
import { onBeforeMount, onBeforeUnmount } from 'vue'

const store = useStore()
const router = useRouter()
const webApp = useWebApp()

const init = async () => {
    const userid = webApp?.initDataUnsafe?.user?.id
    if(userid === store.get_user?.id) return
    const { data } = await get_me(userid!)
    if(data.data === null) return webApp.close()
    store.set_user(data.data)
    router.push('/')
}

onBeforeMount(() => {
    webApp.ready()
    init()
})

onBeforeUnmount(() => {
    webApp.close()
})
</script>