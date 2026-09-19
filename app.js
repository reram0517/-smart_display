function updateClock() {
  const now = new Date();
  
  // 日付の更新
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const dayName = days[now.getDay()];
  document.getElementById('date').textContent = `${year}/${month}/${date} (${dayName})`;

  // 時刻の更新
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;

  const secondAngle = now.getSeconds() * 6;
  const minuteAngle = now.getMinutes() * 6 + now.getSeconds() * 0.1;
  const hourAngle = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
  document.getElementById('hour-hand').style.transform = `translateX(-50%) rotate(${hourAngle}deg)`;
  document.getElementById('minute-hand').style.transform = `translateX(-50%) rotate(${minuteAngle}deg)`;
  document.getElementById('second-hand').style.transform = `translateX(-50%) rotate(${secondAngle}deg)`;
}

function getJapaneseHoliday(year, month, day) {
  const fixedHolidays = {
    '1-1': '元日',
    '2-11': '建国記念の日',
    '2-23': '天皇誕生日',
    '4-29': '昭和の日',
    '5-3': '憲法記念日',
    '5-4': 'みどりの日',
    '5-5': 'こどもの日',
    '8-11': '山の日',
    '11-3': '文化の日',
    '11-23': '勤労感謝の日'
  };
  const fixedHoliday = fixedHolidays[`${month + 1}-${day}`];
  if (fixedHoliday) return fixedHoliday;
  const date = new Date(year, month, day);
  const mondayNumber = Math.floor((day - 1) / 7) + 1;
  if (month === 0 && date.getDay() === 1 && mondayNumber === 2) return '成人の日';
  if (month === 6 && date.getDay() === 1 && mondayNumber === 3) return '海の日';
  if (month === 8 && date.getDay() === 1 && mondayNumber === 3) return '敬老の日';
  if (month === 9 && date.getDay() === 1 && mondayNumber === 2) return 'スポーツの日';
  const vernalEquinox = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  const autumnalEquinox = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  if (month === 2 && day === vernalEquinox) return '春分の日';
  if (month === 8 && day === autumnalEquinox) return '秋分の日';
  return '';
}

function renderCalendar(now = new Date()) {
  const calendarDate = new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1);
  const monthLabel = calendarDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  const firstDay = calendarDate.getDay();
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const days = document.getElementById('calendar-days');
  document.getElementById('calendar-month').textContent = monthLabel;
  days.innerHTML = '';
  for (let index = 0; index < firstDay; index += 1) {
    days.appendChild(document.createElement('span'));
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayCell = document.createElement('span');
    dayCell.textContent = day;
    if (calendarMonthOffset === 0 && day === now.getDate()) dayCell.classList.add('is-today');
    const holidayName = getJapaneseHoliday(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    if (holidayName) {
      dayCell.classList.add('is-holiday');
      dayCell.title = holidayName;
    }
    days.appendChild(dayCell);
  }
}

function changeCalendarMonth(amount) {
  calendarMonthOffset += amount;
  renderCalendar();
}

function setupCalendarSwipe() {
  const clockPanel = document.querySelector('.clock-panel');
  const slider = document.getElementById('clock-slider');
  const track = slider.querySelector('.clock-track');
  const calendarPanel = document.getElementById('calendar-panel');
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let startedOnCalendar = false;
  const showPage = (page) => {
    clockPage = page;
    if (clockPage === 0) calendarMonthOffset = 0;
    track.style.transform = `translateY(-${clockPage * 50}%)`;
    clockPanel.querySelectorAll('.clock-pagination span').forEach((dot, index) => dot.classList.toggle('is-active', index === clockPage));
    calendarPanel.setAttribute('aria-hidden', String(clockPage === 0));
    if (clockPage === 1) renderCalendar();
  };
  clockPanel.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
    tracking = true;
    startedOnCalendar = Boolean(event.target.closest('.calendar-page'));
    clockPanel.setPointerCapture(event.pointerId);
  });
  clockPanel.addEventListener('pointerup', (event) => {
    if (!tracking) return;
    tracking = false;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (startedOnCalendar && Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      changeCalendarMonth(deltaX < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(deltaY) > 45 && Math.abs(deltaY) > Math.abs(deltaX)) {
      showPage(deltaY < 0 ? 1 : 0);
    }
  });
  renderCalendar();
  showPage(0);
}

let weatherPage = 0;
let clockPage = 0;
let calendarMonthOffset = 0;
let warningArea = null;

const jmaPrefectureCodes = {
  '北海道': '010000', '青森県': '020000', '岩手県': '030000', '宮城県': '040000', '秋田県': '050000',
  '山形県': '060000', '福島県': '070000', '茨城県': '080000', '栃木県': '090000', '群馬県': '100000',
  '埼玉県': '110000', '千葉県': '120000', '東京都': '130000', '神奈川県': '140000', '新潟県': '150000',
  '富山県': '160000', '石川県': '170000', '福井県': '180000', '山梨県': '190000', '長野県': '200000',
  '岐阜県': '210000', '静岡県': '220000', '愛知県': '230000', '三重県': '240000', '滋賀県': '250000',
  '京都府': '260000', '大阪府': '270000', '兵庫県': '280000', '奈良県': '290000', '和歌山県': '300000',
  '鳥取県': '310000', '島根県': '320000', '岡山県': '330000', '広島県': '340000', '徳島県': '360000',
  '香川県': '370000', '愛媛県': '380000', '高知県': '390000', '福岡県': '400000', '佐賀県': '410000',
  '長崎県': '420000', '熊本県': '430000', '大分県': '440000', '宮崎県': '450000', '鹿児島県': '460000',
  '沖縄県': '470000'
};

function setupWeatherSlider() {
  const slider = document.getElementById('weather-slider');
  const track = slider.querySelector('.weather-track');
  const previousButton = document.getElementById('weather-prev');
  const nextButton = document.getElementById('weather-next');
  let startX = 0;
  let startY = 0;
  const showPage = (page) => {
    weatherPage = page;
    track.style.transform = `translateX(-${weatherPage * 33.333333}%)`;
    slider.querySelectorAll('.weather-pagination span').forEach((dot, index) => dot.classList.toggle('is-active', index === weatherPage));
    previousButton.classList.toggle('is-visible', weatherPage !== 0);
    nextButton.textContent = weatherPage === 2 ? '最初へ ↺' : '次へ ›';
    nextButton.setAttribute('aria-label', weatherPage === 2 ? '最初の画面へ' : '次の画面へ');
  };
  slider.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.hourly-weather, .weekly-weather')) return;
    startX = event.clientX;
    startY = event.clientY;
    slider.setPointerCapture(event.pointerId);
  });
  slider.addEventListener('pointerup', (event) => {
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      showPage(deltaX < 0 ? Math.min(weatherPage + 1, 2) : Math.max(weatherPage - 1, 0));
    }
  });
  previousButton.addEventListener('click', () => showPage(weatherPage === 0 ? 2 : weatherPage - 1));
  nextButton.addEventListener('click', () => showPage(weatherPage === 2 ? 0 : weatherPage + 1));
  showPage(0);
}

const weatherCodes = {
  0: ['快晴', '☀️'],
  1: ['晴れ', '🌤️'],
  2: ['一部曇り', '⛅'],
  3: ['曇り', '☁️'],
  45: ['霧', '🌫️'],
  48: ['霧', '🌫️'],
  51: ['弱い霧雨', '🌦️'],
  53: ['霧雨', '🌦️'],
  55: ['強い霧雨', '🌧️'],
  61: ['弱い雨', '🌦️'],
  63: ['雨', '🌧️'],
  65: ['強い雨', '🌧️'],
  71: ['弱い雪', '🌨️'],
  73: ['雪', '❄️'],
  75: ['強い雪', '❄️'],
  80: ['にわか雨', '🌦️'],
  81: ['雨', '🌧️'],
  82: ['強いにわか雨', '⛈️'],
  95: ['雷雨', '⛈️'],
  96: ['雷雨と雹', '⛈️'],
  99: ['雷雨と雹', '⛈️']
};

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 35.6762, longitude: 139.6503, name: '東京' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        name: '現在地'
      }),
      () => resolve({ latitude: 35.6762, longitude: 139.6503, name: '東京' }),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  });
}

function formatHour(time) {
  return time.slice(11, 16);
}

function formatDay(time) {
  const date = new Date(time.includes('T') ? time : `${time}T12:00:00`);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
}

function jmaWeatherIcon(weather = '') {
  if (weather.includes('雪')) return '❄️';
  if (weather.includes('雷')) return '⛈️';
  if (weather.includes('雨')) return '🌧️';
  if (weather.includes('曇')) return '☁️';
  if (weather.includes('晴')) return '☀️';
  return '🌤️';
}

function jmaWeatherText(code) {
  const firstDigit = String(code || '').charAt(0);
  if (firstDigit === '1') return '晴れ';
  if (firstDigit === '2') return '曇り';
  if (firstDigit === '3') return '雨';
  if (firstDigit === '4') return '雪';
  return '情報なし';
}

function jwaWeatherText(type) {
  if (type === 'rain') return '雨';
  if (type === 'cloud') return '曇り';
  if (type === 'sunny') return '晴れ';
  return '情報なし';
}

function getJwaForecastPath(area) {
  if (area.code === '130000') return '/forecast/3/16/4410/13101/1hour.html';
  return '';
}

function getJwaUvPath(area) {
  if (area.code === '130000') return '/indexes/uv_index_ranking/3/16/4410/13101/';
  return '';
}

function getYahooForecastPath(area) {
  if (area.code === '130000') return '/weather/jp/13/4410.html';
  return '';
}

async function fetchJwaSupplement(area) {
  const path = getJwaForecastPath(area);
  if (!path) return null;
  const proxyUrl = `${location.origin}/api/jwa?path=${encodeURIComponent(path)}`;
  const directUrl = `https://tenki.jp${path}`;
  let response;
  try {
    response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('JWA proxy request failed');
  } catch (proxyError) {
    response = await fetch(directUrl);
  }
  if (!response.ok) throw new Error('JWA forecast request failed');
  const html = await response.text();
  const document = new DOMParser().parseFromString(html, 'text/html');
  const now = new Date();
  const forecast = [];
  document.querySelectorAll('.forecast-point-1h').forEach((table, dayOffset) => {
    const values = (rowClass) => [...table.querySelectorAll(`tr.${rowClass} td`)]
      .map((cell) => cell.textContent.trim().replace(/\s+/g, ' '));
    const hours = values('hour');
    const weather = values('weather');
    const temperatures = values('temperature');
    const precipitation = values('prob-precip');
    hours.forEach((hourText, index) => {
      const hour = Number(hourText);
      const temperature = Number(temperatures[index]);
      if (!Number.isFinite(hour)) return;
      const time = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour);
      if (time < now || !weather[index]) return;
      forecast.push({
        time,
        weather: weather[index],
        precipitation: /^\d+$/.test(precipitation[index]) ? precipitation[index] : '--',
        temperature: Number.isFinite(temperature) ? `${temperature.toFixed(1)}°C` : ''
      });
    });
  });
  return forecast.sort((first, second) => first.time - second.time).slice(0, 12);
}

async function fetchJwaUv(area) {
  const path = getJwaUvPath(area);
  if (!path) return null;
  const proxyUrl = `${location.origin}/api/jwa?path=${encodeURIComponent(path)}`;
  const directUrl = `https://tenki.jp${path}`;
  let response;
  try {
    response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('JWA proxy request failed');
  } catch (proxyError) {
    response = await fetch(directUrl);
  }
  if (!response.ok) throw new Error('JWA UV request failed');
  const document = new DOMParser().parseFromString(await response.text(), 'text/html');
  const level = document.querySelector('.indexes-telop-0')?.textContent.trim();
  const advice = document.querySelector('.indexes-telop-1')?.textContent.trim();
  if (!level) throw new Error('JWA UV data was not found');
  return { level, advice: advice || '紫外線対策を確認してください' };
}

async function fetchPublishedJwaUv() {
  const response = await fetch('uv.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Published UV data request failed');
  const data = await response.json();
  if (!data.level) throw new Error('Published UV data was not found');
  return data;
}

function yahooForecastDate(dateText) {
  const match = dateText.match(/(\d+)月(\d+)日/);
  if (!match) return new Date();
  const now = new Date();
  const date = new Date(now.getFullYear(), Number(match[1]) - 1, Number(match[2]), 12);
  if (date < new Date(now.getFullYear(), now.getMonth() - 1, 1)) date.setFullYear(date.getFullYear() + 1);
  return date;
}

async function fetchYahooForecast(area) {
  const path = getYahooForecastPath(area);
  if (!path) throw new Error('Yahoo forecast is unavailable for this area');
  const response = await fetch(`${location.origin}/api/yahoo?path=${encodeURIComponent(path)}`);
  if (!response.ok) throw new Error('Yahoo forecast request failed');
  const document = new DOMParser().parseFromString(await response.text(), 'text/html');
  const forecasts = [...document.querySelectorAll('.forecastCity div')].map((element) => {
    const weather = element.querySelector('.pict img')?.alt?.trim();
    if (!weather) return null;
    const temperatures = [...element.querySelectorAll('.temp em')].map((value) => Number(value.textContent));
    const precipitation = [...element.querySelectorAll('.precip td')]
      .map((value) => Number(value.textContent.replace(/[^\d]/g, '')))
      .filter(Number.isFinite);
    return {
      time: yahooForecastDate(element.querySelector('.date')?.textContent || ''),
      weather,
      maxTemperature: temperatures[0],
      minTemperature: temperatures[1],
      precipitation: precipitation.length ? Math.max(...precipitation) : 0
    };
  }).filter(Boolean);
  if (!forecasts.length) throw new Error('Yahoo forecast data was not found');

  const now = new Date();
  const hourlyForecast = Array.from({ length: 12 }, (_, index) => {
    const time = new Date(now.getTime() + index * 60 * 60 * 1000);
    const forecast = forecasts.find((item) => item.time.toDateString() === time.toDateString()) || forecasts.at(-1);
    const temperature = time.getHours() >= 7 && time.getHours() < 19
      ? forecast.maxTemperature
      : forecast.minTemperature;
    return {
      time: new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours()),
      weather: forecast.weather,
      precipitation: forecast.precipitation,
      temperature: Number.isFinite(temperature) ? `${temperature}°C` : ''
    };
  });
  const currentForecast = hourlyForecast[0];
  return {
    source: 'Yahoo!天気',
    current: {
      temperature_2m: Number(currentForecast.temperature.replace('°C', '')) || null,
      weather: currentForecast.weather,
      precipitation_probability: currentForecast.precipitation
    },
    hourly: {
      time: hourlyForecast.map((item) => item.time.toISOString()),
      weather: hourlyForecast.map((item) => item.weather),
      precipitation_probability: hourlyForecast.map((item) => item.precipitation),
      temperature: hourlyForecast.map((item) => item.temperature)
    },
    daily: {
      time: forecasts.map((item) => item.time.toISOString()),
      weather: forecasts.map((item) => item.weather),
      temperature_2m_max: forecasts.map((item) => item.maxTemperature),
      temperature_2m_min: forecasts.map((item) => item.minTemperature)
    },
    hourlyForecast
  };
}

async function fetchHourlyForecast(location) {
  const parameters = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    forecast_days: '3',
    timezone: 'Asia/Tokyo'
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`);
  if (!response.ok) throw new Error('Hourly forecast request failed');
  const hourly = (await response.json()).hourly;
  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);
  return hourly.time.map((time, index) => ({
    time: new Date(`${time}:00+09:00`),
    weather: weatherCodes[hourly.weather_code[index]]?.[0] || '情報なし',
    precipitation: hourly.precipitation_probability[index] ?? '--',
    temperature: Number.isFinite(hourly.temperature_2m[index]) ? `${hourly.temperature_2m[index].toFixed(1)}°C` : ''
  })).filter((item) => item.time >= currentHour).slice(0, 12);
}

function getJmaArea(series) {
  return series?.areas?.[0] || {};
}

function getJmaWeatherData(data) {
  const forecast = data[0];
  const dailySeries = forecast.timeSeries.find((series) => series.areas?.some((area) => Array.isArray(area.weathers)));
  const hourlySeries = forecast.timeSeries.find((series) => series.areas?.some((area) => Array.isArray(area.pops)));
  const temperatureSeries = forecast.timeSeries.find((series) => series.areas?.some((area) => Array.isArray(area.temps)));
  const dailyArea = getJmaArea(dailySeries);
  const hourlyArea = getJmaArea(hourlySeries);
  const temperatureArea = getJmaArea(temperatureSeries);
  const dailyTimes = dailySeries?.timeDefines || [];
  const weather = dailyArea.weathers || [];
  const temps = temperatureArea.temps || [];
  const currentTemperature = Number(temps[new Date().getHours() >= 9 ? 1 : 0] ?? temps[0]);
  const weeklyWeatherSeries = data[1]?.timeSeries?.find((series) => series.areas?.some((area) => Array.isArray(area.weatherCodes)));
  const weeklyTemperatureSeries = data[1]?.timeSeries?.find((series) => series.areas?.some((area) => Array.isArray(area.tempsMax)));
  const weeklyWeatherArea = getJmaArea(weeklyWeatherSeries);
  const weeklyTemperatureArea = getJmaArea(weeklyTemperatureSeries);
  const weeklyTimes = weeklyWeatherSeries?.timeDefines || dailyTimes;
  const weeklyWeather = weeklyWeatherArea.weathers
    || (weeklyWeatherArea.weatherCodes || []).map(jmaWeatherText);
  const hourlyTimes = hourlySeries?.timeDefines || dailyTimes;
  const precipitation = hourlyArea.pops || [];
  return {
    current: {
      temperature_2m: Number.isFinite(currentTemperature) ? currentTemperature : null,
      weather: weather[0] || '情報なし',
      precipitation_probability: Number(precipitation[0] || 0)
    },
    hourly: {
      time: dailyTimes,
      weather,
      precipitation_probability: precipitation.slice(0, dailyTimes.length),
      temperature: temps
    },
    daily: {
      time: weeklyTimes,
      weather: weeklyWeather.length ? weeklyWeather : weather,
      temperature_2m_max: weeklyTemperatureArea.tempsMax || temps.filter((_, index) => index % 2 === 1).slice(0, dailyTimes.length),
      temperature_2m_min: weeklyTemperatureArea.tempsMin || temps.filter((_, index) => index % 2 === 0).slice(0, dailyTimes.length)
    }
  };
}

function buildTwelveHourForecast(data) {
  const now = new Date();
  const supplements = data.jwaHourly?.length ? data.jwaHourly : data.hourlyForecast || [];
  const fallbackTemperature = data.current.temperature_2m === null
    ? '--°C'
    : `${data.current.temperature_2m}°C`;
  return Array.from({ length: 12 }, (_, index) => {
    const time = new Date(now.getTime() + index * 60 * 60 * 1000);
    const forecastTime = new Date(time);
    forecastTime.setMinutes(0, 0, 0);
    const closestSupplement = supplements.find((item) => item.time.getTime() === forecastTime.getTime());
    return {
      label: index === 0 ? '現在' : `${String(time.getHours()).padStart(2, '0')}:00`,
      weather: closestSupplement?.weather || data.current.weather || '情報なし',
      precipitation: closestSupplement?.precipitation ?? data.current.precipitation_probability ?? '--',
      temperature: closestSupplement?.temperature || fallbackTemperature
    };
  });
}

function renderHourlyWeather(data) {
  const hourlyItems = buildTwelveHourForecast(data);
  const cards = hourlyItems.map((item) => {
    const temperature = item.temperature || '--';
    return `<div class="hour-card"><div>${item.label}</div><div class="forecast-icon">${jmaWeatherIcon(item.weather)}</div><strong>${temperature}</strong><small>${item.weather} ・ ${item.precipitation}%</small></div>`;
  }).join('');
  document.getElementById('hourly-weather').innerHTML = cards;
}

function renderWeeklyWeather(data) {
  const cards = data.daily.time.map((time, index) => {
    const description = data.daily.weather[index] || '情報なし';
    const fallbackTemperature = index === 0 ? data.current.temperature_2m : '--';
    const maxTemperature = data.daily.temperature_2m_max[index] || fallbackTemperature;
    const minTemperature = data.daily.temperature_2m_min[index] || fallbackTemperature;
    return `<div class="day-card"><div>${index === 0 ? '今日' : formatDay(time)}</div><div class="forecast-icon">${jmaWeatherIcon(description)}</div><strong>${maxTemperature}° / ${minTemperature}°</strong><small>${description}</small></div>`;
  }).join('');
  document.getElementById('weekly-weather').innerHTML = cards;
}

async function resolveWarningArea(location) {
  if (warningArea) return warningArea;
  if (location.name === '東京') {
    warningArea = { code: '130000', name: '東京都' };
    return warningArea;
  }
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}&zoom=10&accept-language=ja`);
    if (!response.ok) throw new Error('Reverse geocoding failed');
    const result = await response.json();
    const prefecture = result.address?.state || '';
    const code = jmaPrefectureCodes[prefecture];
    if (!code) throw new Error('Prefecture not found');
    warningArea = { code, name: prefecture, locality: result.address?.city || result.address?.town || result.address?.village || '' };
  } catch (error) {
    warningArea = { code: '130000', name: '東京都' };
  }
  return warningArea;
}

function collectJmaWarnings(value, warnings = []) {
  if (!value || typeof value !== 'object') return warnings;
  if (Array.isArray(value)) {
    value.forEach((item) => collectJmaWarnings(item, warnings));
    return warnings;
  }
  if (value.warningName && value.status && value.status !== '解除') {
    warnings.push({ name: value.warningName, status: value.status });
  }
  Object.values(value).forEach((item) => collectJmaWarnings(item, warnings));
  return warnings;
}

function updateHazardCard(statusId, detailId, warnings, keyword) {
  const matches = warnings.filter((warning) => warning.name.includes(keyword));
  const status = document.getElementById(statusId);
  const detail = document.getElementById(detailId);
  status.textContent = matches.length ? matches[0].status : '発表なし';
  detail.textContent = matches.length ? matches.map((warning) => warning.name).join('・') : '現在、該当する発表はありません';
}

async function updateJmaWarnings(location) {
  if (updateJmaWarnings.inProgress) return;
  updateJmaWarnings.inProgress = true;
  const ticker = document.getElementById('warning-ticker-track');
  try {
    const area = await resolveWarningArea(location);
    const response = await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${area.code}.json`);
    if (!response.ok) throw new Error('JMA warning request failed');
    const data = await response.json();
    const warnings = collectJmaWarnings(data).filter((warning, index, list) => list.findIndex((item) => item.name === warning.name && item.status === warning.status) === index);
    updateHazardCard('landslide-status', 'landslide-detail', warnings, '土砂');
    updateHazardCard('flood-status', 'flood-detail', warnings, '洪水');
    const message = warnings.length
      ? `${area.name}：${warnings.map((warning) => `${warning.name}（${warning.status}）`).join('　')}`
      : `${area.name}：現在、警報・注意報は発表されていません`;
    ticker.textContent = `気象庁　${message}`;
  } catch (error) {
    ticker.textContent = '気象庁の防災情報を取得できません。公式発表をご確認ください。';
    document.getElementById('landslide-status').textContent = '取得失敗';
    document.getElementById('flood-status').textContent = '取得失敗';
  } finally {
    updateJmaWarnings.inProgress = false;
  }
}

function updateRiskWeather(data) {
  const current = data.current;
  const rainChance = Number(data.hourly.precipitation_probability?.[0] || 0);
  const hourlyForecast = data.jwaHourly?.length ? data.jwaHourly : data.hourlyForecast || [];
  const jwaRainChance = Math.max(0, ...hourlyForecast.map((item) => Number(item.precipitation) || 0));
  const hasJwaStorm = hourlyForecast.some((item) => /雨|雷|雪/.test(item.weather));
  document.getElementById('uv-index').textContent = data.jwaUv?.level || '取得失敗';
  document.getElementById('uv-advice').textContent = data.jwaUv
    ? `日本気象協会: ${data.jwaUv.advice}`
    : '日本気象協会のUV指数を取得できません';
  document.getElementById('storm-status').textContent = hasJwaStorm ? '荒天の見込み' : '発表を確認';
  document.getElementById('storm-detail').textContent = hasJwaStorm
    ? '日本気象協会の時間帯予報で雨・雪を確認'
    : '気象庁の警報・注意報を下部で確認';
  document.getElementById('front-status').textContent = Math.max(rainChance, jwaRainChance) >= 60 ? '雨に注意' : '大きな兆候なし';
  document.getElementById('front-detail').textContent = `気象庁 ${rainChance}% / 日本気象協会 ${jwaRainChance}%`;
  document.getElementById('risk-updated').textContent = `気象庁・日本気象協会 ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 更新`;
}

function formatEarthquakeTime(time) {
  return new Date(time).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function updateEarthquakes() {
  const list = document.getElementById('earthquake-list');
  try {
    const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=4');
    if (!response.ok) throw new Error('Earthquake request failed');
    const items = await response.json();
    list.innerHTML = items.map((item) => {
      const earthquake = item.earthquake || {};
      const magnitude = earthquake.hypocenter?.magnitude;
      const depth = earthquake.hypocenter?.depth;
      const location = earthquake.hypocenter?.name || '震源地不明';
      return `<div class="earthquake-item"><span class="quake-time">${formatEarthquakeTime(item.time)}</span><strong>最大震度 ${earthquake.maxScale ? earthquake.maxScale / 10 : '--'}</strong><span>${location} / M${magnitude ?? '--'}・${depth ?? '--'}km</span></div>`;
    }).join('') || '直近の地震情報はありません';
  } catch (error) {
    list.textContent = '地震情報を取得できません。通信状態を確認してください。';
  }
}

async function updateWeather() {
  if (updateWeather.inProgress) return;
  updateWeather.inProgress = true;
  const location = await getLocation();

  try {
    const area = await resolveWarningArea(location);
    updateJmaWarnings(location);
    let data;
    try {
      const response = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${area.code}.json`);
      if (!response.ok) throw new Error('JMA forecast request failed');
      data = getJmaWeatherData(await response.json());
      data.source = '気象庁';
    } catch (jmaError) {
      data = await fetchYahooForecast(area);
    }
    try {
      data.jwaHourly = await fetchJwaSupplement(area);
    } catch (supplementError) {
      data.jwaHourly = null;
      if (data.source === '気象庁') {
        try {
          const yahooFallback = await fetchYahooForecast(area);
          data.jwaHourly = yahooFallback.hourlyForecast;
          data.jwaFallbackUsed = true;
        } catch (yahooError) {
          data.jwaFallbackUsed = false;
        }
      }
    }
    try {
      data.jwaUv = await fetchJwaUv(area);
    } catch (uvError) {
      try {
        data.jwaUv = await fetchPublishedJwaUv();
      } catch (publishedUvError) {
        data.jwaUv = null;
      }
    }
    try {
      data.hourlyForecast = await fetchHourlyForecast(location);
    } catch (hourlyForecastError) {
      data.hourlyForecast = null;
    }
    const current = data.current;
    const description = current.weather;

    document.getElementById('weather-location').textContent = `${area.name}の${data.source}予報`;
    document.getElementById('weather-place').textContent = area.locality || area.name;
    document.getElementById('weather-icon').textContent = jmaWeatherIcon(description);
    document.getElementById('weather-temperature').textContent = `${current.temperature_2m ?? '--'}°C`;
    document.getElementById('weather-description').textContent = description;
    document.getElementById('weather-details').textContent =
      `${data.source}発表  ・  ${data.jwaFallbackUsed ? 'Yahoo!天気補完' : '日本気象協会補完'}  ・  時間別気温：Open-Meteo  ・  降水確率 ${current.precipitation_probability}%`;
    renderHourlyWeather(data);
    renderWeeklyWeather(data);
    updateRiskWeather(data);
  } catch (error) {
    document.getElementById('weather-location').textContent = '天気情報を取得できません';
    document.getElementById('weather-place').textContent = '現在地を取得できません';
    document.getElementById('weather-description').textContent = 'ネットワーク接続を確認してください';
    document.getElementById('hourly-weather').textContent = '予報を取得できません';
    document.getElementById('weekly-weather').textContent = '予報を取得できません';
  } finally {
    updateWeather.inProgress = false;
  }
}

// 1秒ごとに更新
setInterval(updateClock, 1000);
updateClock();
setupWeatherSlider();
setupCalendarSwipe();
updateWeather();
updateEarthquakes();
setInterval(updateWeather, 60 * 1000);
setInterval(updateEarthquakes, 60 * 1000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateClock();
    updateWeather();
  }
});

window.addEventListener('online', updateWeather);