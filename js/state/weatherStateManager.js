/**
 * WeatherStateManager - Maneja el estado global del dashboard meteorológico
 * Coordina la comunicación entre componentes y mantiene sincronización de datos climáticos
 */
class WeatherStateManager {
  constructor() {
    this.state = {
      dataset: null,
      metadata: null,
      filteredData: null,
      filters: {},
      charts: {},
      ui: {
        currentSection: 'overview',
        loading: false,
        error: null,
      },
      weatherStats: {
        totalCountries: 0,
        temperatureRange: null,
        avgTemperature: 0,
        avgHumidity: 0,
        topConditions: [],
      },
    };
    this.observers = [];
    this.initialized = false;
  }

  /**
   * Inicializa el manejador de estado meteorológico
   */
  init() {
    if (this.initialized) return;

    this.setupEventListeners();
    this.initialized = true;
    console.log('WeatherStateManager inicializado');
  }

  /**
   * Configura event listeners globales
   */
  setupEventListeners() {
    // Escuchar cambios de filtros meteorológicos
    if (window.weatherFilterManager) {
      window.weatherFilterManager.onFilterChange((filters) => {
        this.updateFilters(filters);
      });
    }

    // Escuchar errores globales
    window.addEventListener('error', (event) => {
      this.setError(`Error meteorológico: ${event.message}`);
    });

    // Escuchar cambios de URL (para navegación)
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.section) {
        this.setCurrentSection(event.state.section);
      }
    });

    // Escuchar cambios de conectividad para datos meteorológicos
    window.addEventListener('online', () => {
      this.notifyObservers('connectivity', { online: true });
    });

    window.addEventListener('offline', () => {
      this.notifyObservers('connectivity', { online: false });
    });
  }

  /**
   * Actualiza el dataset meteorológico y metadata
   * @param {Array} dataset - Datos del dataset meteorológico
   * @param {Object} metadata - Metadata del dataset
   */
  setDataset(dataset, metadata) {
    this.state.dataset = dataset;
    this.state.metadata = metadata;
    this.state.filteredData = dataset; // Inicialmente sin filtros

    // Calcular estadísticas meteorológicas
    this.calculateWeatherStats(dataset);

    this.notifyObservers('dataset', { dataset, metadata });
    console.log('Dataset meteorológico actualizado en estado global');
  }

  /**
   * Calcula estadísticas específicas del clima
   * @param {Array} dataset - Datos meteorológicos
   */
  calculateWeatherStats(dataset) {
    if (!dataset || dataset.length === 0) return;

    // Países únicos
    const countries = [...new Set(dataset.map((row) => row.country))];

    // Rango de temperatura
    const temperatures = dataset.map((row) => row.temperature_celsius || 0);
    const tempRange = {
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
    };

    // Promedios
    const avgTemp =
      temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const avgHumidity =
      dataset.reduce((sum, row) => sum + (row.humidity || 0), 0) /
      dataset.length;

    // Condiciones más comunes
    const conditionCounts = {};
    dataset.forEach((row) => {
      const condition = row.condition_text || 'Unknown';
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });

    const topConditions = Object.entries(conditionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([condition, count]) => ({ condition, count }));

    this.state.weatherStats = {
      totalCountries: countries.length,
      temperatureRange: tempRange,
      avgTemperature: avgTemp,
      avgHumidity: avgHumidity,
      topConditions: topConditions,
      countries: countries,
    };

    // Actualizar indicadores en UI
    if (window.weatherUIController) {
      window.weatherUIController.updateWeatherIndicators(
        this.state.weatherStats
      );
    }
  }

  /**
   * Actualiza los filtros meteorológicos activos
   * @param {Object} filters - Nuevos filtros
   */
  updateFilters(filters) {
    this.state.filters = { ...filters };

    // Aplicar filtros a los datos meteorológicos
    if (this.state.dataset && window.weatherFilterManager) {
      this.state.filteredData = window.weatherFilterManager.applyFilters(
        this.state.dataset
      );
      this.updateWeatherCharts();

      // Recalcular estadísticas con datos filtrados
      this.calculateWeatherStats(this.state.filteredData);
    }

    this.notifyObservers('filters', filters);
    console.log('Filtros meteorológicos actualizados:', filters);
  }

  /**
   * Actualiza todos los gráficos meteorológicos con datos filtrados
   */
  updateWeatherCharts() {
    if (!this.state.filteredData || !window.weatherDataProcessor) return;

    try {
      // Configurar datos en el procesador meteorológico
      window.weatherDataProcessor.setData(this.state.filteredData);

      // Actualizar gráficos de Plotly
      this.updatePlotlyWeatherCharts();

      // Actualizar gráficos de D3.js
      this.updateD3WeatherCharts();

      this.notifyObservers('charts', this.state.filteredData);
    } catch (error) {
      console.error('Error actualizando gráficos meteorológicos:', error);
      this.setError('Error actualizando visualizaciones meteorológicas');
    }
  }

  /**
   * Actualiza gráficos meteorológicos de Plotly
   */
  updatePlotlyWeatherCharts() {
    if (!window.weatherPlotlyCharts || !window.weatherDataProcessor) return;

    const data = this.state.filteredData;

    // Gráfico combinado (temperatura + humedad)
    const comboData = window.weatherDataProcessor.prepareComboChartData(data);
    window.weatherPlotlyCharts.updateChart(
      'combined-chart',
      comboData,
      'combined'
    );

    // Gráfico de cascada (cambios estacionales)
    const waterfallData =
      window.weatherDataProcessor.prepareWaterfallData(data);
    window.weatherPlotlyCharts.updateChart(
      'waterfall-chart',
      waterfallData,
      'waterfall'
    );

    // Treemap (países por temperatura)
    const treemapData = window.weatherDataProcessor.prepareTreemapData(data);
    window.weatherPlotlyCharts.updateChart(
      'treemap-chart',
      treemapData,
      'treemap'
    );

    // Sankey (flujo climático)
    const sankeyData = window.weatherDataProcessor.prepareSankeyData(data);
    window.weatherPlotlyCharts.updateChart(
      'sankey-chart',
      sankeyData,
      'sankey'
    );

    // Swarm plot (distribución de temperaturas)
    const swarmData = window.weatherDataProcessor.prepareSwarmData(data);
    window.weatherPlotlyCharts.updateChart('swarm-chart', swarmData, 'swarm');

    // Mapa geográfico (temperaturas mundiales)
    const geoData = window.weatherDataProcessor.prepareGeoData(data);
    window.weatherPlotlyCharts.updateChart('geo-chart', geoData, 'geo');

    // Funnel (condiciones climáticas)
    const funnelData = window.weatherDataProcessor.prepareFunnelData(data);
    window.weatherPlotlyCharts.updateChart(
      'funnel-chart',
      funnelData,
      'funnel'
    );

    // Radar (métricas por región)
    const radarData = window.weatherDataProcessor.prepareRadarData(data);
    window.weatherPlotlyCharts.updateChart('radar-chart', radarData, 'radar');

    // Heatmap (correlaciones meteorológicas)
    const heatmapData =
      window.weatherDataProcessor.calculateCorrelationMatrix(data);
    window.weatherPlotlyCharts.updateChart(
      'heatmap-chart',
      heatmapData,
      'heatmap'
    );
  }

  /**
   * Actualiza gráficos meteorológicos de D3.js
   */
  updateD3WeatherCharts() {
    if (!window.weatherD3Charts || !window.weatherDataProcessor) return;

    const data = this.state.filteredData;

    // Ribbon chart (conexiones climáticas)
    window.weatherD3Charts.updateChart('ribbon-chart', data, 'ribbon');

    // Pareto chart (países por temperatura)
    const paretoData = window.weatherDataProcessor.prepareParetoData(data);
    window.weatherD3Charts.updateChart('pareto-chart', paretoData, 'pareto');

    // KDE chart (densidad de temperaturas)
    const kdeData = window.weatherDataProcessor.prepareKDEData(data);
    window.weatherD3Charts.updateChart('kde-chart', kdeData, 'kde');
  }

  /**
   * Establece la sección actual de la UI
   * @param {string} section - ID de la sección
   */
  setCurrentSection(section) {
    this.state.ui.currentSection = section;

    // Actualizar URL sin recargar página
    const url = new URL(window.location);
    url.searchParams.set('section', section);
    window.history.pushState({ section }, '', url);

    this.notifyObservers('ui', this.state.ui);
  }

  /**
   * Establece el estado de carga
   * @param {boolean} loading - Estado de carga
   * @param {string} message - Mensaje opcional
   */
  setLoading(loading, message = '') {
    this.state.ui.loading = loading;
    this.state.ui.loadingMessage = message;

    if (window.weatherUIController) {
      if (loading) {
        window.weatherUIController.showLoading(message);
      } else {
        window.weatherUIController.hideLoading();
      }
    }

    this.notifyObservers('ui', this.state.ui);
  }

  /**
   * Establece un error en el estado
   * @param {string} error - Mensaje de error
   */
  setError(error) {
    this.state.ui.error = error;

    if (window.weatherUIController && error) {
      window.weatherUIController.showError(error);
    }

    this.notifyObservers('ui', this.state.ui);
  }

  /**
   * Limpia el error actual
   */
  clearError() {
    this.state.ui.error = null;

    if (window.weatherUIController) {
      window.weatherUIController.hideError();
    }

    this.notifyObservers('ui', this.state.ui);
  }

  /**
   * Obtiene el estado actual
   * @returns {Object} Estado completo
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Obtiene una parte específica del estado
   * @param {string} key - Clave del estado
   * @returns {*} Valor del estado
   */
  getStateValue(key) {
    return this.state[key];
  }

  /**
   * Obtiene estadísticas meteorológicas actuales
   * @returns {Object} Estadísticas del clima
   */
  getWeatherStats() {
    return { ...this.state.weatherStats };
  }

  /**
   * Registra un observer para cambios de estado
   * @param {Function} callback - Función callback
   * @param {string} filter - Filtro opcional para tipos de cambio
   */
  subscribe(callback, filter = null) {
    if (typeof callback === 'function') {
      this.observers.push({ callback, filter });
    }
  }

  /**
   * Desregistra un observer
   * @param {Function} callback - Función callback a remover
   */
  unsubscribe(callback) {
    this.observers = this.observers.filter(
      (observer) => observer.callback !== callback
    );
  }

  /**
   * Notifica a todos los observers sobre cambios
   * @param {string} type - Tipo de cambio
   * @param {*} data - Datos del cambio
   */
  notifyObservers(type, data) {
    this.observers.forEach((observer) => {
      if (!observer.filter || observer.filter === type) {
        try {
          observer.callback(type, data, this.state);
        } catch (error) {
          console.error('Error en observer meteorológico:', error);
        }
      }
    });
  }

  /**
   * Exporta el estado meteorológico actual como JSON
   * @returns {string} Estado serializado
   */
  exportState() {
    const exportableState = {
      filters: this.state.filters,
      ui: {
        currentSection: this.state.ui.currentSection,
      },
      weatherStats: this.state.weatherStats,
      metadata: this.state.metadata
        ? {
            totalRows: this.state.metadata.totalRows,
            totalColumns: this.state.metadata.totalColumns,
            loadedAt: this.state.metadata.loadedAt,
            specialInfo: this.state.metadata.specialInfo,
          }
        : null,
    };

    return JSON.stringify(exportableState, null, 2);
  }

  /**
   * Importa un estado meteorológico desde JSON
   * @param {string} stateJson - Estado serializado
   */
  importState(stateJson) {
    try {
      const importedState = JSON.parse(stateJson);

      // Aplicar filtros si existen
      if (importedState.filters && window.weatherFilterManager) {
        window.weatherFilterManager.importConfig(
          JSON.stringify(importedState.filters)
        );
      }

      // Cambiar sección si es diferente
      if (importedState.ui && importedState.ui.currentSection) {
        this.setCurrentSection(importedState.ui.currentSection);
        if (window.weatherUIController) {
          window.weatherUIController.showSection(
            importedState.ui.currentSection
          );
        }
      }

      console.log('Estado meteorológico importado exitosamente');
    } catch (error) {
      console.error('Error importando estado meteorológico:', error);
      this.setError('Error al importar configuración meteorológica');
    }
  }

  /**
   * Resetea el estado a valores por defecto
   */
  reset() {
    this.state = {
      dataset: null,
      metadata: null,
      filteredData: null,
      filters: {},
      charts: {},
      ui: {
        currentSection: 'overview',
        loading: false,
        error: null,
      },
      weatherStats: {
        totalCountries: 0,
        temperatureRange: null,
        avgTemperature: 0,
        avgHumidity: 0,
        topConditions: [],
      },
    };

    // Resetear filtros meteorológicos
    if (window.weatherFilterManager) {
      window.weatherFilterManager.resetFilters();
    }

    // Limpiar gráficos
    if (window.weatherPlotlyCharts) {
      window.weatherPlotlyCharts.clearAllCharts();
    }
    if (window.weatherD3Charts) {
      window.weatherD3Charts.clearAllCharts();
    }

    this.notifyObservers('reset', this.state);
    console.log('🔄 Estado meteorológico reseteado');
  }

  /**
   * Obtiene estadísticas del estado actual
   * @returns {Object} Estadísticas
   */
  getStats() {
    const stats = {
      hasDataset: !!this.state.dataset,
      datasetSize: this.state.dataset ? this.state.dataset.length : 0,
      filteredSize: this.state.filteredData
        ? this.state.filteredData.length
        : 0,
      activeFilters: Object.keys(this.state.filters).length,
      currentSection: this.state.ui.currentSection,
      isLoading: this.state.ui.loading,
      hasError: !!this.state.ui.error,
      observersCount: this.observers.length,
      weatherStats: this.state.weatherStats,
    };

    return stats;
  }

  /**
   * Obtiene recomendaciones basadas en los datos meteorológicos actuales
   * @returns {Object} Recomendaciones de análisis
   */
  getWeatherRecommendations() {
    if (!this.state.filteredData || this.state.filteredData.length === 0) {
      return { recommendations: [] };
    }

    const recommendations = [];
    const data = this.state.filteredData;
    const stats = this.state.weatherStats;

    // Recomendación basada en temperatura
    if (stats.avgTemperature > 30) {
      recommendations.push({
        type: 'temperature',
        message:
          '🔥 Temperaturas altas detectadas. Considera filtrar por regiones más frías.',
        action: 'filter_temperature',
      });
    } else if (stats.avgTemperature < 0) {
      recommendations.push({
        type: 'temperature',
        message:
          '❄️ Temperaturas muy bajas. Explora regiones con clima más cálido.',
        action: 'filter_temperature',
      });
    }

    // Recomendación basada en cantidad de países
    if (stats.totalCountries > 50) {
      recommendations.push({
        type: 'geography',
        message:
          'Muchos países en el análisis. Considera filtrar por región específica.',
        action: 'filter_country',
      });
    }

    // Recomendación basada en datos filtrados
    if (data.length < 100) {
      recommendations.push({
        type: 'data',
        message:
          'Pocos datos después del filtrado. Considera ampliar los criterios.',
        action: 'expand_filters',
      });
    }

    return { recommendations };
  }
}

// Instancia global del manejador de estado meteorológico
window.weatherStateManager = new WeatherStateManager();
