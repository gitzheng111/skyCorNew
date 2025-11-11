<template>
    <el-dialog v-model="windowVisible">


    </el-dialog>
</template>
<script setup>
import { ref, watch, onMounted, computed, toRaw } from 'vue'

const props = defineProps({
    visible: Boolean,
    evalueData: Array,
})
const windowVisible = ref()
const evalueData = ref()
const newData = ref()

watch(() => props.visible, val => (windowVisible.value = val))

watch(() => props.evalueData, 
(val) => {
    
    evalueData.value = val
    newData.value = val
console.log('evalueData',evalueData)
})

</script>