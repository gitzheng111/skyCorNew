<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 修复1：必须导入 useRoute
import { getInfoCenter, addInfoCenter, deleteInfoByIds } from '../api.js'

import {
  Check,
  Delete,
  Edit,
  HelpFilled,
  Message,
  Notification,
  Search,
  Star,
} from '@element-plus/icons-vue'
// import { useRouter } from 'vue-router'
// const router = useRouter()

// import mammoth from 'mammoth'; nnp
const router = useRouter();
const route = useRoute(); // 修复2：获取当前路由对象
const activeIndex = ref('1');
// const unreadCount = ref(0)
const infoData = ref([])

const loadUnreadCount = async () => {
  const res = await getInfoCenter()  // 你后台接口
  // unreadCount.value = res.data.count
}
const unreadCount = computed(() => {
  return infoData.value.filter(item => item.processed === 'no').length
})
// 正确监听路由路径变化
const isMessageActive = ref(false)

const navToInfoCenter = () => {
  activeIndex.value = null
  isMessageActive.value = true

  router.push({ name: 'infoCenter', query: {} })
}

const handleSelect = (key) => {
  isMessageActive.value = false
  switch (key) {
    case '1':
      router.push('/');
      break;
    case '2-1':
      router.push('/taskList');
      break;
    case '2-2':
      router.push('/handMadeOnly');
      break;
    case '2-3':
      router.push('/permitManage');
      break;
    case '3-1':
      router.push('/routeManage');
      break;
    // case '3-2':
    //   router.push('/countryList');
    //   break;
    case '3-2':
      router.push('/overflyData');
      break;
    case '4-1':
      router.push('/airportInfo');
      break;
    case '4-2':
      router.push('/aircraftManage');
      break;
    case '4-3':
      router.push('/countryList');
      break;

    case '5-1':
      router.push('/routeAnalysis');
      break;
  }
  console.log('router', router)
  // 修复4：删除 activeIndex.value = key（不要手动修改，由watch自动更新）
};

watch(
  () => route.path, // 关键修复：用 route.path 而不是 router.path

  (newPath) => {
    if (newPath === '/routeAnalysis') {
      activeIndex.value = '5-1';
    }
    if (newPath === '/airportInfo') {
      activeIndex.value = '4-1';
    }
    if (newPath === '/aircraftManage') {
      activeIndex.value = '4-2';
    }
    if (newPath === '/countryList') {
      activeIndex.value = '4-3';
    }
    if (newPath === '/overflyData') {
      activeIndex.value = '3-2';
    }

    if (newPath === '/routeManage') {
      activeIndex.value = '3-1';
    }
    if (newPath === '/permitManage') {
      activeIndex.value = '2-3';
    }
    if (newPath === '/taskList') {
      activeIndex.value = '2-1';
    }
    if (newPath === '/handMadeOnly') {
      activeIndex.value = '2-2';
    }
    if (newPath === '/permitManage') {
      activeIndex.value = '2-3';
    }
    else if (newPath === '/') {
      activeIndex.value = '1';
    }
    console.log('activeIndex updated:', activeIndex.value); // 调试用
  },
  { immediate: true }
);
onMounted(async () => {
  const infoResponse = await getInfoCenter()
  infoData.value = infoResponse.data

})
watch(() => infoData.value, (val) => {
  infoData.value = val
  console.log('infoData', infoData.value)
},
  { immediate: true })
</script>

<template>
  <el-menu :default-active="activeIndex" mode="horizontal" @select="handleSelect">
    <el-menu-item index="1">首页</el-menu-item>
    <!-- <el-menu-item index="2">飞越申请</el-menu-item> -->
    <el-sub-menu index="2">
      <template #title>飞越申请</template>
      <el-menu-item index="2-1">任务管理</el-menu-item>
      <el-menu-item index="2-2">手工制作</el-menu-item>
      <el-menu-item index="2-3">批复管理</el-menu-item>
    </el-sub-menu>
    <el-sub-menu index="3">
      <template #title>航路管理</template>
      <el-menu-item index="3-1">航路信息</el-menu-item>

      <el-menu-item index="3-2">飞越数据管理</el-menu-item>

    </el-sub-menu>
    <el-sub-menu index="4">
      <template #title>基础数据</template>
      <el-menu-item index="4-1">机场数据</el-menu-item>
      <el-menu-item index="4-2">机型数据</el-menu-item>
      <el-menu-item index="4-3">飞越国家管理</el-menu-item>


    </el-sub-menu>
    <el-sub-menu index="5">
      <template #title>AI数据分析</template>
      <el-menu-item index="5-1">全球飞越数据分析</el-menu-item>
    </el-sub-menu>
    <el-sub-menu index="6">
      <template #title>系统设置</template>
      <el-menu-item index="6-1">用户管理</el-menu-item>
    </el-sub-menu>
    <div class="button-row">
      <el-badge :value="unreadCount" class="item">
        <el-button :icon="Notification" size="large" class="messageBtn" :class="{ activeBtn: isMessageActive }" circle
          @click="navToInfoCenter" />

      </el-badge>
    </div>

  </el-menu>


</template>
<!-- <script setup>

</script> -->
<style lang="scss">
.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  // justify-content: right;
  position: relative;
  left: 50vw;

}

.messageBtn.activeBtn {
  background-color: #409EFF !important;
  /* Element Plus 主色 */
  color: #fff !important;
}
</style>