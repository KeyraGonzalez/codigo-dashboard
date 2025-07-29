/**
 * WeatherMain - Aplicación principal del dashboard meteorológico
 * Coordina la inicialización y funcionamiento de todos los componentes climáticos
 */
class WeatherDashboardApp {
  constructor() {
    this.initialized = false;
    this.components = {
      dataLoader: window.weatherDataLoader,
      dataProcessor: window.weatherDataProcessor,
      plotlyCharts: window.weatherPlotlyCharts,
      d3Charts: window.weatherD3Charts,
      filterManager: window.weatherFilterManager,
      uiController: window.weatherUIController,
      stateManager: window.weatherStateManager,
    };
  }

  /**
   * Inicializa la aplicación meteorológica completa
   */
  async init() {
    if (this.initialized) return;

    try {
      console.log('Iniciando Dashboard de Clima Global...');

      // Mostrar loading
      this.components.uiController.showLoading(
        'Inicializando dashboard meteorológico...'
      );

      // Inicializar componentes en orden
      await this.initializeComponents();

      // Cargar datos meteorológicos
      await this.loadWeatherData();

      // Configurar interacciones
      this.setupInteractions();

      // Crear gráficos meteorológicos iniciales
      await this.createInitialWeatherCharts();

      this.initialized = true;
      this.components.uiController.hideLoading();
      this.components.uiController.showWeatherNotification(
        'Dashboard meteorológico cargado exitosamente',
        'success'
      );

      console.log('Dashboard meteorológico inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando dashboard meteorológico:', error);
      this.components.uiController.showError(
        'Error al inicializar el dashboard meteorológico. Por favor, recarga la página.',
        error
      );
    }
  }

  /**
   * Inicializa todos los componentes meteorológicos
   */
  async initializeComponents() {
    console.log('Inicializando componentes meteorológicos...');

    // Inicializar en orden de dependencias
    this.components.stateManager.init();
    this.components.uiController.init();
    this.components.filterManager.init();

    // Configurar observers del estado
    this.setupStateObservers();

    console.log('Componentes meteorológicos inicializados');
  }

  /**
   * Configura observers del estado global meteorológico
   */
  setupStateObservers() {
    // Observer para cambios de dataset meteorológico
    this.components.stateManager.subscribe((type, data) => {
      if (type === 'dataset') {
        this.components.uiController.updateDatasetInfo(
          this.components.dataLoader.getDatasetInfo()
        );
        this.components.filterManager.updateFilterOptions(data.metadata);
      }
    }, 'dataset');

    // Observer para cambios de filtros meteorológicos
    this.components.stateManager.subscribe((type, data) => {
      if (type === 'filters') {
        this.components.uiController.updateFiltersDisplay(data);
      }
    }, 'filters');

    // Observer para cambios de UI
    this.components.stateManager.subscribe((type, data) => {
      if (type === 'ui' && data.currentSection) {
        this.components.uiController.showSection(data.currentSection);
      }
    }, 'ui');

    // Observer para conectividad
    this.components.stateManager.subscribe((type, data) => {
      if (type === 'connectivity') {
        const message = data.online
          ? '🌐 Conexión restaurada'
          : '📡 Sin conexión - usando datos en caché';
        this.components.uiController.showWeatherNotification(
          message,
          data.online ? 'success' : 'warning'
        );
      }
    }, 'connectivity');
  }

  /**
   * Carga los datos meteorológicos del dataset
   */
  async loadWeatherData() {
    try {
      console.log('Cargando dataset meteorológico...');
      this.components.uiController.showLoading(
        'Cargando datos meteorológicos globales...'
      );

      const result = await this.components.dataLoader.loadDataset();

      console.log(
        `Dataset meteorológico cargado: ${result.data.length} registros de ${result.metadata.specialInfo.countries} países`
      );

      // Actualizar estado global
      this.components.stateManager.setDataset(result.data, result.metadata);

      // Mostrar estadísticas en UI
      this.components.uiController.updateWeatherIndicators(
        result.metadata.specialInfo
      );
    } catch (error) {
      console.error('Error cargando datos meteorológicos:', error);
      throw new Error(`Error al cargar datos meteorológicos: ${error.message}`);
    }
  }

  /**
   * Configura las interacciones entre componentes meteorológicos
   */
  setupInteractions() {
    console.log('🔗 Configurando interacciones meteorológicas...');

    // Configurar callback de filtros para actualizar gráficos
    this.components.filterManager.onFilterChange((filters) => {
      this.components.stateManager.updateFilters(filters);
    });

    // Configurar eventos de exportación meteorológica
    this.setupWeatherExportHandlers();

    // Configurar atajos de teclado específicos
    this.setupWeatherKeyboardShortcuts();

    console.log('Interacciones meteorológicas configuradas');
  }

  /**
   * Configura manejadores de exportación meteorológica
   */
  setupWeatherExportHandlers() {
    // Los controles de exportación ya están configurados en weatherUIController
    // Aquí podemos agregar lógica adicional si es necesaria

    // Configurar exportación automática periódica (opcional)
    if (localStorage.getItem('weather-auto-export') === 'true') {
      setInterval(() => {
        this.autoExportWeatherData();
      }, 3600000); // Cada hora
    }
  }

  /**
   * Configura atajos de teclado específicos para el dashboard meteorológico
   */
  setupWeatherKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + R: Resetear filtros meteorológicos
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        this.components.filterManager.resetFilters();
        this.components.uiController.showWeatherNotification(
          '🔄 Filtros meteorológicos reseteados',
          'info'
        );
      }

      // Ctrl/Cmd + E: Exportar estado meteorológico
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        this.exportWeatherState();
      }

      // Ctrl/Cmd + D: Exportar datos meteorológicos
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        this.components.uiController.exportWeatherData();
      }

      // Números 1-4: Cambiar secciones
      if (e.key >= '1' && e.key <= '4') {
        const sections = ['overview', 'plotly-charts', 'd3-charts', 'filters'];
        const sectionIndex = parseInt(e.key) - 1;
        if (sections[sectionIndex]) {
          this.components.stateManager.setCurrentSection(
            sections[sectionIndex]
          );

          // Actualizar botón activo
          document.querySelectorAll('.nav-btn').forEach((btn, index) => {
            btn.classList.toggle('active', index === sectionIndex);
          });
        }
      }

      // F: Mostrar/ocultar panel de filtros
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        const filtersPanel = document.querySelector('.filters-panel');
        if (filtersPanel) {
          filtersPanel.style.display =
            filtersPanel.style.display === 'none' ? 'block' : 'none';
        }
      }
    });
  }

  /**
   * Crea todos los gráficos meteorológicos iniciales
   */
  async createInitialWeatherCharts() {
    try {
      console.log('Creando gráficos meteorológicos iniciales...');
      this.components.uiController.showLoading(
        'Generando visualizaciones meteorológicas...'
      );

      const data = this.components.stateManager.getStateValue('dataset');
      if (!data || data.length === 0) {
        throw new Error(
          'No hay datos meteorológicos disponibles para crear gráficos'
        );
      }

      // Configurar procesador de datos meteorológicos
      this.components.dataProcessor.setData(data);

      // Crear gráficos de Plotly
      await this.createPlotlyWeatherCharts(data);

      // Crear gráficos de D3.js
      await this.createD3WeatherCharts(data);

      console.log('Gráficos meteorológicos creados exitosamente');
    } catch (error) {
      console.error('Error creando gráficos meteorológicos:', error);
      throw new Error(
        `Error al crear visualizaciones meteorológicas: ${error.message}`
      );
    }
  }

  /**
   * Crea todos los gráficos meteorológicos de Plotly
   */
  async createPlotlyWeatherCharts(data) {
    const charts = [
      {
        id: 'combined-chart',
        type: 'combined',
        dataMethod: 'prepareComboChartData',
        createMethod: 'createCombinedChart',
        description: 'Temperatura y humedad por mes',
      },
      {
        id: 'waterfall-chart',
        type: 'waterfall',
        dataMethod: 'prepareWaterfallData',
        createMethod: 'createWaterfallChart',
        description: 'Cambios estacionales de temperatura',
      },
      {
        id: 'treemap-chart',
        type: 'treemap',
        dataMethod: 'prepareTreemapData',
        createMethod: 'createTreemap',
        description: 'Países organizados por temperatura',
      },
      {
        id: 'sankey-chart',
        type: 'sankey',
        dataMethod: 'prepareSankeyData',
        createMethod: 'createSankeyDiagram',
        description: 'Flujo de condiciones climáticas',
      },
      {
        id: 'swarm-chart',
        type: 'swarm',
        dataMethod: 'prepareSwarmData',
        createMethod: 'createSwarmPlot',
        description: 'Distribución de temperaturas',
      },
      {
        id: 'geo-chart',
        type: 'geo',
        dataMethod: 'prepareGeoData',
        createMethod: 'createGeoMap',
        description: 'Mapa mundial de temperaturas',
      },
      {
        id: 'funnel-chart',
        type: 'funnel',
        dataMethod: 'prepareFunnelData',
        createMethod: 'createFunnelChart',
        description: 'Distribución de condiciones climáticas',
      },
      {
        id: 'radar-chart',
        type: 'radar',
        dataMethod: 'prepareRadarData',
        createMethod: 'createRadarChart',
        description: 'Métricas climáticas por región',
      },
      {
        id: 'heatmap-chart',
        type: 'heatmap',
        dataMethod: 'calculateCorrelationMatrix',
        createMethod: 'createHeatmap',
        description: 'Correlaciones meteorológicas',
      },
    ];

    for (const chart of charts) {
      try {
        console.log(`Creando ${chart.description}...`);
        const chartData = this.components.dataProcessor[chart.dataMethod](data);
        this.components.plotlyCharts[chart.createMethod](chart.id, chartData);

        // Pequeña pausa para no bloquear la UI
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Error creando gráfico meteorológico ${chart.id}:`,
          error
        );
        // Continuar con otros gráficos aunque uno falle
      }
    }
  }

  /**
   * Crea todos los gráficos meteorológicos de D3.js
   */
  async createD3WeatherCharts(data) {
    const charts = [
      {
        id: 'ribbon-chart',
        type: 'ribbon',
        createMethod: 'createRibbonChart',
        description: 'Conexiones climáticas',
      },
      {
        id: 'pareto-chart',
        type: 'pareto',
        dataMethod: 'prepareParetoData',
        createMethod: 'createParetoChart',
        description: 'Análisis Pareto de temperaturas',
      },
      {
        id: 'kde-chart',
        type: 'kde',
        dataMethod: 'prepareKDEData',
        createMethod: 'createKDEChart',
        description: 'Densidad de temperaturas',
      },
    ];

    for (const chart of charts) {
      try {
        console.log(`Creando ${chart.description} con D3.js...`);
        let chartData = data;
        if (chart.dataMethod) {
          chartData = this.components.dataProcessor[chart.dataMethod](data);
        }

        this.components.d3Charts[chart.createMethod](chart.id, chartData);

        // Pequeña pausa para no bloquear la UI
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Error creando gráfico D3 meteorológico ${chart.id}:`,
          error
        );
        // Continuar con otros gráficos aunque uno falle
      }
    }
  }

  /**
   * Exporta el estado meteorológico actual
   */
  exportWeatherState() {
    try {
      const state = this.components.stateManager.exportState();
      const blob = new Blob([state], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `weather_dashboard_state_${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      this.components.uiController.showWeatherNotification(
        '💾 Estado del dashboard meteorológico exportado',
        'success'
      );
    } catch (error) {
      console.error('Error exportando estado meteorológico:', error);
      this.components.uiController.showWeatherNotification(
        'Error al exportar estado',
        'error'
      );
    }
  }

  /**
   * Importa un estado meteorológico
   * @param {File} file - Archivo con el estado
   */
  async importWeatherState(file) {
    try {
      const text = await file.text();
      this.components.stateManager.importState(text);

      this.components.uiController.showWeatherNotification(
        '📥 Estado del dashboard meteorológico importado',
        'success'
      );
    } catch (error) {
      console.error('Error importando estado meteorológico:', error);
      this.components.uiController.showWeatherNotification(
        'Error al importar estado',
        'error'
      );
    }
  }

  /**
   * Exportación automática de datos meteorológicos (opcional)
   */
  autoExportWeatherData() {
    try {
      const filteredData =
        this.components.stateManager.getStateValue('filteredData');
      if (!filteredData || filteredData.length === 0) return;

      // Exportar solo si hay cambios significativos
      const lastExportSize = localStorage.getItem('weather-last-export-size');
      if (
        lastExportSize &&
        Math.abs(filteredData.length - parseInt(lastExportSize)) < 100
      ) {
        return; // No hay cambios significativos
      }

      this.components.uiController.exportWeatherData();
      localStorage.setItem(
        'weather-last-export-size',
        filteredData.length.toString()
      );
    } catch (error) {
      console.error('Error en exportación automática:', error);
    }
  }

  /**
   * Obtiene información de diagnóstico meteorológico
   * @returns {Object} Información de diagnóstico
   */
  getWeatherDiagnostics() {
    const baseStats = this.components.stateManager.getStats();
    const weatherStats = this.components.stateManager.getWeatherStats();
    const recommendations =
      this.components.stateManager.getWeatherRecommendations();

    return {
      ...baseStats,
      weatherSpecific: {
        totalCountries: weatherStats.totalCountries,
        temperatureRange: weatherStats.temperatureRange,
        avgTemperature: weatherStats.avgTemperature,
        avgHumidity: weatherStats.avgHumidity,
        topConditions: weatherStats.topConditions,
      },
      recommendations: recommendations.recommendations,
      performance: {
        memory: performance.memory
          ? {
              used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(
                performance.memory.totalJSHeapSize / 1024 / 1024
              ),
              limit: Math.round(
                performance.memory.jsHeapSizeLimit / 1024 / 1024
              ),
            }
          : 'No disponible',
      },
    };
  }

  /**
   * Limpia recursos y resetea la aplicación meteorológica
   */
  cleanup() {
    console.log('🧹 Limpiando recursos meteorológicos...');

    // Limpiar gráficos
    if (this.components.plotlyCharts) {
      this.components.plotlyCharts.clearAllCharts();
    }
    if (this.components.d3Charts) {
      this.components.d3Charts.clearAllCharts();
    }

    // Limpiar UI
    if (this.components.uiController) {
      this.components.uiController.cleanup();
    }

    // Resetear estado
    if (this.components.stateManager) {
      this.components.stateManager.reset();
    }

    this.initialized = false;
    console.log('Recursos meteorológicos limpiados');
  }

  /**
   * Recarga los datos meteorológicos
   */
  async reloadWeatherData() {
    try {
      this.components.uiController.showLoading(
        'Recargando datos meteorológicos...'
      );
      await this.loadWeatherData();
      await this.createInitialWeatherCharts();
      this.components.uiController.hideLoading();
      this.components.uiController.showWeatherNotification(
        '🔄 Datos meteorológicos recargados',
        'success'
      );
    } catch (error) {
      console.error('Error recargando datos meteorológicos:', error);
      this.components.uiController.showError(
        'Error al recargar datos meteorológicos'
      );
    }
  }
}

// Crear instancia global de la aplicación meteorológica
window.weatherDashboardApp = new WeatherDashboardApp();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.weatherDashboardApp.init();
});

// Limpiar recursos al cerrar la página
window.addEventListener('beforeunload', () => {
  window.weatherDashboardApp.cleanup();
});

// Exponer funciones útiles globalmente para debugging
window.weatherMain = {
  app: window.weatherDashboardApp,
  loadData: () => window.weatherDashboardApp.loadWeatherData(),
  exportState: () => window.weatherDashboardApp.exportWeatherState(),
  getDiagnostics: () => window.weatherDashboardApp.getWeatherDiagnostics(),
  cleanup: () => window.weatherDashboardApp.cleanup(),
  reload: () => window.weatherDashboardApp.reloadWeatherData(),
};
