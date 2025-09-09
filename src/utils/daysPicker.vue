<template>
    <div>
        <el-checkbox-group :model-value="modelValue" @change="handleChange">
            <el-checkbox-button v-for="day in days" :label="day" :key="day">
                {{ day }} ( {{ daysLabelMap[day] }} )
            </el-checkbox-button>
        </el-checkbox-group>
    </div>
</template>
<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    }
});
const emit = defineEmits(['update:modelValue']);

// const checkboxGroup1 = ref(['Shanghai'])
const days = ['1', '2', '3', '4', '5', '6', '7']
const daysLabelMap = {
    '1': 'Mon',
    '2': 'Tue',
    '3': 'Wen',
    '4': 'Tur',
    '5': 'Fri',
    '6': 'Sat',
    '7': 'Sun'
}

const handleChange = (val) => {
    emit('update:modelValue', val);
    console.log('val', val)
};
</script>