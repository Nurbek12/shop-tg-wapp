<template>
    <div class="w-full border rounded-xl overflow-hidden">
        <select :disabled="!!props.disabled" :required="required" v-model="model" @change="emits('changed', $event)" class="text-sm py-2 px-3 w-full outline-none cursor-pointer">
            <option :value="nullvalue" disabled selected v-if="props.placeholder">{{ props.placeholder }}</option>
            <option class="appearance-none" v-for="item,i in items" :key="i" :value="item[value||'value']">
                <slot name="name" v-if="$slots['name']" :item="item" />
                <span v-else>{{ item[name||'name'] }}</span>
            </option>
        </select>
    </div>
</template>

<script setup lang="ts">
import { toRefs, defineProps, defineEmits, defineModel } from 'vue'

interface Props {
    items: any[],
    name?: string,
    value?: string,
    placeholder?: string,
    required?: boolean,
    nullvalue?: '' | undefined | null,
    disabled?: boolean
}

const model = defineModel()
const emits = defineEmits(['changed'])
const props = defineProps<Props>()
const { items } = toRefs(props)
</script>