<template>
  <!-- <div class="home">
    <h1>欢迎使用SKYCOR</h1>
   
  </div> -->
  <flightList :initialFlightData="flightsData" :initialRouteData="routes" @refreshFlights="handleRefreshFlights">
  </flightList>
</template>
<script setup>
import { getFlights, getRoutes, getPermission, flightsData, aircraftData, getAircraftType, getAirportCode, getTaskList } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, onActivated } from 'vue'
// import flightList from '../components/flightListTool.vue'
import flightList from '@/utils/flightList/FlightListTool.vue'

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
const buildTaskIndex = (taskList) => {
  const map = new Map()

  taskList.forEach(task => {
    if (!Array.isArray(task.data)) return

    task.data.forEach(item => {
      const flightList = item.flightList || []

      flightList.forEach(f => {
        const key = `${f.flightNumber}_${f.departure}_${f.arrival}`

        if (!map.has(key)) {
          map.set(key, [])
        }

        map.get(key).push({
          taskKey: task.taskKey,
          item
        })
      })
    })
  })

  return map
}
const loadFlightData = async () => {

const [flightResponse, taskResponse] = await Promise.all([
  getFlights(),
  getTaskList()
])

const flights = flightResponse.data
const taskList = taskResponse.data

taskListInServer.value = taskList


/* =========================
 * 1. 建立 taskIndex
 * flightKey -> task[]
 * ========================= */

const taskIndex = new Map()

for (const task of taskList) {

  if (!Array.isArray(task.data)) continue

  for (const item of task.data) {

    const flightList = item.flightList || []
    const overflyDetails = item.overflyDetails || []

    for (const f of flightList) {

      const key =
        `${f.flightNumber}_${f.departure}_${f.arrival}`

      if (!taskIndex.has(key)) {
        taskIndex.set(key, [])
      }

      taskIndex.get(key).push({
        taskKey: task.taskKey,
        flight: f,
        overflyDetails,
        cache: {
          departureTime: Array.isArray(f.departureTime)
            ? f.departureTime.join('')
            : String(f.departureTime ?? ''),

          arrivalTime: Array.isArray(f.arrivalTime)
            ? f.arrivalTime.join('')
            : String(f.arrivalTime ?? ''),

          days: Array.isArray(f.days)
            ? f.days.join('')
            : String(f.days ?? '')
        }
      })

    }
  }
}


/* =========================
 * 2. 处理 flights
 * ========================= */

const newFlights = flights.map(flight => {

  const flightCache = {
    departureTime: Array.isArray(flight.departureTime)
      ? flight.departureTime.join('')
      : String(flight.departureTime ?? ''),

    arrivalTime: Array.isArray(flight.arrivalTime)
      ? flight.arrivalTime.join('')
      : String(flight.arrivalTime ?? ''),

    days: Array.isArray(flight.days)
      ? flight.days.join('')
      : String(flight.days ?? '')
  }

  let applyRouteCount = 0

  const flightKey =
    `${flight.flightNumber}_${flight.departure}_${flight.arrival}`

  const matchedTasks =
    taskIndex.get(flightKey) || []


  const matchingRoutes =
    (flight.matchingRoutes || []).map(route => {

      let allTaskKeys = []


      const overflyCountry =
        (route.overflyCountry || []).map(countryObj => {

          const routeDetails =
            countryObj.overflyDetails || []

          let matched = false
          let differences = {}

          let taskKeys = []


          for (const t of matchedTasks) {

            let routeMatch = true

            if (routeDetails.length) {

              routeMatch = false

              for (const r of routeDetails) {
                for (const o of t.overflyDetails) {

                  if (
                    r.entryPoint === o.entryPoint &&
                    r.exitPoint === o.exitPoint
                  ) {
                    routeMatch = true
                    break
                  }

                }

                if (routeMatch) break
              }

            }

            if (!routeMatch) continue

            matched = true


            if (
              flightCache.departureTime !== t.cache.departureTime ||
              flightCache.arrivalTime !== t.cache.arrivalTime ||
              flightCache.days !== t.cache.days
            ) {

              if (
                flightCache.departureTime !== t.cache.departureTime
              ) {
                differences.departureTime =
                  `${flightCache.departureTime} ≠ ${t.cache.departureTime}`
              }

              if (
                flightCache.arrivalTime !== t.cache.arrivalTime
              ) {
                differences.arrivalTime =
                  `${flightCache.arrivalTime} ≠ ${t.cache.arrivalTime}`
              }

              if (
                flightCache.days !== t.cache.days
              ) {
                differences.days =
                  `${flightCache.days} ≠ ${t.cache.days}`
              }

            }

            taskKeys.push(t.taskKey)

          }


          let applyStatus

          if (matched && !Object.keys(differences).length) {
            applyStatus = {
              status: 'matched',
              details: {}
            }
          }
          else if (Object.keys(differences).length) {
            applyStatus = {
              status: 'diff',
              details: differences
            }
          }
          else {
            applyStatus = {
              status: 'none',
              details: {}
            }
          }

          allTaskKeys.push(...taskKeys)

          return {
            ...countryObj,
            applyStatus,
            taskKeys
          }

        })


      const isApply =
        allTaskKeys.length > 0

      if (!route.isPermit && isApply) {
        applyRouteCount++
      }

      return {
        ...route,
        overflyCountry,
        taskKeys: allTaskKeys,
        isApply
      }

    })


  return {
    ...flight,
    matchingRoutes,
    applyRoute: applyRouteCount
  }

})


flightsData.value = newFlights
// console.log('home传给flightList的数据',flightsData.value)

}
// const loadFlightData = async () => {

//   const [flightResponse, taskResponse] = await Promise.all([
//     getFlights(),
//     getTaskList()
//   ])

//   const flights = flightResponse.data
//   const taskList = taskResponse.data

//   taskListInServer.value = taskList

//   // ✅ 建立任务索引
//   const taskIndex = new Map()

//   for (const task of taskList) {

//     if (!Array.isArray(task.data)) continue

//     for (const item of task.data) {

//       const flightList = item.flightList || []
//       const overflyDetails = item.overflyDetails || []

//       for (const f of flightList) {

//         const key =
//           `${f.flightNumber}_${f.departure}_${f.arrival}`

//         if (!taskIndex.has(key)) {
//           taskIndex.set(key, [])
//         }

//         taskIndex.get(key).push({
//           taskKey: task.taskKey,
//           flight: f,
//           overflyDetails
//         })

//       }
//     }
//   }

//   // ✅ 新数组，不直接改响应式
//   const newFlights = flights.map(flight => {

//     let applyRouteCount = 0

//     const flightKey =
//       `${flight.flightNumber}_${flight.departure}_${flight.arrival}`

//     const matchedTasks =
//       taskIndex.get(flightKey) || []

//     const matchingRoutes =
//       (flight.matchingRoutes || []).map(route => {

//         let allTaskKeys = []

//         const overflyCountry =
//           (route.overflyCountry || []).map(countryObj => {

//             let matched = false
//             let differences = {}

//             const routeDetails =
//               countryObj.overflyDetails || []

//             const validTasks = matchedTasks.filter(t => {

//               const f = t.flight

//               let routeMatch = true

//               if (routeDetails.length) {
//                 routeMatch = routeDetails.some(r =>
//                   t.overflyDetails.some(o =>
//                     r.entryPoint === o.entryPoint &&
//                     r.exitPoint === o.exitPoint
//                   )
//                 )
//               }

//               if (!routeMatch) return false

//               matched = true

//               for (const key of [
//                 'departureTime',
//                 'arrivalTime',
//                 'days'
//               ]) {

//                 const v1 =
//                   Array.isArray(flight[key])
//                     ? flight[key].join('')
//                     : String(flight[key] ?? '')

//                 const v2 =
//                   Array.isArray(f[key])
//                     ? f[key].join('')
//                     : String(f[key] ?? '')

//                 if (v1 !== v2) {
//                   differences[key] =
//                     `${v1} ≠ ${v2}`
//                 }
//               }

//               return true

//             })

//             let applyStatus

//             if (matched && !Object.keys(differences).length) {
//               applyStatus = {
//                 status: 'matched',
//                 details: {}
//               }
//             }
//             else if (Object.keys(differences).length) {
//               applyStatus = {
//                 status: 'diff',
//                 details: differences
//               }
//             }
//             else {
//               applyStatus = {
//                 status: 'none',
//                 details: {}
//               }
//             }

//             const taskKeys =
//               validTasks.map(t => t.taskKey)

//             allTaskKeys.push(...taskKeys)

//             return {
//               ...countryObj,
//               applyStatus,
//               taskKeys
//             }

//           })

//         const isApply =
//           allTaskKeys.length > 0

//         if (!route.isPermit && isApply) {
//           applyRouteCount++
//         }

//         return {
//           ...route,
//           overflyCountry,
//           taskKeys: allTaskKeys,
//           isApply
//         }

//       })

//     return {
//       ...flight,
//       matchingRoutes,
//       applyRoute: applyRouteCount
//     }

//   })

//   // ✅ 一次性赋值
//   flightsData.value = newFlights

// }
// const loadFlightData = async () => {

// const flightResponse = await getFlights()
// const taskResponse = await getTaskList()

// flightsData.value = flightResponse.data
// taskListInServer.value = taskResponse.data

// console.log('01加载的飞行计划数据', flightsData.value)

// // ✅ 建立索引
// const taskIndex = buildTaskIndex(taskListInServer.value)

// // =============================
// // 开始匹配
// // =============================

// flightsData.value.forEach(flight => {

//   if (!Array.isArray(flight.matchingRoutes)) return

//   let applyRouteCount = 0

//   const flightKey =
//     `${flight.flightNumber}_${flight.departure}_${flight.arrival}`

//   const matchedTasks = taskIndex.get(flightKey) || []

//   flight.matchingRoutes.forEach(route => {

//     let allTaskKeys = []

//     if (!Array.isArray(route.overflyCountry)) return

//     route.overflyCountry.forEach(countryObj => {

//       let differences = {}
//       let matched = false

//       const routeOverflyDetails =
//         countryObj.overflyDetails || []

//       // =============================
//       // 在已匹配任务里筛选
//       // =============================

//       const validTasks = matchedTasks.filter(t => {

//         const item = t.item

//         const flightList =
//           item.flightList || []

//         const overflyDetails =
//           item.overflyDetails || []

//         const flightMatchItem = flightList.find(f =>
//           f.flightNumber === flight.flightNumber &&
//           f.departure === flight.departure &&
//           f.arrival === flight.arrival
//         )

//         if (!flightMatchItem) return false

//         let routeMatch = true

//         if (routeOverflyDetails.length > 0) {
//           routeMatch = routeOverflyDetails.some(rRoute =>
//             overflyDetails.some(rTask =>
//               rRoute.entryPoint === rTask.entryPoint &&
//               rRoute.exitPoint === rTask.exitPoint
//             )
//           )
//         }

//         if (flightMatchItem && routeMatch) {

//           matched = true

//           // =============================
//           // 差异检查
//           // =============================

//           ;['departureTime', 'arrivalTime', 'days']
//             .forEach(key => {

//               const val1 = Array.isArray(flight[key])
//                 ? flight[key].join('')
//                 : String(flight[key] ?? '')

//               const val2 = Array.isArray(flightMatchItem[key])
//                 ? flightMatchItem[key].join('')
//                 : String(flightMatchItem[key] ?? '')

//               if (val1 !== val2) {
//                 differences[key] =
//                   `${val1} ≠ ${val2}`
//               }

//             })
//         }

//         return flightMatchItem && routeMatch
//       })

//       // =============================
//       // applyStatus
//       // =============================

//       if (matched && Object.keys(differences).length === 0) {

//         countryObj.applyStatus = {
//           status: 'matched',
//           details: {}
//         }

//       }
//       else if (Object.keys(differences).length > 0) {

//         countryObj.applyStatus = {
//           status: 'diff',
//           details: differences
//         }

//       }
//       else {

//         countryObj.applyStatus = {
//           status: 'none',
//           details: {}
//         }

//       }

//       // =============================
//       // taskKeys
//       // =============================

//       countryObj.taskKeys =
//         validTasks.map(t => t.taskKey)

//       allTaskKeys.push(...countryObj.taskKeys)

//     })

//     // =============================
//     // route taskKeys
//     // =============================

//     route.taskKeys = allTaskKeys

//     route.isApply =
//       Array.isArray(route.taskKeys) &&
//       route.taskKeys.length > 0

//     if (!route.isPermit && route.isApply) {
//       applyRouteCount++
//     }

//   })

//   flight.applyRoute = applyRouteCount

// })

// console.log(
//   "flightsData with applyStatus:",
//   flightsData.value
// )

// }
// const loadFlightData = async () => {
//   const flightResponse = await getFlights();
//   const taskResponse = await getTaskList();
//   flightsData.value = flightResponse.data;
//   taskListInServer.value = taskResponse.data;
//   console.log('01加载的飞行计划数据', flightsData.value)
//   flightsData.value.forEach(flight => {

//     if (!Array.isArray(flight.matchingRoutes)) return;
//     let applyRouteCount = 0
//     flight.matchingRoutes.forEach(route => {
//       let allTaskKeys = [];

//       route.overflyCountry.forEach(countryObj => {
//         const { country } = countryObj;
//         let differences = {};
//         let matched = false;

//         const matchedTasks = taskListInServer.value.filter(task => {
//           if (!Array.isArray(task.data)) return false;
//           //拆解task
//           return task.data.some(item => {
//             const flightList = Array.isArray(item.flightList) ? item.flightList : [];
//             const overflyDetails = Array.isArray(item.overflyDetails) ? item.overflyDetails : [];
//             // console.log('flightList',flightList)
//             // console.log('overflyDetails',overflyDetails)
//             // 航班匹配（只比对三大字段）
//             const flightMatchItem = flightList.find(f =>
//               f.flightNumber === flight.flightNumber &&
//               f.departure === flight.departure &&
//               f.arrival === flight.arrival
//             );
//             // if(flight.flightNumber=='MF824'){}
//             // console.log(`航班匹配flightNumber${flight.flightNumber}`,flightMatchItem)
//             if (!flightMatchItem) return false;

//             // 路线匹配
//             let routeMatch = true;
//             const routeOverflyDetails = Array.isArray(countryObj.overflyDetails) ? countryObj.overflyDetails : [];
//             if (routeOverflyDetails.length > 0) {
//               routeMatch = routeOverflyDetails.some(rRoute =>
//                 overflyDetails.some(rTask =>
//                   rRoute.entryPoint === rTask.entryPoint &&
//                   rRoute.exitPoint === rTask.exitPoint
//                 )
//               );
//             }
//             // console.log(`航路匹配flightNumber${flight.flightNumber}`, routeMatch)
//             // if(flight.flightNumber=='MF824'){console.log(`航路匹配flightNumber${flight.flightNumber}`,routeMatch)}
//             if (flightMatchItem && routeMatch) {
//               matched = true;

//               // 差异检查
//               ['departureTime', 'arrivalTime', 'days'].forEach(key => {
//                 const val1 = Array.isArray(flight[key]) ? flight[key].join('') : String(flight[key] ?? '');
//                 const val2 = Array.isArray(flightMatchItem[key]) ? flightMatchItem[key].join('') : String(flightMatchItem[key] ?? '');
//                 if (val1 !== val2) {
//                   differences[key] = `${val1} ≠ ${val2}`;
//                 }
//               });
//             }

//             return flightMatchItem && routeMatch;
//           });
//         });
//         // console.log(`航班匹配flightNumber${flight.flightNumber}`,'matched',matched)
//         // ✅ 统一的 applyStatus 结构
//         if (matched && Object.keys(differences).length === 0) {
//           countryObj.applyStatus = { status: 'matched', details: {} };
//         } else if (Object.keys(differences).length > 0) {
//           countryObj.applyStatus = { status: 'diff', details: differences };
//         } else {
//           countryObj.applyStatus = { status: 'none', details: {} };
//         }

//         // 给每个 country 存自己的 taskKeys
//         countryObj.taskKeys = matchedTasks.map(t => t.taskKey);

//         // 累积到 route 的 taskKeys
//         allTaskKeys.push(...countryObj.taskKeys);
//       });

//       // route 下收集所有国家的 taskKeys

//       route.taskKeys = allTaskKeys;
//       route.isApply = Array.isArray(route.taskKeys) && route.taskKeys.length > 0
//       if (!route.isPermit && route.isApply) {
//         applyRouteCount++;
//       }
//       flight.applyRoute = applyRouteCount
//       // if (applyRouteCount >= 0) {


//       // }

//     });

//   });

//   console.log("flightsData with applyStatus:", flightsData.value);
// };
watch(
  () => overflyStore.needRefresh,
  (val) => {
    if (val) {
      handleRefreshFlights()
      overflyStore.setNeedRefresh(false)
    }
  }
)
// onActivated(() => {
//   watch(
//     () => overflyStore.needRefresh,
//     (val) => {
//       console.log('watch触发', val)
//       if (val) {
//         handleRefreshFlights()
//         overflyStore.setNeedRefresh(false)
//       }
//     }
//   )
// })
import { useLoading } from '../plugins/loading'

const loading = useLoading()
onMounted(async () => {
  try {
    // const flightResponse = await getFlights();
    // if (route.query.refresh) {
    //   loadFlightData()
    // }
    loading.show('正在加载航班数据，请稍候...')
    // await nextTick()

    // await new Promise(r => setTimeout(r, 0))
    // await loadFlightData()
    await Promise.all([
      loadFlightData(),
      getRoutes().then(r => routes.value = r.data),
      // getPermission().then(r => permission.value = r.data),
      // getAircraftType().then(r => aircraftData.value = r.data)
    ])
    
    // const [
    //   flightResponse,
    //   routeResponse,
    //   permissionResponse,
    //   ACtypeResponse
    // ] = await Promise.all([
    //   loadFlightData(),
    //   getRoutes(),
    //   getPermission(),
    //   getAircraftType()
    // ])
    // const routeResponse = await getRoutes();
    // const permissionResponse = await getPermission();
    // const ACtypeResponse = await getAircraftType()
    loading.hide()
    

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