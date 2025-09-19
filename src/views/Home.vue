
<template>
  <!-- <div class="home">
    <h1>欢迎使用SKYCOR</h1>
   
  </div> -->
  <flightList :key="flightListKey" :initialFlightData="flightsData" :initialRouteData="routes" @refreshFlights="handleRefreshFlights">
  </flightList>
</template>
<script setup>
import { getFlights, getRoutes ,getPermission, flightsData,aircraftData,getAircraftType,getAirportCode,getTaskList} from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted } from 'vue'
import flightList from '../components/flightListTool.vue'

// const flights = ref()
const routes = ref()
const permission =ref()
const flightListKey = ref(0); 
const taskListInServer =ref()
const handleRefreshFlights = async () => {
  await loadFlightData();
  flightListKey.value++; // 强制刷新组件
  console.log('重新刷新',flightListKey)
};
const loadFlightData = async () => {
  const flightResponse = await getFlights();
  const taskResponse = await getTaskList()
  flightsData.value = flightResponse.data;
  taskListInServer.value = taskResponse.data
  console.log('taskListInServer',taskListInServer.value)
  console.log('flightsData',flightsData.value)

  // 下面是你匹配 taskKey 的逻辑
  flightsData.value.forEach(flight => {
    if (!Array.isArray(flight.matchingRoutes)) return;
    flight.matchingRoutes.forEach(route => {
      if (route.isValid !== false) return;
      const matchedTasks = taskListInServer.value.filter(task => {
        if (!Array.isArray(task.data)) return false;
        return task.data.some(item => {
          const flightMatch = Array.isArray(item.flightList) && item.flightList.some(f =>
            f.flightNumber === flight.flightNumber &&
            f.departure === flight.departure &&
            f.arrival === flight.arrival
          );
          // console.log('flightMatch',flightMatch)
          const routeMatch = Array.isArray(item.overflyDetails) && item.overflyDetails.some(r =>
            r.routeCode.find(i=>i ==route.routeCode )
          );
          // console.log('routeMatch',routeMatch)

          return flightMatch && routeMatch;
        });
      });
      route.taskKeys = matchedTasks.map(t => t.taskKey);
    });
  });
};
onMounted(async () => {
  try {
    // const flightResponse = await getFlights();
    await loadFlightData()
    const routeResponse = await getRoutes();
    const permissionResponse = await getPermission();
    const ACtypeResponse = await getAircraftType()
    // const airportResponse = await getAirportCode()

    // flightsData.value = flightResponse.data;
    routes.value = routeResponse.data;
    permission.value = permissionResponse.data;
    aircraftData.value = ACtypeResponse.data
    // airportCodeData.value = airportResponse.data
    // console.log('flightResponse:', flightsData.value);
    console.log('routeResponse:', routes.value);
    console.log('permissionResponse:', permission.value);
    console.log('aircraftData:', aircraftData.value);
    // console.log('airportCodeData:', airportCodeData.value);

    // flightsData.value.forEach(flight => {
    //     if (!Array.isArray(flight.matchingRoutes)) return;

    //     flight.matchingRoutes.forEach(route => {
    //         if (route.isValid !== false) return;

    //         // 找所有匹配的task
    //         const matchedTasks = taskListInServer.value.filter(task => {
    //             if (!Array.isArray(task.data)) return false;

    //             return task.data.some(item => {
    //                 const flightMatch = Array.isArray(item.flightList) && item.flightList.some(f =>
    //                     f.flightNumber === flight.flightNumber &&
    //                     f.departure === flight.departure &&
    //                     f.arrival === flight.arrival
    //                 );

    //                 const routeMatch = Array.isArray(item.routeList) && item.routeList.some(r =>
    //                     r.routeCode === route.routeCode &&
    //                     r.season === route.season
    //                 );

    //                 return flightMatch && routeMatch;
    //             });
    //         });

    //         // 给当前 route 增加 taskKeys 字段（可能为空数组）
    //         route.taskKeys = matchedTasks.map(t => t.taskKey);
    //     });
    // });

  } catch (error) {
    console.error('API error:', error);
  }
});

</script>
<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}

.nav-link {
  margin-top: 2rem;
  display: inline-block;
}
</style>