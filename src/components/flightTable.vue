<template>
    <div class="flight-list">

        <FlightCard
            v-for="flight in data"
            :key="flight.flight_id"
            :flight="flight"
            :selected="selectedIds.includes(flight.flight_id)"
            :time-mode="timeMode"
            :format-time="formatTime"
            @select="handleSelect"
            @detail="emit('row-click', $event)"
            @edit="emit('edit', $event)"
        />

    </div>
</template>

<script setup>
import { ref } from 'vue'
import FlightCard from './flightCardView.vue'

const props = defineProps({
    data: {
        type: Array,
        default: () => []
    },
    timeMode: {
        type: String,
        default: 'PKT'
    },
    formatTime: {
        type: Function,
        required: true
    }
})

const emit = defineEmits([
    'selection-change',
    'row-click',
    'edit'
])

const selectedIds = ref([])

const handleSelect = flight => {

    const index =
        selectedIds.value.indexOf(
            flight.flight_id
        )

    if (index > -1) {

        selectedIds.value.splice(
            index,
            1
        )

    } else {

        selectedIds.value.push(
            flight.flight_id
        )
    }

    emit(
        'selection-change',
        props.data.filter(
            item =>
                selectedIds.value.includes(
                    item.flight_id
                )
        )
    )
}
</script>

<style scoped>
.flight-list {

    display: flex;

    flex-direction: column;

    gap: 18px;

    padding: 12px;
}
</style>