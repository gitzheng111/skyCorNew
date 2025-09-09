// src/api.js
import axios from 'axios';
const uploadProgress = ref(0)

const api = axios.create({
  baseURL: 'http://43.138.197.165:3000/api', // 后端服务器地址，根据实际修改
  // baseURL: 'http://localhost:3000/api', // 后端服务器地址，根据实际修改
});
export const baseFileURL = 'http://43.138.197.165:3000/'
export const baseURL = 'http://43.138.197.165:3000/api'
export const getFlights = () => api.get('/flights');
export const getRoutes = () => api.get('/routes');
export const getPermission = () => api.get('/permission');
export const getAircraftType = () => api.get('/aircraftType');
export const getAirportCode = () => api.get('/airportCode');
export const getCountryRules = () => api.get('/country');
export const getTaskList = () => api.get('/taskList');
export const getOverflyData = () => api.get('/overflyData');

// export const addFlights = (addFlightForm) => api.get(
//   `/flights/add?flight_number=${addFlightForm.flightNumber}&departure=${addFlightForm.departure}`

// );
export const addFlights = (addFlightForm) => api.post('/flights/add', addFlightForm);
export const updateFlightsBatchs= (form) => api.post('/flights/update-batch', form);

export const addFlightsBatchs = (addFlightFormBatch) => api.post('/flights/add-batch', addFlightFormBatch);
export const addPermission = (permissionForm) => api.post('/permission/add', permissionForm);
export const addRoutes = (routeForm) => api.post('/routes/add', routeForm, {
  onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log('上传进度', percentCompleted, '%');
      uploadProgress.value = percentCompleted;
  }
});
export const addOverflyData = (form) => api.post('/overflyData/add', form);

export const addCountryList = (formData) => {
  return axios.post(baseURL + '/country/add', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
export const updateRoutes = (routeForm) => api.post('/routes/updateBatch', routeForm);
export const updateOverflyData = (data) => api.post('/overflyData/updateBatch',data);

export const updateCountryList = (countryForm) => api.post('/country/update', countryForm);
export const updateTaskList = (form) => api.post('/taskList/update', form);
export const updatePermission = (form) => api.post('/taskList/updatePermission', form);
export const addTask = (data) => api.post('/taskList/add', data);
// export const deleteFlightsByIds = (ids) => {
//   return api.delete('/flights/batch-delete', { ids })
// }
export const deleteFlightsByIds = (ids) => {
  return api.delete('/flights/batch-delete', {
    data: { flightIds: ids }   // ⚠️ DELETE 要写在 data 里
  })
}
export const deleteRoutesByIds = (ids) => {
  return api.post('/routes/deleteBatch', { ids })
}
export const deleteCountryByIds = (ids) => {
  return api.post('/country/delete', { ids });
};
export const deleteTaskByIds = (ids) => {
  return api.post('/taskList/delete', { ids });
};

// export const deleteFlights = (flight_id) => api.delete(`/flights/delete?flight_id=${flight_id}`);
export const deleteFlights = (flight_id) => api.delete(`/flights/delete/${flight_id}`);

import { ref } from 'vue'
export const flightsData = ref([]);
export const aircraftData = ref([]);


export const airportCodeList = ref([])
export const taskListInServer = ref([])

export const fetchAirportCode = async () => {
  const res = await api.get('/airportCode')
  airportCodeList.value = res.data
}

export const fetchTaskList = async () => {
  const res = await api.get('/taskList')
  taskListInServer.value = res.data
  console.log('taskListInServer',taskListInServer)
}

export const attributeData = ref([{ 'name': '定期', 'attribute': 'schedule' },  { 'name': '加班', 'attribute': 'non-schedule' }])
