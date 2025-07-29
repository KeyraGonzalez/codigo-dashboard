/**
 * WeatherDataProcessor - Procesa y transforma datos meteorológicos para diferentes tipos de visualizaciones
 */
class WeatherDataProcessor {
  constructor() {
    this.data = null;
  }

  /**
   * Establece los datos a procesar
   * @param {Array} data - Datos a procesar
   */
  setData(data) {
    this.data = data;
  }

  /**
   * Prepara datos para gráfico combinado (barras + línea)
   * Temperatura promedio por mes (barras) + Humedad promedio (línea)
   * @param {Array} data - Datos filtrados
   * @returns {Object} Datos formateados para Plotly
   */
  prepareComboChartData(data = this.data) {
    if (!data || data.length === 0) return { x: [], y1: [], y2: [] };

    // Agrupar por mes
    const monthlyData = {};
    data.forEach((row) => {
      const month = row.month || 1;
      const key = `Mes ${month}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { temp: [], humidity: [], count: 0 };
      }
      monthlyData[key].temp.push(row.temperature_celsius || 0);
      monthlyData[key].humidity.push(row.humidity || 0);
      monthlyData[key].count += 1;
    });

    const sortedKeys = Object.keys(monthlyData).sort((a, b) => {
      const monthA = parseInt(a.split(' ')[1]);
      const monthB = parseInt(b.split(' ')[1]);
      return monthA - monthB;
    });

    return {
      x: sortedKeys,
      y1: sortedKeys.map((key) => {
        const temps = monthlyData[key].temp;
        return temps.reduce((a, b) => a + b, 0) / temps.length;
      }),
      y2: sortedKeys.map((key) => {
        const humidities = monthlyData[key].humidity;
        return humidities.reduce((a, b) => a + b, 0) / humidities.length;
      }),
      labels: sortedKeys,
    };
  }

  /**
   * Prepara datos para gráfico de cascada
   * Cambios de temperatura por trimestre
   * @param {Array} data - Datos filtrados
   * @returns {Object} Datos formateados para cascada
   */
  prepareWaterfallData(data = this.data) {
    if (!data || data.length === 0) return { x: [], y: [], measure: [] };

    // Agrupar por trimestre
    const quarterlyData = {};
    data.forEach((row) => {
      const quarter = row.quarter || Math.ceil((row.month || 1) / 3);
      const key = `Q${quarter}`;
      if (!quarterlyData[key]) {
        quarterlyData[key] = [];
      }
      quarterlyData[key].push(row.temperature_celsius || 0);
    });

    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const avgTemps = quarters.map((q) => {
      const temps = quarterlyData[q] || [0];
      return temps.reduce((a, b) => a + b, 0) / temps.length;
    });

    // Calcular diferencias
    const x = ['Inicial', ...quarters, 'Total'];
    const y = [0];
    const measure = ['absolute'];

    let cumulative = 0;
    for (let i = 0; i < avgTemps.length; i++) {
      const diff = i === 0 ? avgTemps[i] : avgTemps[i] - avgTemps[i - 1];
      y.push(diff);
      measure.push('relative');
      cumulative += avgTemps[i];
    }

    y.push(cumulative / 4); // Promedio anual
    measure.push('total');

    return { x, y, measure };
  }

  /**
   * Prepara datos para treemap
   * Países organizados por temperatura promedio
   * @param {Array} data - Datos filtrados
   * @returns {Object} Datos jerárquicos para treemap
   */
  prepareTreemapData(data = this.data) {
    if (!data || data.length === 0)
      return { labels: [], parents: [], values: [] };

    // Agrupar por país y calcular temperatura promedio
    const countryData = {};
    data.forEach((row) => {
      const country = row.country || 'Unknown';
      if (!countryData[country]) {
        countryData[country] = { temps: [], count: 0 };
      }
      countryData[country].temps.push(row.temperature_celsius || 0);
      countryData[country].count += 1;
    });

    // Calcular promedios y categorizar por temperatura
    const tempCategories = {
      'Muy Frío': { countries: [], temps: [] },
      Frío: { countries: [], temps: [] },
      Templado: { countries: [], temps: [] },
      Cálido: { countries: [], temps: [] },
      'Muy Cálido': { countries: [], temps: [] },
    };

    Object.entries(countryData).forEach(([country, data]) => {
      const avgTemp = data.temps.reduce((a, b) => a + b, 0) / data.temps.length;
      let category;

      if (avgTemp < 0) category = 'Muy Frío';
      else if (avgTemp < 10) category = 'Frío';
      else if (avgTemp < 20) category = 'Templado';
      else if (avgTemp < 30) category = 'Cálido';
      else category = 'Muy Cálido';

      tempCategories[category].countries.push(country);
      tempCategories[category].temps.push(avgTemp);
    });

    const labels = ['Mundo'];
    const parents = [''];
    const values = [Object.keys(countryData).length];

    // Agregar categorías
    Object.entries(tempCategories).forEach(([category, data]) => {
      if (data.countries.length > 0) {
        labels.push(category);
        parents.push('Mundo');
        values.push(data.countries.length);

        // Agregar países (solo los primeros 20 por categoría para evitar sobrecarga)
        data.countries.slice(0, 20).forEach((country, index) => {
          labels.push(`${country} (${data.temps[index].toFixed(1)}°C)`);
          parents.push(category);
          values.push(1);
        });
      }
    });

    return { labels, parents, values };
  }

  /**
   * Prepara datos para diagrama de Sankey
   * Flujo de condiciones climáticas por región
   * @param {Array} data - Datos filtrados
   * @returns {Object} Nodos y enlaces para Sankey
   */
  prepareSankeyData(data = this.data) {
    if (!data || data.length === 0) return { nodes: [], links: [] };

    const nodes = new Set();
    const linkMap = {};

    // Crear regiones basadas en continentes (simplificado)
    const getRegion = (country) => {
      const regions = {
        Europe: [
          'Albania',
          'Andorra',
          'Austria',
          'Belgium',
          'Bulgaria',
          'Croatia',
          'Cyprus',
          'Czech Republic',
          'Denmark',
          'Estonia',
          'Finland',
          'France',
          'Germany',
          'Greece',
          'Hungary',
          'Iceland',
          'Ireland',
          'Italy',
          'Latvia',
          'Lithuania',
          'Luxembourg',
          'Malta',
          'Netherlands',
          'Norway',
          'Poland',
          'Portugal',
          'Romania',
          'Slovakia',
          'Slovenia',
          'Spain',
          'Sweden',
          'Switzerland',
          'United Kingdom',
        ],
        Asia: [
          'Afghanistan',
          'Armenia',
          'Azerbaijan',
          'Bahrain',
          'Bangladesh',
          'Bhutan',
          'Brunei',
          'Cambodia',
          'China',
          'Georgia',
          'India',
          'Indonesia',
          'Iran',
          'Iraq',
          'Israel',
          'Japan',
          'Jordan',
          'Kazakhstan',
          'Kuwait',
          'Kyrgyzstan',
          'Laos',
          'Lebanon',
          'Malaysia',
          'Maldives',
          'Mongolia',
          'Myanmar',
          'Nepal',
          'North Korea',
          'Oman',
          'Pakistan',
          'Philippines',
          'Qatar',
          'Russia',
          'Saudi Arabia',
          'Singapore',
          'South Korea',
          'Sri Lanka',
          'Syria',
          'Taiwan',
          'Tajikistan',
          'Thailand',
          'Turkey',
          'Turkmenistan',
          'United Arab Emirates',
          'Uzbekistan',
          'Vietnam',
          'Yemen',
        ],
        Africa: [
          'Algeria',
          'Angola',
          'Benin',
          'Botswana',
          'Burkina Faso',
          'Burundi',
          'Cameroon',
          'Cape Verde',
          'Central African Republic',
          'Chad',
          'Comoros',
          'Democratic Republic of the Congo',
          'Republic of the Congo',
          'Djibouti',
          'Egypt',
          'Equatorial Guinea',
          'Eritrea',
          'Ethiopia',
          'Gabon',
          'Gambia',
          'Ghana',
          'Guinea',
          'Guinea-Bissau',
          'Ivory Coast',
          'Kenya',
          'Lesotho',
          'Liberia',
          'Libya',
          'Madagascar',
          'Malawi',
          'Mali',
          'Mauritania',
          'Mauritius',
          'Morocco',
          'Mozambique',
          'Namibia',
          'Niger',
          'Nigeria',
          'Rwanda',
          'Sao Tome and Principe',
          'Senegal',
          'Seychelles',
          'Sierra Leone',
          'Somalia',
          'South Africa',
          'South Sudan',
          'Sudan',
          'Swaziland',
          'Tanzania',
          'Togo',
          'Tunisia',
          'Uganda',
          'Zambia',
          'Zimbabwe',
        ],
        'North America': ['Canada', 'United States', 'Mexico'],
        'South America': [
          'Argentina',
          'Bolivia',
          'Brazil',
          'Chile',
          'Colombia',
          'Ecuador',
          'Guyana',
          'Paraguay',
          'Peru',
          'Suriname',
          'Uruguay',
          'Venezuela',
        ],
        Oceania: [
          'Australia',
          'Fiji',
          'New Zealand',
          'Papua New Guinea',
          'Solomon Islands',
          'Vanuatu',
        ],
      };

      for (const [region, countries] of Object.entries(regions)) {
        if (countries.includes(country)) return region;
      }
      return 'Other';
    };

    data.forEach((row) => {
      const region = getRegion(row.country);
      const condition = row.condition_text || 'Unknown';

      nodes.add(region);
      nodes.add(condition);

      const linkKey = `${region}->${condition}`;
      if (!linkMap[linkKey]) {
        linkMap[linkKey] = 0;
      }
      linkMap[linkKey] += 1;
    });

    const nodeArray = Array.from(nodes);
    const nodeMap = {};
    nodeArray.forEach((node, index) => {
      nodeMap[node] = index;
    });

    const links = Object.entries(linkMap).map(([key, value]) => {
      const [source, target] = key.split('->');
      return {
        source: nodeMap[source],
        target: nodeMap[target],
        value: value,
      };
    });

    return {
      nodes: nodeArray.map((label) => ({ label })),
      links: links,
    };
  }

  /**
   * Prepara datos para gráfico de enjambre (swarm plot)
   * Distribución de temperaturas por condición climática
   * @param {Array} data - Datos filtrados
   * @returns {Object} Datos para swarm plot
   */
  prepareSwarmData(data = this.data) {
    if (!data || data.length === 0) return {};

    // Obtener las condiciones más comunes (top 8)
    const conditionCounts = {};
    data.forEach((row) => {
      const condition = row.condition_text || 'Unknown';
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });

    const topConditions = Object.entries(conditionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([condition]) => condition);

    const result = {};

    topConditions.forEach((condition) => {
      const conditionData = data.filter(
        (row) => row.condition_text === condition
      );
      // Tomar una muestra para evitar sobrecarga visual
      const sampleData = conditionData.slice(0, 200);

      result[condition] = {
        x: sampleData.map(() => condition),
        y: sampleData.map((row) => row.temperature_celsius || 0),
        text: sampleData.map(
          (row) =>
            `${row.country}<br>Temp: ${row.temperature_celsius}°C<br>Humedad: ${row.humidity}%`
        ),
      };
    });

    return result;
  }

  /**
   * Prepara datos para mapa geográfico
   * Temperaturas promedio por país
   * @param {Array} data - Datos filtrados
   * @returns {Object} Datos geográficos
   */
  prepareGeoData(data = this.data) {
    if (!data || data.length === 0) return { locations: [], z: [], text: [] };

    const countryData = {};
    data.forEach((row) => {
      const country = row.country;
      if (!countryData[country]) {
        countryData[country] = { temps: [], humidity: [], count: 0 };
      }
      countryData[country].temps.push(row.temperature_celsius || 0);
      countryData[country].humidity.push(row.humidity || 0);
      countryData[country].count += 1;
    });

    return {
      locations: Object.keys(countryData),
      z: Object.values(countryData).map((d) => {
        return d.temps.reduce((a, b) => a + b, 0) / d.temps.length;
      }),
      text: Object.entries(countryData).map(([country, data]) => {
        const avgTemp =
          data.temps.reduce((a, b) => a + b, 0) / data.temps.length;
        const avgHumidity =
          data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length;
        return `${country}<br>Temp: ${avgTemp.toFixed(
          1
        )}°C<br>Humedad: ${avgHumidity.toFixed(1)}%<br>Registros: ${
          data.count
        }`;
      }),
      countries: Object.keys(countryData),
    };
  }

  /**
   * Prepara datos para gráfico de embudo
   * Distribución de condiciones climáticas
   * @param {Array} data - Datos filtrados
   * @returns {Object} Datos para funnel
   */
  prepareFunnelData(data = this.data) {
    if (!data || data.length === 0) return { x: [], y: [] };

    // Contar condiciones climáticas
    const conditionCounts = {};
    data.forEach((row) => {
      const condition = row.condition_text || 'Unknown';
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });

    // Ordenar por frecuencia y tomar las top 7
    const sortedConditions = Object.entries(conditionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7);

    return {
      x: sortedConditions.map(([, count]) => count),
      y: sortedConditions.map(([condition]) => condition),
    };
  }

  /**
   * Prepara datos para gráfico radar
   * Comparación de métricas climáticas por región
   * @param {Array} data - Datos filtrados
   * @returns {Object} Datos para radar chart
   */
  prepareRadarData(data = this.data) {
    if (!data || data.length === 0) return {};

    // Definir regiones principales
    const getRegion = (country) => {
      const regions = {
        Europe: [
          'Albania',
          'Andorra',
          'Austria',
          'Belgium',
          'Bulgaria',
          'Croatia',
          'Cyprus',
          'Czech Republic',
          'Denmark',
          'Estonia',
          'Finland',
          'France',
          'Germany',
          'Greece',
          'Hungary',
          'Iceland',
          'Ireland',
          'Italy',
          'Latvia',
          'Lithuania',
          'Luxembourg',
          'Malta',
          'Netherlands',
          'Norway',
          'Poland',
          'Portugal',
          'Romania',
          'Slovakia',
          'Slovenia',
          'Spain',
          'Sweden',
          'Switzerland',
          'United Kingdom',
        ],
        Asia: [
          'Afghanistan',
          'Armenia',
          'Azerbaijan',
          'Bahrain',
          'Bangladesh',
          'Bhutan',
          'Brunei',
          'Cambodia',
          'China',
          'Georgia',
          'India',
          'Indonesia',
          'Iran',
          'Iraq',
          'Israel',
          'Japan',
          'Jordan',
          'Kazakhstan',
          'Kuwait',
          'Kyrgyzstan',
          'Laos',
          'Lebanon',
          'Malaysia',
          'Maldives',
          'Mongolia',
          'Myanmar',
          'Nepal',
          'North Korea',
          'Oman',
          'Pakistan',
          'Philippines',
          'Qatar',
          'Russia',
          'Saudi Arabia',
          'Singapore',
          'South Korea',
          'Sri Lanka',
          'Syria',
          'Taiwan',
          'Tajikistan',
          'Thailand',
          'Turkey',
          'Turkmenistan',
          'United Arab Emirates',
          'Uzbekistan',
          'Vietnam',
          'Yemen',
        ],
        Africa: [
          'Algeria',
          'Angola',
          'Benin',
          'Botswana',
          'Burkina Faso',
          'Burundi',
          'Cameroon',
          'Cape Verde',
          'Central African Republic',
          'Chad',
          'Comoros',
          'Democratic Republic of the Congo',
          'Republic of the Congo',
          'Djibouti',
          'Egypt',
          'Equatorial Guinea',
          'Eritrea',
          'Ethiopia',
          'Gabon',
          'Gambia',
          'Ghana',
          'Guinea',
          'Guinea-Bissau',
          'Ivory Coast',
          'Kenya',
          'Lesotho',
          'Liberia',
          'Libya',
          'Madagascar',
          'Malawi',
          'Mali',
          'Mauritania',
          'Mauritius',
          'Morocco',
          'Mozambique',
          'Namibia',
          'Niger',
          'Nigeria',
          'Rwanda',
          'Sao Tome and Principe',
          'Senegal',
          'Seychelles',
          'Sierra Leone',
          'Somalia',
          'South Africa',
          'South Sudan',
          'Sudan',
          'Swaziland',
          'Tanzania',
          'Togo',
          'Tunisia',
          'Uganda',
          'Zambia',
          'Zimbabwe',
        ],
        Americas: [
          'Canada',
          'United States',
          'Mexico',
          'Argentina',
          'Bolivia',
          'Brazil',
          'Chile',
          'Colombia',
          'Ecuador',
          'Guyana',
          'Paraguay',
          'Peru',
          'Suriname',
          'Uruguay',
          'Venezuela',
        ],
        Oceania: [
          'Australia',
          'Fiji',
          'New Zealand',
          'Papua New Guinea',
          'Solomon Islands',
          'Vanuatu',
        ],
      };

      for (const [region, countries] of Object.entries(regions)) {
        if (countries.includes(country)) return region;
      }
      return 'Other';
    };

    const regionData = {};
    data.forEach((row) => {
      const region = getRegion(row.country);
      if (!regionData[region]) {
        regionData[region] = {
          temperature: [],
          humidity: [],
          pressure: [],
          wind_speed: [],
          uv_index: [],
        };
      }
      regionData[region].temperature.push(row.temperature_celsius || 0);
      regionData[region].humidity.push(row.humidity || 0);
      regionData[region].pressure.push(row.pressure_mb || 0);
      regionData[region].wind_speed.push(row.wind_kph || 0);
      regionData[region].uv_index.push(row.uv_index || 0);
    });

    const metrics = ['Temperatura', 'Humedad', 'Presión', 'Viento', 'UV'];
    const result = {};

    Object.entries(regionData).forEach(([region, data]) => {
      const values = [
        data.temperature.reduce((a, b) => a + b, 0) / data.temperature.length,
        (data.humidity.reduce((a, b) => a + b, 0) /
          data.humidity.length /
          100) *
          50, // Normalizar
        (data.pressure.reduce((a, b) => a + b, 0) / data.pressure.length -
          1000) /
          10, // Normalizar
        data.wind_speed.reduce((a, b) => a + b, 0) / data.wind_speed.length,
        (data.uv_index.reduce((a, b) => a + b, 0) / data.uv_index.length) * 5, // Normalizar
      ];

      result[region] = {
        r: values,
        theta: metrics,
        name: region,
      };
    });

    return result;
  }

  /**
   * Calcula matriz de correlación
   * @param {Array} data - Datos filtrados
   * @returns {Object} Matriz de correlación
   */
  calculateCorrelationMatrix(data = this.data) {
    if (!data || data.length === 0) return { x: [], y: [], z: [] };

    const numericColumns = [
      'temperature_celsius',
      'humidity',
      'pressure_mb',
      'wind_kph',
      'uv_index',
    ];
    const matrix = [];

    numericColumns.forEach((col1) => {
      const row = [];
      numericColumns.forEach((col2) => {
        const correlation = this.calculateCorrelation(data, col1, col2);
        row.push(correlation);
      });
      matrix.push(row);
    });

    return {
      x: ['Temperatura', 'Humedad', 'Presión', 'Viento', 'UV'],
      y: ['Temperatura', 'Humedad', 'Presión', 'Viento', 'UV'],
      z: matrix,
    };
  }

  /**
   * Calcula correlación entre dos variables
   * @param {Array} data - Datos
   * @param {string} x - Variable X
   * @param {string} y - Variable Y
   * @returns {number} Coeficiente de correlación
   */
  calculateCorrelation(data, x, y) {
    const pairs = data
      .filter((row) => row[x] != null && row[y] != null)
      .map((row) => [row[x], row[y]]);

    if (pairs.length < 2) return 0;

    const n = pairs.length;
    const sumX = pairs.reduce((sum, pair) => sum + pair[0], 0);
    const sumY = pairs.reduce((sum, pair) => sum + pair[1], 0);
    const sumXY = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0);
    const sumX2 = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0);
    const sumY2 = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Prepara datos para análisis de Pareto
   * @param {Array} data - Datos filtrados
   * @param {string} category - Columna de categoría
   * @param {string} value - Columna de valor
   * @returns {Object} Datos para Pareto
   */
  prepareParetoData(
    data = this.data,
    category = 'country',
    value = 'temperature_celsius'
  ) {
    if (!data || data.length === 0)
      return { categories: [], values: [], cumulative: [] };

    // Agrupar y promediar por categoría
    const grouped = {};
    data.forEach((row) => {
      const cat = row[category];
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(row[value] || 0);
    });

    // Calcular promedios y ordenar
    const averaged = Object.entries(grouped).map(([cat, values]) => [
      cat,
      values.reduce((a, b) => a + b, 0) / values.length,
    ]);

    const sorted = averaged.sort(([, a], [, b]) => b - a).slice(0, 20); // Top 20

    const total = sorted.reduce((sum, [, val]) => sum + Math.abs(val), 0);
    let cumulative = 0;

    const result = {
      categories: [],
      values: [],
      cumulative: [],
      percentages: [],
    };

    sorted.forEach(([cat, val]) => {
      cumulative += Math.abs(val);
      result.categories.push(cat);
      result.values.push(val);
      result.cumulative.push((cumulative / total) * 100);
      result.percentages.push((Math.abs(val) / total) * 100);
    });

    return result;
  }

  /**
   * Prepara datos para gráfico de densidad (KDE)
   * @param {Array} data - Datos filtrados
   * @param {string} column - Columna para análisis de densidad
   * @returns {Object} Datos para KDE
   */
  prepareKDEData(data = this.data, column = 'temperature_celsius') {
    if (!data || data.length === 0) return { x: [], y: [] };

    const values = data
      .map((row) => row[column])
      .filter((val) => typeof val === 'number' && !isNaN(val))
      .sort((a, b) => a - b);

    if (values.length === 0) return { x: [], y: [] };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const bandwidth = this.calculateBandwidth(values);

    // Generar puntos para la curva de densidad
    const points = 100;
    const step = (max - min) / points;
    const x = [];
    const y = [];

    for (let i = 0; i <= points; i++) {
      const xi = min + i * step;
      x.push(xi);

      // Calcular densidad usando kernel gaussiano
      let density = 0;
      values.forEach((value) => {
        const u = (xi - value) / bandwidth;
        density += Math.exp(-0.5 * u * u);
      });

      density = density / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
      y.push(density);
    }

    return { x, y, values };
  }

  /**
   * Calcula el ancho de banda óptimo para KDE
   * @param {Array} values - Valores numéricos
   * @returns {number} Ancho de banda
   */
  calculateBandwidth(values) {
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    // Regla de Scott
    return 1.06 * stdDev * Math.pow(n, -1 / 5);
  }
}

// Instancia global del procesador de datos meteorológicos
window.weatherDataProcessor = new WeatherDataProcessor();
