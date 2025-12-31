<template>
    <!-- <el-time-picker v-if="mode === 'picker'" v-model="innerValue" format="HH:mm" value-format="HH:mm"
        placeholder="时间" /> -->

    <div class="time-input-group">
        <el-input ref="hourRef" v-model="hour" placeholder="HH" maxlength="2" style="width: 48px" @input="onHourInput"
            @blur="formatHour" />
        <span class="sep">:</span>
        <el-input ref="minuteRef" v-model="minute" placeholder="MM" maxlength="2" style="width: 48px"
            @input="onMinuteInput" @blur="formatMinute" />
    </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
    modelValue: String,
    mode: { type: String, default: 'split' }
})
const emit = defineEmits(['update:modelValue'])

const innerValue = ref(props.modelValue)

const hour = ref('')
const minute = ref('')
const hourRef = ref()
const minuteRef = ref()

/* 回填 */
watch(
    () => props.modelValue,
    (val) => {
        innerValue.value = val
        if (val && props.mode === 'split') {
            const [h, m] = val.split(':')
            hour.value = h
            minute.value = m
        }
    },
    { immediate: true }
)

const merge = () => {
    if (hour.value.length === 2 && minute.value.length === 2) {
        emit('update:modelValue', `${hour.value}:${minute.value}`)
    } else {
        emit('update:modelValue', '')
    }
}

const onHourInput = () => {
    hour.value = hour.value.replace(/\D/g, '').slice(0, 2)
    if (hour.value.length === 2) {
        nextTick(() => minuteRef.value?.focus())
    }
    merge()
}

const onMinuteInput = () => {
    minute.value = minute.value.replace(/\D/g, '').slice(0, 2)
    merge()
}

const formatHour = () => {
    if (hour.value !== '') {
        let h = Math.min(Number(hour.value), 23)
        hour.value = String(h).padStart(2, '0')
    }
    merge()
}

const formatMinute = () => {
    if (minute.value !== '') {
        let m = Math.min(Number(minute.value), 59)
        minute.value = String(m).padStart(2, '0')
    }
    merge()
}

/* picker 模式同步 */
watch(innerValue, val => emit('update:modelValue', val))


</script>

<style scoped>
.time-input-group {
    display: flex;
    align-items: center;
}

.sep {
    margin: 0 4px;
}
</style>