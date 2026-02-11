<template>
  <!-- <div class="home">
    <h1>欢迎使用SKYCOR</h1>
   
  </div> -->
  <flightList :key="flightListKey" :initialFlightData="flightsData" :initialRouteData="routes"
    @refreshFlights="handleRefreshFlights">
  </flightList>
</template>
<script setup>
import { getFlights, getRoutes, getPermission, flightsData, aircraftData, getAircraftType, getAirportCode, getTaskList } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, onActivated } from 'vue'
import flightList from '../components/flightListTool.vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import { useOverflyStore } from '../store/overfly.js'
const route = useRoute()
const overflyStore = useOverflyStore()


// const flights = ref()
const routes = ref()
const permission = ref()
const flightListKey = ref(0);
const taskListInServer = ref()
const handleRefreshFlights = async () => {
  loading.show('刷新航班数据，请稍后...')
  await loadFlightData();
  loading.hide()
  flightListKey.value++; // 强制刷新组件
  console.log('重新刷新', flightListKey)
};
const loadFlightData = async () => {
  const flightResponse = await getFlights();
  const taskResponse = await getTaskList();
  flightsData.value = flightResponse.data;
  taskListInServer.value = taskResponse.data;
  console.log('01加载的飞行计划数据', flightsData.value)
  flightsData.value.forEach(flight => {
   
    if (!Array.isArray(flight.matchingRoutes)) return;
    let applyRouteCount = 0
    flight.matchingRoutes.forEach(route => {
      let allTaskKeys = [];

      route.overflyCountry.forEach(countryObj => {
        const { country } = countryObj;
        let differences = {};
        let matched = false;

        const matchedTasks = taskListInServer.value.filter(task => {
          if (!Array.isArray(task.data)) return false;
          //拆解task
          return task.data.some(item => {
            const flightList = Array.isArray(item.flightList) ? item.flightList : [];
            const overflyDetails = Array.isArray(item.overflyDetails) ? item.overflyDetails : [];
            // console.log('flightList',flightList)
            // console.log('overflyDetails',overflyDetails)
            // 航班匹配（只比对三大字段）
            const flightMatchItem = flightList.find(f =>
              f.flightNumber === flight.flightNumber &&
              f.departure === flight.departure &&
              f.arrival === flight.arrival
            );
            // if(flight.flightNumber=='MF824'){}
            // console.log(`航班匹配flightNumber${flight.flightNumber}`,flightMatchItem)
            if (!flightMatchItem) return false;

            // 路线匹配
            let routeMatch = true;
            const routeOverflyDetails = Array.isArray(countryObj.overflyDetails) ? countryObj.overflyDetails : [];
            if (routeOverflyDetails.length > 0) {
              routeMatch = routeOverflyDetails.some(rRoute =>
                overflyDetails.some(rTask =>
                  rRoute.entryPoint === rTask.entryPoint &&
                  rRoute.exitPoint === rTask.exitPoint
                )
              );
            }
            // console.log(`航路匹配flightNumber${flight.flightNumber}`, routeMatch)
            // if(flight.flightNumber=='MF824'){console.log(`航路匹配flightNumber${flight.flightNumber}`,routeMatch)}
            if (flightMatchItem && routeMatch) {
              matched = true;

              // 差异检查
              ['departureTime', 'arrivalTime', 'days'].forEach(key => {
                const val1 = Array.isArray(flight[key]) ? flight[key].join('') : String(flight[key] ?? '');
                const val2 = Array.isArray(flightMatchItem[key]) ? flightMatchItem[key].join('') : String(flightMatchItem[key] ?? '');
                if (val1 !== val2) {
                  differences[key] = `${val1} ≠ ${val2}`;
                }
              });
            }

            return flightMatchItem && routeMatch;
          });
        });
        // console.log(`航班匹配flightNumber${flight.flightNumber}`,'matched',matched)
        // ✅ 统一的 applyStatus 结构
        if (matched && Object.keys(differences).length === 0) {
          countryObj.applyStatus = { status: 'matched', details: {} };
        } else if (Object.keys(differences).length > 0) {
          countryObj.applyStatus = { status: 'diff', details: differences };
        } else {
          countryObj.applyStatus = { status: 'none', details: {} };
        }

        // 给每个 country 存自己的 taskKeys
        countryObj.taskKeys = matchedTasks.map(t => t.taskKey);

        // 累积到 route 的 taskKeys
        allTaskKeys.push(...countryObj.taskKeys);
      });

      // route 下收集所有国家的 taskKeys
      
      route.taskKeys = allTaskKeys;
      route.isApply = Array.isArray(route.taskKeys) && route.taskKeys.length > 0
      if (!route.isPermit && route.isApply) {
        applyRouteCount++;
      }
      flight.applyRoute = applyRouteCount
      // if (applyRouteCount >= 0) {
        

      // }

    });

  });

  console.log("flightsData with applyStatus:", flightsData.value);
};

// const loadFlightData = async () => {
//   const flightResponse = await getFlights();
//   const taskResponse = await getTaskList()
//   flightsData.value = flightResponse.data;
//   taskListInServer.value = taskResponse.data
//   console.log('taskListInServer', taskListInServer.value)
//   console.log('flightsData', flightsData.value)

//   // 下面是匹配 taskKey 的逻辑
//   flightsData.value.forEach(flight => {
//     if (!Array.isArray(flight.matchingRoutes)) return;
//     flight.matchingRoutes.forEach(route => {
//       if (route.isValid !== false) return;
//       const matchedTasks = taskListInServer.value.filter(task => {
//         if (!Array.isArray(task.data)) return false;
//         // const targetTask = 
//         return task.data.some(item => {
//           const flightList = Array.isArray(item.flightList) ? item.flightList : [];
//           const overflyDetails = Array.isArray(item.overflyDetails) ? item.overflyDetails : [];

//           const flightMatch = flightList.some(f =>
//             f.flightNumber === flight.flightNumber &&
//             f.departure === flight.departure &&
//             f.departureTime === flight.departureTime &&
//             f.arrivalTime === flight.arrivalTime &&
//             f.arrival === flight.arrival
//           );
//           if(flight.flightNumber =='805'){
//             console.log(`${flight.flightNumber}的flightMatch`,flightMatch)
//           }

//           let routeMatch = true; // 默认匹配
//           if (overflyDetails.length > 0) {
//             routeMatch = overflyDetails.some(r =>
//             r.entryPoint ==route.entryPoint&&r.exitPoint ==route.exitPoint
//               // Array.isArray(r.routeCode) && r.routeCode.includes(route.routeCode)
//             );
//           }
//           return flightMatch && routeMatch;
//           // console.log('routeMatch',routeMatch)

//         });
//       });
//       // console.log('matchedTask', matchedTasks)
//       route.taskKeys = matchedTasks.map(t => t.taskKey);
//       // route.overflyData.value.forEach(countryObj => {
//       //   let keys = [];

//       //   taskListInServer.value.forEach(task => {
//       //     task.data.forEach(item => {
//       //       if (Array.isArray(item.overflyDetails)) {
//       //         item.overflyDetails.forEach(detail => {
//       //           if (detail.country === countryObj.country) {
//       //             keys.push(task.taskKey);
//       //           }
//       //         });
//       //       }
//       //     });
//       //   });

//       //   // 去重
//       //   countryObj.taskKeys = [...new Set(keys)];
//       // });

//     });
//   });
// };
// watch(
//   () => overflyStore.needRefresh,
//   (val) => {
//     if (val) {
//       console.log('监听到需要更新数据', val)
//       handleRefreshFlights()
//       overflyStore.setNeedRefresh(false)
//     }
//   }
// )
onActivated(() => {
  watch(
    () => overflyStore.needRefresh,
    (val) => {
      console.log('watch触发', val)
      if (val) {
        handleRefreshFlights()
        overflyStore.setNeedRefresh(false)
      }
    }
  )
})
import { useLoading } from '../plugins/loading'

const loading = useLoading()
onMounted(async () => {
  try {
    // const flightResponse = await getFlights();
    // if (route.query.refresh) {
    //   loadFlightData()
    // }
    loading.show('正在加载航班数据，请稍候...')
    await loadFlightData()
    const routeResponse = await getRoutes();
    const permissionResponse = await getPermission();
    const ACtypeResponse = await getAircraftType()
    loading.hide()
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