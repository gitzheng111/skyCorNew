<template>
    <div>
        <el-checkbox-group :model-value="normalizedValue" @change="handleChange">
            <el-checkbox-button v-for="day in days" :label="day" :key="day">
                {{ day }}({{ daysLabelMap[day] }})
            </el-checkbox-button>
        </el-checkbox-group>
    </div>
</template>
<script setup>
import { ref, defineProps, defineEmits,computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    }
});
// console.log('组件接受到的days',props.modelValue)
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
const normalizedValue = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue
  }
  // 如果父组件传过来的是 '1234567'，就拆分成 ['1','2',...]
  return props.modelValue ? props.modelValue.split('') : []
})
const handleChange = (val) => {
    emit('update:modelValue', val);
    console.log('val', val)
};
</script>