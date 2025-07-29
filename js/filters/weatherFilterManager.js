/**
 * WeatherFilterManager - Maneja todos los filtros interactivos del dashboard meteorológico
 * Coordina filtros de Plotly y D3.js con sincronización de estado para datos climáticos
 */
class WeatherFilterManager {
  constructor() {
    this.filters = {
      year: 'all',
      month: 'all',
      tempMin: -30,
      tempMax: 50,
      country: 'all',
      seriesVisible: true,
      scaleType: 'linear',
      showOutliers: true,
    };
    this.callbacks = [];
    this.initialized = false;
  }

  /**
   * Inicializa todos los filtros
   */
  init() {
    if (this.initialized) return;

    this.initPlotlyFilters();
    this.initD3Filters();
    this.initialized = true;
    console.log('WeatherFilterManager inicializado');
  }

  /**
   * Inicializa filtros de Plotly
   */
  initPlotlyFilters() {
    // Dropdown de año
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.filters.year = e.target.value;
        this.notifyChange();
      });
    }

    // Dropdown de mes
    const monthSelect = document.getElementById('month-select');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this.filters.month = e.target.value;
        this.notifyChange();
      });
    }

    // Dropdown de país
    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
      countrySelect.addEventListener('change', (e) => {
        this.filters.country = e.target.value;
        this.notifyChange();
      });
    }

    // Sliders de temperatura
    const tempMin = document.getElementById('temp-min');
    const tempMax = document.getElementById('temp-max');
    const tempDisplay = document.getElementById('temp-display');

    if (tempMin && tempMax && tempDisplay) {
      const updateTempFilter = () => {
        this.filters.tempMin = parseInt(tempMin.value);
        this.filters.tempMax = parseInt(tempMax.value);

        // Asegurar que min <= max
        if (this.filters.tempMin > this.filters.tempMax) {
          if (tempMin === document.activeElement) {
            tempMax.value = tempMin.value;
            this.filters.tempMax = this.filters.tempMin;
          } else {
            tempMin.value = tempMax.value;
            this.filters.tempMin = this.filters.tempMax;
          }
        }

        tempDisplay.textContent = `${this.filters.tempMin}°C - ${this.filters.tempMax}°C`;
        this.notifyChange();
      };

      tempMin.addEventListener('input', updateTempFilter);
      tempMax.addEventListener('input', updateTempFilter);
    }
  }

  /**
   * Inicializa controles D3.js
   */
  initD3Filters() {
    // Checkbox para mostrar/ocultar series
    const seriesToggle = document.getElementById('series-toggle');
    if (seriesToggle) {
      seriesToggle.addEventListener('change', (e) => {
        this.filters.seriesVisible = e.target.checked;
        this.notifyChange();
      });
    }

    // Checkbox para mostrar valores atípicos
    const outliersToggle = document.getElementById('show-outliers');
    if (outliersToggle) {
      outliersToggle.addEventListener('change', (e) => {
        this.filters.showOutliers = e.target.checked;
        this.notifyChange();
      });
    }

    // Botones de escala
    const scaleLinear = document.getElementById('scale-linear');
    const scaleLog = document.getElementById('scale-log');

    if (scaleLinear && scaleLog) {
      scaleLinear.addEventListener('click', () => {
        this.filters.scaleType = 'linear';
        scaleLinear.classList.add('active');
        scaleLog.classList.remove('active');
        this.notifyChange();
      });

      scaleLog.addEventListener('click', () => {
        this.filters.scaleType = 'log';
        scaleLog.classList.add('active');
        scaleLinear.classList.remove('active');
        this.notifyChange();
      });
    }
  }

  /**
   * Actualiza las opciones de los filtros basado en los datos meteorológicos
   * @param {Object} metadata - Metadata del dataset
   */
  updateFilterOptions(metadata) {
    if (!metadata) return;

    // Actualizar años disponibles
    this.updateYearOptions(metadata);

    // Actualizar meses disponibles
    this.updateMonthOptions();

    // Actualizar países disponibles
    this.updateCountryOptions(metadata);

    // Actualizar rango de temperaturas
    this.updateTempRange(metadata);
  }

  /**
   * Actualiza opciones de año
   * @param {Object} metadata - Metadata del dataset
   */
  updateYearOptions(metadata) {
    const yearSelect = document.getElementById('year-select');
    if (!yearSelect || !metadata.columnStats.year) return;

    const years = metadata.columnStats.year.uniqueValues || [];

    // Limpiar opciones existentes (excepto "Todos")
    while (yearSelect.children.length > 1) {
      yearSelect.removeChild(yearSelect.lastChild);
    }

    // Agregar años disponibles
    years.sort().forEach((year) => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
  }

  /**
   * Actualiza opciones de mes
   */
  updateMonthOptions() {
    const monthSelect = document.getElementById('month-select');
    if (!monthSelect) return;

    const months = [
      { value: 1, name: 'Enero' },
      { value: 2, name: 'Febrero' },
      { value: 3, name: 'Marzo' },
      { value: 4, name: 'Abril' },
      { value: 5, name: 'Mayo' },
      { value: 6, name: 'Junio' },
      { value: 7, name: 'Julio' },
      { value: 8, name: 'Agosto' },
      { value: 9, name: 'Septiembre' },
      { value: 10, name: 'Octubre' },
      { value: 11, name: 'Noviembre' },
      { value: 12, name: 'Diciembre' },
    ];

    // Limpiar opciones existentes (excepto "Todos")
    while (monthSelect.children.length > 1) {
      monthSelect.removeChild(monthSelect.lastChild);
    }

    // Agregar meses
    months.forEach((month) => {
      const option = document.createElement('option');
      option.value = month.value;
      option.textContent = month.name;
      monthSelect.appendChild(option);
    });
  }

  /**
   * Actualiza opciones de países
   * @param {Object} metadata - Metadata del dataset
   */
  updateCountryOptions(metadata) {
    const countrySelect = document.getElementById('country-select');
    if (!countrySelect || !metadata.columnStats.country) return;

    const countries = metadata.columnStats.country.uniqueValues || [];

    // Limpiar opciones existentes (excepto "Todos")
    while (countrySelect.children.length > 1) {
      countrySelect.removeChild(countrySelect.lastChild);
    }

    // Agregar países disponibles (ordenados alfabéticamente)
    countries.sort().forEach((country) => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      countrySelect.appendChild(option);
    });
  }

  /**
   * Actualiza rango de temperaturas
   * @param {Object} metadata - Metadata del dataset
   */
  updateTempRange(metadata) {
    const tempMin = document.getElementById('temp-min');
    const tempMax = document.getElementById('temp-max');
    const tempDisplay = document.getElementById('temp-display');

    if (!tempMin || !tempMax || !tempDisplay) return;

    const tempStats = metadata.columnStats.temperature_celsius;
    if (!tempStats) return;

    const min = Math.floor(tempStats.min || -30);
    const max = Math.ceil(tempStats.max || 50);

    tempMin.min = min;
    tempMin.max = max;
    tempMin.value = min;

    tempMax.min = min;
    tempMax.max = max;
    tempMax.value = max;

    this.filters.tempMin = min;
    this.filters.tempMax = max;

    tempDisplay.textContent = `${min}°C - ${max}°C`;
  }

  /**
   * Obtiene los filtros actuales
   * @returns {Object} Filtros activos
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * Aplica filtros a los datos meteorológicos
   * @param {Array} data - Datos originales
   * @returns {Array} Datos filtrados
   */
  applyFilters(data) {
    if (!data || data.length === 0) return [];

    let filteredData = [...data];

    // Filtro de año
    if (this.filters.year !== 'all') {
      filteredData = filteredData.filter(
        (row) => row.year == this.filters.year
      );
    }

    // Filtro de mes
    if (this.filters.month !== 'all') {
      filteredData = filteredData.filter(
        (row) => row.month == this.filters.month
      );
    }

    // Filtro de país
    if (this.filters.country !== 'all') {
      filteredData = filteredData.filter(
        (row) => row.country === this.filters.country
      );
    }

    // Filtro de rango de temperatura
    filteredData = filteredData.filter((row) => {
      const temp = row.temperature_celsius || 0;
      return temp >= this.filters.tempMin && temp <= this.filters.tempMax;
    });

    // Filtro de valores atípicos (si está desactivado, remover extremos)
    if (!this.filters.showOutliers) {
      const temps = filteredData.map((row) => row.temperature_celsius || 0);
      const q1 = this.calculateQuantile(temps, 0.25);
      const q3 = this.calculateQuantile(temps, 0.75);
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      filteredData = filteredData.filter((row) => {
        const temp = row.temperature_celsius || 0;
        return temp >= lowerBound && temp <= upperBound;
      });
    }

    console.log(
      `Filtros aplicados: ${data.length} → ${filteredData.length} registros meteorológicos`
    );
    return filteredData;
  }

  /**
   * Calcula cuantiles para detección de valores atípicos
   * @param {Array} values - Valores numéricos
   * @param {number} quantile - Cuantil a calcular (0-1)
   * @returns {number} Valor del cuantil
   */
  calculateQuantile(values, quantile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = quantile * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Registra un callback para cambios de filtros
   * @param {Function} callback - Función a ejecutar cuando cambien los filtros
   */
  onFilterChange(callback) {
    if (typeof callback === 'function') {
      this.callbacks.push(callback);
    }
  }

  /**
   * Notifica a todos los callbacks sobre cambios en filtros
   */
  notifyChange() {
    console.log('Filtros meteorológicos actualizados:', this.filters);

    // Debounce para evitar demasiadas actualizaciones
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.callbacks.forEach((callback) => {
        try {
          callback(this.filters);
        } catch (error) {
          console.error('Error en callback de filtro meteorológico:', error);
        }
      });
    }, 300);
  }

  /**
   * Resetea todos los filtros a sus valores por defecto
   */
  resetFilters() {
    this.filters = {
      year: 'all',
      month: 'all',
      tempMin: -30,
      tempMax: 50,
      country: 'all',
      seriesVisible: true,
      scaleType: 'linear',
      showOutliers: true,
    };

    // Actualizar UI
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const countrySelect = document.getElementById('country-select');
    const tempMin = document.getElementById('temp-min');
    const tempMax = document.getElementById('temp-max');
    const seriesToggle = document.getElementById('series-toggle');
    const outliersToggle = document.getElementById('show-outliers');
    const scaleLinear = document.getElementById('scale-linear');
    const scaleLog = document.getElementById('scale-log');

    if (yearSelect) yearSelect.value = 'all';
    if (monthSelect) monthSelect.value = 'all';
    if (countrySelect) countrySelect.value = 'all';
    if (tempMin) tempMin.value = this.filters.tempMin;
    if (tempMax) tempMax.value = this.filters.tempMax;
    if (seriesToggle) seriesToggle.checked = this.filters.seriesVisible;
    if (outliersToggle) outliersToggle.checked = this.filters.showOutliers;

    if (scaleLinear && scaleLog) {
      scaleLinear.classList.add('active');
      scaleLog.classList.remove('active');
    }

    this.notifyChange();
  }

  /**
   * Obtiene estadísticas de los datos filtrados
   * @param {Array} filteredData - Datos después de aplicar filtros
   * @returns {Object} Estadísticas meteorológicas
   */
  getFilteredStats(filteredData) {
    if (!filteredData || filteredData.length === 0) {
      return {
        count: 0,
        avgTemp: 0,
        avgHumidity: 0,
        countries: [],
        conditions: [],
      };
    }

    const avgTemp =
      filteredData.reduce(
        (sum, row) => sum + (row.temperature_celsius || 0),
        0
      ) / filteredData.length;
    const avgHumidity =
      filteredData.reduce((sum, row) => sum + (row.humidity || 0), 0) /
      filteredData.length;
    const countries = [...new Set(filteredData.map((row) => row.country))];
    const conditions = [
      ...new Set(filteredData.map((row) => row.condition_text)),
    ];

    return {
      count: filteredData.length,
      avgTemp: avgTemp.toFixed(1),
      avgHumidity: avgHumidity.toFixed(1),
      countries: countries.length,
      conditions: conditions.length,
    };
  }

  /**
   * Exporta la configuración actual de filtros
   * @returns {string} JSON con la configuración
   */
  exportConfig() {
    return JSON.stringify(this.filters, null, 2);
  }

  /**
   * Importa una configuración de filtros
   * @param {string} configJson - JSON con la configuración
   */
  importConfig(configJson) {
    try {
      const config = JSON.parse(configJson);
      this.filters = { ...this.filters, ...config };
      this.updateUI();
      this.notifyChange();
    } catch (error) {
      console.error(
        'Error importando configuración de filtros meteorológicos:',
        error
      );
    }
  }

  /**
   * Actualiza la UI para reflejar los filtros actuales
   */
  updateUI() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const countrySelect = document.getElementById('country-select');
    const tempMin = document.getElementById('temp-min');
    const tempMax = document.getElementById('temp-max');
    const tempDisplay = document.getElementById('temp-display');
    const seriesToggle = document.getElementById('series-toggle');
    const outliersToggle = document.getElementById('show-outliers');
    const scaleLinear = document.getElementById('scale-linear');
    const scaleLog = document.getElementById('scale-log');

    if (yearSelect) yearSelect.value = this.filters.year;
    if (monthSelect) monthSelect.value = this.filters.month;
    if (countrySelect) countrySelect.value = this.filters.country;
    if (tempMin) tempMin.value = this.filters.tempMin;
    if (tempMax) tempMax.value = this.filters.tempMax;
    if (tempDisplay)
      tempDisplay.textContent = `${this.filters.tempMin}°C - ${this.filters.tempMax}°C`;
    if (seriesToggle) seriesToggle.checked = this.filters.seriesVisible;
    if (outliersToggle) outliersToggle.checked = this.filters.showOutliers;

    if (scaleLinear && scaleLog) {
      if (this.filters.scaleType === 'linear') {
        scaleLinear.classList.add('active');
        scaleLog.classList.remove('active');
      } else {
        scaleLog.classList.add('active');
        scaleLinear.classList.remove('active');
      }
    }
  }

  /**
   * Obtiene un resumen de los filtros activos
   * @returns {string} Descripción de filtros activos
   */
  getActiveFiltersDescription() {
    const active = [];

    if (this.filters.year !== 'all') {
      active.push(`Año: ${this.filters.year}`);
    }

    if (this.filters.month !== 'all') {
      const monthNames = [
        '',
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];
      active.push(`📆 Mes: ${monthNames[this.filters.month]}`);
    }

    if (this.filters.country !== 'all') {
      active.push(`País: ${this.filters.country}`);
    }

    if (this.filters.tempMin > -30 || this.filters.tempMax < 50) {
      active.push(
        `Temperatura: ${this.filters.tempMin}°C - ${this.filters.tempMax}°C`
      );
    }

    if (!this.filters.seriesVisible) {
      active.push('Series ocultas');
    }

    if (this.filters.scaleType === 'log') {
      active.push('📏 Escala logarítmica');
    }

    if (!this.filters.showOutliers) {
      active.push('🎯 Sin valores atípicos');
    }

    return active.length > 0 ? active.join(', ') : 'Sin filtros activos';
  }

  /**
   * Obtiene sugerencias de filtros basadas en los datos
   * @param {Array} data - Datos del dataset
   * @returns {Object} Sugerencias de filtros
   */
  getFilterSuggestions(data) {
    if (!data || data.length === 0) return {};

    // Encontrar países con más datos
    const countryCounts = {};
    data.forEach((row) => {
      const country = row.country;
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country]) => country);

    // Encontrar rangos de temperatura más comunes
    const temps = data.map((row) => row.temperature_celsius || 0);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const tempStd = Math.sqrt(
      temps.reduce((sq, n) => sq + Math.pow(n - avgTemp, 2), 0) / temps.length
    );

    return {
      topCountries,
      suggestedTempRange: {
        min: Math.round(avgTemp - tempStd),
        max: Math.round(avgTemp + tempStd),
      },
      totalRecords: data.length,
      avgTemperature: avgTemp.toFixed(1),
    };
  }
}

// Instancia global del manejador de filtros meteorológicos
window.weatherFilterManager = new WeatherFilterManager();
