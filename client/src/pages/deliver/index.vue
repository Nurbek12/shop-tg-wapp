<template>
    <div class="h-screen w-full flex flex-col gap-2 relative">
      <template v-if="open">
        <div class="w-full flex-1">
          <mgl-map
            v-if="courierPosition[0] !== 0 && courierPosition[1] !== 0"
            :map-style="'https://api.maptiler.com/maps/streets/style.json?key=cQX2iET1gmOW38bedbUh'"
            :center="(center as any)"
            v-model:zoom="zoom"
            @map:load="loadMap">
            <mgl-marker :coordinates="(courierPosition as any)" color="red">
              <mgl-popup>
                Курьер - Это вы
              </mgl-popup>
            </mgl-marker>
            <mgl-navigation-control />
            <mgl-marker v-for="order,i in orders" :coordinates="[order.longitude, order.latitude]" :key="order.id" :color="{'pending':'blue','finish':'green','canceled':'gray'}[order.status]">
              <mgl-popup>
                <div>
                  {{ order.user?.first_name }} {{ order.user?.last_name }} - {{ order.user?.phone }}
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <app-btn @click="delivered(order.id, i, 'finish')" class="text-sm w-full text-white">Заказ доставлен</app-btn>
                  <!-- <app-btn class="text-sm" @click="delivered(order.id, i, 'canceled')" class="w-full text-white">Заказ доставлен</app-btn> -->
                </div>
              </mgl-popup>
            </mgl-marker>
          </mgl-map>
        </div>
        <div class="container w-full pb-4 py-2">
          <app-btn @click="sheet=true" class="w-full text-white">Посмотреть заказов</app-btn>
        </div>
      </template>
      <div v-else class="flex-1">
        <div class="flex justify-center flex-col gap-4 items-center container h-full">
          <div>
            <img class="mx-auto w-full max-w-[300px]" src="/courier.png" alt="">
          </div>
          <app-btn @click="startMap" class="w-full text-white">Начинать работу</app-btn>
        </div>
      </div>
    </div>
    
    <bottom-sheet title="Покупки" v-model="sheet">
      <div class="h-full overflow-y-auto">
        <div class="pb-16">
          <div class="text-center text-gray-700" v-show="orders.length===0">Нет покупки</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <order v-for="order,i in orders" :key="i" :order="order" hide_report />
          </div>
        </div>
      </div>
    </bottom-sheet>
</template>

<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'

import { Marker } from 'maplibre-gl'
import polyline from '@mapbox/polyline'
import Order from '@/components/order.vue'
import { IOrder } from '@/constants/types'
import AppBtn from '@/components/app-btn.vue'
import { onMounted, ref, computed } from 'vue'
import { get_delivery, update_order } from '@/api/orders'
import BottomSheet from '@/components/bottom-sheet.vue'
import { MglMap, MglNavigationControl, MglMarker, MglPopup } from '@indoorequal/vue-maplibre-gl'

const zoom = ref(14)
const open = ref(false)
const sheet = ref(false)
const orders = ref<IOrder[]>([])
const center = ref<number[]>([0, 0])
const courierPosition = ref<number[]>([0, 0])

const getOrders = async () => {
  const { data } = await get_delivery()
  orders.value = data.data
}

const delivered = async (id: number, index: number, status: 'finish' | 'canceled') => {
  if(!confirm('Вы доставили этот заказ?')) return
  await update_order(id, { status })
  orders.value[index].status = status
}

const sortedOrders = computed(() => {
  if(orders.value.length === 0) return [] 
  return orders.value.filter(o => !!o.latitude && !!o.longitude).sort((a, b) => {
      const distanceA = haversineDistance(courierPosition.value[0], courierPosition.value[1], a.latitude, a.longitude);
      const distanceB = haversineDistance(courierPosition.value[0], courierPosition.value[1], b.latitude, b.longitude);
      return distanceA - distanceB;
  });
})

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

const loadMap = ({map}: any) => {
  if(orders.value.length === 0) return 
  let url1 = new URL("https://maptoolkit.p.rapidapi.com/route");
  url1.searchParams.append("point", `${courierPosition.value[1]},${courierPosition.value[0]}`);
  sortedOrders.value.map(o => {
    url1.searchParams.append("point", `${o.latitude},${o.longitude}`);
  })
    url1.searchParams.append("routeType", "car");
  url1.searchParams.append("rapidapi-key", "2d5d8ea9ccmsh08eb851594888f2p191856jsn29dbe103be34");
  fetch(url1)
    .then((r) => r.json())
    .then((route) => {
        let path = route.paths[0]
        let coordinates = polyline.decode(path.points).map((c: any) => c.reverse());
        map.addLayer({
            id: "route",
            type: "line",
            source: {
                type: "geojson",
                data: {
                type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coordinates,
                    },
                },
            },
            layout: {
                "line-join": "round",
                "line-cap": "round",
            },
            paint: {
                "line-color": "#2a3561",
                "line-width": 5,
            },
        });
        // Add instruction markers with popup to map
        path.instructions.forEach((instruction: any) => {
            let $img = document.createElement("img");
            $img.src = "https://static.maptoolkit.net/sprites/maptoolkit/route-via.svg";
            $img.width = 12;
            $img.height = 12;
            $img.style["cursor"] = "pointer";
            new Marker({
                element: $img,
                anchor: "center",
            })
            .setLngLat(instruction.coordinate.reverse())
            .addTo(map)
        });
        
        let $img = document.createElement("img");
        $img.src = "https://static.maptoolkit.net/sprites/maptoolkit/marker.svg";
        $img.width = 29;
        $img.height = 30;
        new Marker({
            element: $img,
            anchor: "bottom",
        })
        .setLngLat(coordinates[0])
        .addTo(map);
        
    }).catch(error => {
    console.log(error)
  })
}

const nearbyOrderId = computed(() => {
  if(orders.value.length === 0) return null 
  for (const order of orders.value) {
  const distance = haversineDistance(courierPosition.value[0], courierPosition.value[1], order.latitude, order.longitude);
    if (distance <= 0.01) {
      return order.id;
    }
  }
  return null;
})

const startMap = async () => {
  open.value = true
  await getOrders()

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        courierPosition.value = [position.coords.longitude, position.coords.latitude];
        center.value = [position.coords.longitude, position.coords.latitude];
      },
      (error) => {
        console.error('Error getting geolocation:', error);
      }
    )

    navigator.geolocation.watchPosition(
      (position) => {
        courierPosition.value = [position.coords.longitude, position.coords.latitude];
      },
      (error) => {
        console.error('Error watching geolocation:', error);
      }
    )
  }
}
</script>