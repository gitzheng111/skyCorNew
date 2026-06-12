<template>
    <el-dialog v-model="visible" width="80%" style="max-height:600px;overflow-y:auto">
        <h2>确认申请任务</h2>

        <el-button type="primary" @click="emit('create-task', selectedFlights)">
            创建任务
        </el-button>

        <el-checkbox :model-value="props.selectAll" @update:model-value="emit('select-all', $event)">
            全选
        </el-checkbox>

        <el-row v-for="flight in flights" :key="getFlightKey(flight)" :gutter="16">
            <el-col :span="24">

                <flightCard :data="flight" :selected-flights="selectedFlights" :selected-routes="selectedRoutes"
                    @flight-change="emit('flight-select', $event)"
                    @route-change="emit('route-select', $event)" />

            </el-col>
        </el-row>

    </el-dialog>
</template>

<script setup>

import flightCard from '@/utils/flightCard.vue'
import { getFlightKey } from '../utils/getFlightKey'
const visible = defineModel('visible')

const props = defineProps({
    flights: {
        type: Array,
        default: () => []
    },

    selectedFlights: {
        type: Array,
        default: () => []
    },

    selectedRoutes: {
        type: Object,
        default: () => ({})
    },

    selectAll: {
        type: Boolean,
        default: false
    },

    // getOverflyCountryNames: Function
})


const emit = defineEmits([
    'select-all',
    'flight-select',
    'route-select',
    'create-task'
])

const handleSelectAll = (val) => {
    emit('select-all', val)
}


</script>