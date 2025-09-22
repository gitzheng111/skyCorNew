<template #default="{ row }">

    <div class="days-container">
        <el-tag v-for="(day, index) in daysOfWeek" :key="index" :class="{
            'day-tag': true,
            'normal-tag': isDayInSchedule(index + 1),
            'disabled-tag': !isDayInSchedule(index + 1),
            'today-tag': isToday(index + 1)
        }" :style="isToday(index + 1) ? { border: '1px solid orange' } : {}">
            {{ day }}
        </el-tag>

    </div>

</template>
<script setup>
import { ref, watch, nextTick } from 'vue'
const props = defineProps({
    days: {
        type: [Array, String],
        default: () => []   // 默认空数组
    }
})
const days = ref()

watch(
    () => props.days,
    (val) => {
        // console.log('输入的 days:', val)
        days.value = Array.isArray(val)
            ? val.map(String)   // 数组 → ['1','2']
            : String(val).split('')
        // console.log('处理后的 days.value:', days.value)
    },
    { immediate: true } // 页面加载时立即执行一次
)
const daysOfWeek = ['1', '2', '3', '4', '5', '6', '7']

const today = new Date();
const isDayInSchedule = (dayNumber) => {
    // console.log('需判断的days',days.value,'dayNumber',dayNumber)
  return days.value?.includes(dayNumber.toString())
}
const isToday = (dayNumber) => {
    const today = new Date();
    const todayDay = today.getDay(); // 0 - 6 (Sun - Sat)
    // 星期天是0，所以需要进行转换：让星期一为1，星期天为7
    const dayIndex = todayDay === 0 ? 7 : todayDay;
    return dayNumber === dayIndex;
}
const isTodayWithSchedule = (dayNumber) => {
    const today = new Date();
    const todayDay = today.getDay(); // 0 - 6 (Sun - Sat)
    const dayIndex = todayDay === 0 ? 7 : todayDay;
    return dayNumber.value.includes(dayIndex.toString());
}


</script>
<style lang="scss">
.day-tag {
    margin: 3px;
    font-size: 14px;
}

.normal-tag {
    background-color: #409eff;
    color: white;
}

.disabled-tag {
    background-color: #dcdfe6;
    color: #909399;
}
</style>