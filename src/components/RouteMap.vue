<template>
    <div ref="chartRef" class="map"></div>
</template>

<script setup>
import * as echarts from 'echarts'
import worldJson from '@/assets/world.json'
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
    routeData: {
        type: Array,
        default: () => []
    }
})

const chartRef = ref()

let chart = null

// 注册地图
const loadWorldMap = () => {
    if (!echarts.getMap('world')) {
        echarts.registerMap('world', worldJson)
    }
}

// 轨迹抽稀
const simplifyTrack = (coords, step = 10) => {
    return coords.filter((_, index) => index % step === 0)
}

const renderChart = () => {
    if (!chartRef.value) return

    if (!chart) {
        chart = echarts.init(chartRef.value)
    }

    const allLines = []
    const allPoints = []
    const allCoords = []

    const flights = props.routeData || []

    flights.forEach(flight => {

        if (!flight?.trackPoints?.length) return

        const coords = simplifyTrack(
            flight.trackPoints
                .filter(p => p[1] != null && p[2] != null)
                .map(p => [
                    p[2], // lon
                    p[1]  // lat
                ]),
            8
        )

        if (coords.length < 2) return

        allCoords.push(...coords)

        allLines.push({
            coords,
            callsign: flight.callsign
        })

        // 起飞机场
        allPoints.push({
            name: flight.departure,
            value: coords[0],
            type: 'departure'
        })

        // 落地机场
        allPoints.push({
            name: flight.arrival,
            value: coords[coords.length - 1],
            type: 'arrival'
        })

        // 国家节点
        flight.countrySegments?.forEach(seg => {

            const mid =
                seg.points?.[
                Math.floor(seg.points.length / 2)
                ]

            if (!mid) return

            allPoints.push({
                name: seg.country,
                value: [mid.lon, mid.lat],
                type: 'country'
            })
        })
    })

    let center = [80, 35]

    if (allCoords.length) {

        const lons = allCoords.map(c => c[0])
        const lats = allCoords.map(c => c[1])

        center = [
            (Math.min(...lons) + Math.max(...lons)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2
        ]
    }

    chart.setOption({
        backgroundColor: 'transparent',

        tooltip: {
            trigger: 'item',
            formatter: params => {

                if (params.seriesType === 'scatter') {
                    return params.data.name
                }

                if (params.seriesType === 'lines') {
                    return params.data.callsign || ''
                }

                return ''
            }
        },

        geo: {
            map: 'world',

            left: 0,
            right: 0,
            top: 0,
            bottom: 0,

            roam: true,

            center,

            zoom: 2,

            label: {
                show: true,
                color: '#88aacc',
                fontSize: 9
            },

            itemStyle: {
                areaColor: 'rgba(0,180,255,0.05)',
                borderColor: 'rgba(0,180,255,0.25)'
            },

            emphasis: {
                itemStyle: {
                    areaColor: 'rgba(0,180,255,0.2)'
                },
                label: {
                    color: '#ffffff'
                }
            }
        },

        series: [

            // ==========================
            // 飞机轨迹
            // ==========================
            {
                type: 'lines',

                coordinateSystem: 'geo',

                polyline: true,

                zlevel: 2,

                effect: {
                    show: true,

                    period: 10,

                    trailLength: 0,

                    symbol: 'arrow',

                    symbolSize: 8,

                    color: '#00d4ff'
                },

                lineStyle: {
                    color: '#00d4ff',

                    width: 2,

                    opacity: 0.8
                },

                data: allLines
            },

            // ==========================
            // 国家 + 机场节点
            // ==========================
            {
                type: 'scatter',

                coordinateSystem: 'geo',

                zlevel: 3,

                symbolSize: params => {

                    if (params.type === 'departure') return 14

                    if (params.type === 'arrival') return 14

                    return 8
                },

                label: {
                    show: true,

                    formatter: p => p.data.name,

                    position: 'right',

                    color: '#ffffff',

                    fontSize: 11,

                    backgroundColor: 'rgba(0,0,0,0.4)',

                    padding: [2, 4]
                },

                itemStyle: {
                    color: params => {

                        const type = params.data.type

                        if (type === 'departure') {
                            return '#52ffa8'
                        }

                        if (type === 'arrival') {
                            return '#ffae42'
                        }

                        return '#00d4ff'
                    },

                    shadowBlur: 15,

                    shadowColor: '#00d4ff'
                },

                data: allPoints
            }
        ]
    })
}

const resizeChart = () => {
    chart?.resize()
}

onMounted(() => {

    loadWorldMap()

    renderChart()

    window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {

    window.removeEventListener('resize', resizeChart)

    chart?.dispose()

    chart = null
})

watch(
    () => props.routeData,
    () => {
        renderChart()
    },
    {
        deep: true
    }
)
</script>

<style scoped>
.map {
    width: 100%;
    height: 700px;
    border-radius: 16px;
    overflow: hidden;
}
</style>