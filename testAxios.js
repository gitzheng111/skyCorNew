import axios from 'axios';

async function testPost() {
  try {
    const response = await axios.post('http://43.138.197.165/api/airportCode/test', {
      chineseName: '北京',
      englishName: 'Beijing',
      IATACode: 'PEK',
      ICAOCode: 'ZBAA'
    });

    console.log('post返回结果:', response.data);
  } catch (err) {
    if (err.response) {
      // 后端返回了错误状态码
      console.error('post状态码:', err.response.status);
      console.error('post返回数据:', err.response.data);
    } else if (err.request) {
      // 请求发出去了但是没有收到响应
      console.error('post没有收到响应:', err.request);
    } else {
      console.error('post请求出错:', err.message);
    }
  }
}

async function testPostCountry() {
  try {
    const response = await axios.post('http://43.138.197.165/api/country/test', {
      chineseName: '北京',
      englishName: 'Beijing',
      IATACode: 'PEK',
      ICAOCode: 'ZBAA'
    });

    console.log('testPostCountry返回结果:', response.data);
  } catch (err) {
    if (err.response) {
      // 后端返回了错误状态码
      console.error('testPostCountry状态码:', err.response.status);
      console.error('testPostCountry返回数据:', err.response.data);
    } else if (err.request) {
      // 请求发出去了但是没有收到响应
      console.error('post没有收到响应:', err.request);
    } else {
      console.error('post请求出错:', err.message);
    }
  }
}
async function testGet() {
  try {
    const response = await axios.get('http://43.138.197.165/api/airportCode');

    console.log('get返回结果:', response.data);
  } catch (err) {
    if (err.response) {
      // 后端返回了错误状态码
      console.error('状态码:', err.response.status);
      console.error('返回数据:', err.response.data);
    } else if (err.request) {
      // 请求发出去了但是没有收到响应
      console.error('没有收到响应:', err.request);
    } else {
      console.error('请求出错:', err.message);
    }
  }
}

testPost();
testGet();
testPostCountry()