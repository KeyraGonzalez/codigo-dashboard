/**
 * WeatherDataLoader - Maneja la carga y validación del dataset de clima global
 * Cumple con los requisitos de al menos 5 columnas numéricas y 2 categóricas
 */
class WeatherDataLoader {
  constructor() {
    this.dataset = null;
    this.metadata = null;
  }

  /**
   * Carga el dataset desde una URL o archivo local
   * @param {string} source - URL o ruta del archivo
   * @returns {Promise<Object>} Dataset cargado y validado
   */
  async loadDataset(source = 'data/weather_data.json') {
    try {
      console.log('Cargando dataset de clima global desde:', source);

      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        '✅ Datos cargados:',
        data.length,
        'registros meteorológicos'
      );

      // Validar estructura del dataset
      this.validateDataset(data);

      // Procesar y enriquecer datos
      this.dataset = this.enrichData(data);
      this.generateMetadata();

      console.log('✅ Dataset de clima validado y procesado exitosamente');
      return {
        data: this.dataset,
        metadata: this.metadata,
      };
    } catch (error) {
      console.error('❌ Error cargando dataset de clima:', error);
      throw new Error(`Error al cargar dataset de clima: ${error.message}`);
    }
  }

  /**
   * Valida que el dataset cumpla con los requisitos mínimos
   * @param {Array} data - Datos a validar
   */
  validateDataset(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('El dataset debe ser un array no vacío');
    }

    if (data.length < 100) {
      console.warn(
        `Dataset tiene ${data.length} filas, se recomienda mínimo 100`
      );
    }

    const firstRow = data[0];
    const columns = Object.keys(firstRow);

    // Identificar tipos de columnas específicas del dataset de clima
    const numericalColumns = [
      'latitude',
      'longitude',
      'temperature_celsius',
      'temperature_fahrenheit',
      'wind_mph',
      'wind_kph',
      'wind_degree',
      'pressure_mb',
      'pressure_in',
      'precip_mm',
      'precip_in',
      'humidity',
      'cloud',
      'feels_like_celsius',
      'feels_like_fahrenheit',
      'visibility_km',
      'visibility_miles',
      'uv_index',
      'gust_mph',
      'gust_kph',
      'air_quality_Carbon_Monoxide',
      'air_quality_Ozone',
      'air_quality_Nitrogen_dioxide',
      'air_quality_PM2.5',
      'air_quality_PM10',
      'moon_illumination',
      'year',
      'month',
      'day',
      'hour',
      'quarter',
    ].filter((col) => columns.includes(col));

    const categoricalColumns = [
      'country',
      'location_name',
      'timezone',
      'condition_text',
      'wind_direction',
      'moon_phase',
      'temp_category',
      'humidity_category',
      'wind_category',
    ].filter((col) => columns.includes(col));

    console.log('🌡️ Columnas numéricas encontradas:', numericalColumns.length);
    console.log(
      '🌍 Columnas categóricas encontradas:',
      categoricalColumns.length
    );

    if (numericalColumns.length < 5) {
      throw new Error(
        `Se requieren al menos 5 columnas numéricas, encontradas: ${numericalColumns.length}`
      );
    }

    if (categoricalColumns.length < 2) {
      throw new Error(
        `Se requieren al menos 2 columnas categóricas, encontradas: ${categoricalColumns.length}`
      );
    }

    this.columnTypes = {
      numerical: numericalColumns,
      categorical: categoricalColumns,
    };
  }

  /**
   * Enriquece los datos con campos calculados adicionales
   * @param {Array} data - Datos originales
   * @returns {Array} Datos enriquecidos
   */
  enrichData(data) {
    return data.map((row, index) => {
      const enrichedRow = { ...row };

      // Agregar índice si no existe
      if (!enrichedRow.id) {
        enrichedRow.id = index + 1;
      }

      // Calcular índice de confort térmico
      if (row.temperature_celsius && row.humidity) {
        const temp = row.temperature_celsius;
        const humidity = row.humidity;
        // Índice de calor simplificado
        enrichedRow.comfort_index =
          temp - (0.55 - 0.0055 * humidity) * (temp - 14.5);
      }

      // Categorizar calidad del aire
      if (row['air_quality_us-epa-index']) {
        const aqi = row['air_quality_us-epa-index'];
        if (aqi <= 1) enrichedRow.air_quality_category = 'Good';
        else if (aqi <= 2) enrichedRow.air_quality_category = 'Moderate';
        else if (aqi <= 3)
          enrichedRow.air_quality_category = 'Unhealthy for Sensitive';
        else if (aqi <= 4) enrichedRow.air_quality_category = 'Unhealthy';
        else enrichedRow.air_quality_category = 'Very Unhealthy';
      }

      // Calcular diferencia térmica (sensación vs real)
      if (row.feels_like_celsius && row.temperature_celsius) {
        enrichedRow.thermal_difference =
          row.feels_like_celsius - row.temperature_celsius;
      }

      return enrichedRow;
    });
  }

  /**
   * Genera metadata del dataset
   */
  generateMetadata() {
    if (!this.dataset) return;

    const totalRows = this.dataset.length;
    const columns = Object.keys(this.dataset[0]);

    // Estadísticas por columna
    const columnStats = {};
    columns.forEach((col) => {
      const values = this.dataset
        .map((row) => row[col])
        .filter((val) => val != null);
      const isNumeric = this.columnTypes.numerical.includes(col);

      columnStats[col] = {
        type: isNumeric ? 'numerical' : 'categorical',
        count: values.length,
        nullCount: totalRows - values.length,
        uniqueCount: new Set(values).size,
      };

      if (isNumeric) {
        const numValues = values.filter((val) => typeof val === 'number');
        if (numValues.length > 0) {
          columnStats[col].min = Math.min(...numValues);
          columnStats[col].max = Math.max(...numValues);
          columnStats[col].mean =
            numValues.reduce((a, b) => a + b, 0) / numValues.length;
        }
      } else {
        // Para categóricas, obtener valores únicos
        columnStats[col].uniqueValues = [...new Set(values)].slice(0, 50); // Primeros 50
      }
    });

    this.metadata = {
      source: 'weather_data.json',
      description:
        'Global Weather Repository - Datos meteorológicos reales de 210 países',
      totalRows,
      totalColumns: columns.length,
      numericalColumns: this.columnTypes.numerical,
      categoricalColumns: this.columnTypes.categorical,
      columnStats,
      loadedAt: new Date().toISOString(),
      specialInfo: {
        countries: columnStats.country ? columnStats.country.uniqueCount : 0,
        temperatureRange: columnStats.temperature_celsius
          ? {
              min: columnStats.temperature_celsius.min,
              max: columnStats.temperature_celsius.max,
            }
          : null,
        conditions: columnStats.condition_text
          ? columnStats.condition_text.uniqueCount
          : 0,
      },
    };
  }

  /**
   * Obtiene información resumida del dataset
   * @returns {Object} Información del dataset
   */
  getDatasetInfo() {
    if (!this.metadata) {
      return 'No hay dataset cargado';
    }

    const tempRange = this.metadata.specialInfo.temperatureRange;
    const tempRangeText = tempRange
      ? `${tempRange.min.toFixed(1)}°C a ${tempRange.max.toFixed(1)}°C`
      : 'N/A';

    return `
            <strong>🌍 Dataset:</strong> ${this.metadata.description}<br>
            <strong>📊 Registros:</strong> ${this.metadata.totalRows.toLocaleString()}<br>
            <strong>📈 Columnas:</strong> ${this.metadata.totalColumns} 
            (${this.metadata.numericalColumns.length} numéricas, ${
      this.metadata.categoricalColumns.length
    } categóricas)<br>
            <strong>🌡️ Rango de temperatura:</strong> ${tempRangeText}<br>
            <strong>🌍 Países:</strong> ${
              this.metadata.specialInfo.countries
            }<br>
            <strong>☁️ Condiciones climáticas:</strong> ${
              this.metadata.specialInfo.conditions
            }<br>
            <strong>⏰ Cargado:</strong> ${new Date(
              this.metadata.loadedAt
            ).toLocaleString('es-ES')}
        `;
  }

  /**
   * Obtiene los datos filtrados según criterios
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Datos filtrados
   */
  getFilteredData(filters = {}) {
    if (!this.dataset) return [];

    let filteredData = [...this.dataset];

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (Array.isArray(value)) {
          // Filtro de rango (ej: temperaturas)
          const [min, max] = value;
          filteredData = filteredData.filter(
            (row) => row[key] >= min && row[key] <= max
          );
        } else {
          // Filtro exacto
          filteredData = filteredData.filter((row) => row[key] == value);
        }
      }
    });

    return filteredData;
  }

  /**
   * Obtiene valores únicos de una columna
   * @param {string} column - Nombre de la columna
   * @returns {Array} Valores únicos ordenados
   */
  getUniqueValues(column) {
    if (!this.dataset) return [];

    const values = [...new Set(this.dataset.map((row) => row[column]))]
      .filter((val) => val != null)
      .sort();

    return values;
  }

  /**
   * Obtiene el rango de valores para una columna numérica
   * @param {string} column - Nombre de la columna
   * @returns {Object} {min, max} del rango
   */
  getColumnRange(column) {
    if (!this.dataset || !this.columnTypes.numerical.includes(column)) {
      return { min: 0, max: 100 };
    }

    const values = this.dataset
      .map((row) => row[column])
      .filter((val) => typeof val === 'number' && !isNaN(val));

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Obtiene estadísticas básicas de una columna numérica
   * @param {string} column - Nombre de la columna
   * @returns {Object} Estadísticas básicas
   */
  getColumnStats(column) {
    if (!this.dataset || !this.columnTypes.numerical.includes(column)) {
      return null;
    }

    const values = this.dataset
      .map((row) => row[column])
      .filter((val) => typeof val === 'number' && !isNaN(val));

    if (values.length === 0) return null;

    const sorted = values.sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: mean,
      median: median,
      std: Math.sqrt(
        values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
      ),
    };
  }
}

// Instancia global del cargador de datos meteorológicos
window.weatherDataLoader = new WeatherDataLoader();
