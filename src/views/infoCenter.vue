<template>
    <infoCard/>
</template>
<script setup>
import { ref, watch, onMounted, computed, toRaw } from 'vue'
import {getInfoCenter,addInfoCenter} from '../api.js'
import infoCard from '../components/infoCard.vue'
const infoCenter = ref()
const initData = async()=>{
    const infoCenterResponse = await getInfoCenter()
    infoCenter.value = infoCenterResponse.data
    console.log('infoCenter',infoCenter.value)
}
onMounted(() => {
    initData();
});
</script>
