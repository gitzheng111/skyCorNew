<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 修复1：必须导入 useRoute

// import mammoth from 'mammoth'; nnp
const router = useRouter();
const route = useRoute(); // 修复2：获取当前路由对象
const activeIndex = ref('1');

// 修复3：正确监听路由路径变化

const handleSelect = (key) => {
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
      case '3-2':
      router.push('/countryList');
      break;
      case '3-3':
      router.push('/overflyData');
      break;
  }
  console.log('router', router)
  // 修复4：删除 activeIndex.value = key（不要手动修改，由watch自动更新）
};

watch(
  () => route.path, // 关键修复：用 route.path 而不是 router.path

  (newPath) => {
    if (newPath === '/overflyData') {
      activeIndex.value = '3-3';
    }
    if (newPath === '/countryList') {
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
      <el-menu-item index="3-2">飞越国家管理</el-menu-item>
      <el-menu-item index="3-3">飞越数据管理</el-menu-item>

    </el-sub-menu>
  </el-menu>
</template>