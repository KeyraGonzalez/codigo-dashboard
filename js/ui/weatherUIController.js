/**
 * WeatherUIController - Maneja la interfaz de usuario del dashboard meteorológico
 */
class WeatherUIController {
  constructor() {
    this.currentSection = 'plotly-charts';
    this.loading = false;
    this.initialized = false;
  }

  /**
   * Inicializa el controlador de UI
   */
  init() {
    if (this.initialized) return;

    this.initNavigation();
    this.initErrorHandling();
    this.initResponsiveHandlers();
    this.initWeatherSpecificFeatures();
    this.initialized = true;
    console.log('WeatherUIController inicializado');
  }

  /**
   * Inicializa características específicas del dashboard meteorológico
   */
  initWeatherSpecificFeatures() {
    // Agregar indicadores de clima en tiempo real
    this.addWeatherIndicators();

    // Configurar tooltips informativos
    this.setupWeatherTooltips();

    // Agregar controles de exportación específicos
    this.setupWeatherExportControls();
  }

  /**
   * Agrega indicadores visuales de clima
   */
  addWeatherIndicators() {
    const header = document.querySelector('.header');
    if (header) {
      const weatherIndicator = document.createElement('div');
      weatherIndicator.className = 'weather-indicator';
      weatherIndicator.innerHTML = `
                <div class="weather-stats">
                    <span id="total-countries">Cargando...</span>
                    <span id="temp-range">Cargando...</span>
                    <span id="data-timestamp">Cargando...</span>
                </div>
            `;
      weatherIndicator.style.cssText = `
                margin-top: 10px;
                font-size: 14px;
                opacity: 0.9;
                display: flex;
                gap: 20px;
                justify-content: center;
                flex-wrap: wrap;
            `;
      header.appendChild(weatherIndicator);
    }
  }

  /**
   * Configura tooltips informativos para elementos meteorológicos
   */
  setupWeatherTooltips() {
    const tooltips = [
      {
        selector: '#combined-chart',
        text: 'Muestra la relación entre temperatura y humedad a lo largo del tiempo',
      },
      {
        selector: '#waterfall-chart',
        text: 'Visualiza cambios estacionales de temperatura',
      },
      {
        selector: '#treemap-chart',
        text: 'Organiza países por categorías de temperatura',
      },
      {
        selector: '#sankey-chart',
        text: 'Flujo de condiciones climáticas entre regiones',
      },
      {
        selector: '#swarm-chart',
        text: 'Distribución de temperaturas por condición meteorológica',
      },
      { selector: '#geo-chart', text: 'Mapa mundial de temperaturas promedio' },
      {
        selector: '#funnel-chart',
        text: 'Frecuencia de diferentes condiciones climáticas',
      },
      {
        selector: '#radar-chart',
        text: 'Comparación multidimensional de métricas climáticas',
      },
      {
        selector: '#heatmap-chart',
        text: 'Correlaciones entre variables meteorológicas',
      },
      {
        selector: '#ribbon-chart',
        text: 'Conexiones entre condiciones climáticas (D3.js)',
      },
      {
        selector: '#pareto-chart',
        text: 'Análisis 80/20 de países por temperatura (D3.js)',
      },
      {
        selector: '#kde-chart',
        text: 'Distribución de densidad de temperaturas (D3.js)',
      },
    ];

    tooltips.forEach(({ selector, text }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.title = text;
        element.style.cursor = 'help';
      }
    });
  }

  /**
   * Configura controles de exportación específicos para datos meteorológicos
   */
  setupWeatherExportControls() {
    const sections = ['plotly-charts', 'd3-charts'];

    sections.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section && !section.querySelector('.weather-export-controls')) {
        const exportControls = document.createElement('div');
        exportControls.className = 'weather-export-controls';
        exportControls.style.cssText = `
                    margin: 20px 0;
                    text-align: center;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    color: white;
                `;

        exportControls.innerHTML = `
                    <h4 style="margin-bottom: 10px;">Exportar Gráficos Meteorológicos</h4>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="weather-export-btn" data-format="png">PNG</button>
                        <button class="weather-export-btn" data-format="svg">SVG</button>
                        <button class="weather-export-btn" data-format="pdf">PDF</button>
                        <button class="weather-export-btn" data-action="export-data">Datos CSV</button>
                        <button class="weather-export-btn" data-action="export-report">Reporte</button>
                    </div>
                `;

        section.insertBefore(exportControls, section.firstChild);

        // Event listeners para exportación
        exportControls
          .querySelectorAll('.weather-export-btn')
          .forEach((btn) => {
            btn.style.cssText = `
                        margin: 5px;
                        padding: 8px 16px;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 1px solid rgba(255,255,255,0.3);
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-size: 12px;
                    `;

            btn.addEventListener('mouseenter', () => {
              btn.style.background = 'rgba(255,255,255,0.3)';
              btn.style.transform = 'translateY(-2px)';
            });

            btn.addEventListener('mouseleave', () => {
              btn.style.background = 'rgba(255,255,255,0.2)';
              btn.style.transform = 'translateY(0)';
            });

            btn.addEventListener('click', (e) => {
              const format = e.target.dataset.format;
              const action = e.target.dataset.action;

              if (format) {
                this.exportAllWeatherCharts(sectionId, format);
              } else if (action === 'export-data') {
                this.exportWeatherData();
              } else if (action === 'export-report') {
                this.generateWeatherReport();
              }
            });
          });
      }
    });
  }

  /**
   * Inicializa la navegación entre secciones
   */
  initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    navButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const targetSection = e.target.dataset.section;
        this.showSection(targetSection);

        // Actualizar botones activos
        navButtons.forEach((btn) => btn.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Mostrar sección inicial
    this.showSection(this.currentSection);
  }

  /**
   * Muestra una sección específica
   * @param {string} sectionId - ID de la sección a mostrar
   */
  showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');

    sections.forEach((section) => {
      if (section.id === sectionId) {
        section.classList.add('active');
        this.currentSection = sectionId;
      } else {
        section.classList.remove('active');
      }
    });

    // Redimensionar gráficos si es necesario
    if (sectionId === 'plotly-charts' && window.weatherPlotlyCharts) {
      setTimeout(() => window.weatherPlotlyCharts.resizeCharts(), 100);
    }

    console.log(`Sección activa: ${sectionId}`);
  }

  /**
   * Inicializa manejo de errores
   */
  initErrorHandling() {
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.hideError();
        // Reintentar carga de datos meteorológicos
        if (window.weatherMain && window.weatherMain.loadData) {
          window.weatherMain.loadData();
        }
      });
    }
  }

  /**
   * Inicializa manejadores responsivos
   */
  initResponsiveHandlers() {
    // Redimensionar gráficos cuando cambie el tamaño de ventana
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.weatherPlotlyCharts) {
          window.weatherPlotlyCharts.resizeCharts();
        }
      }, 250);
    });

    // Manejar orientación en móviles
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (window.weatherPlotlyCharts) {
          window.weatherPlotlyCharts.resizeCharts();
        }
      }, 500);
    });
  }

  /**
   * Muestra indicador de carga
   * @param {string} message - Mensaje de carga opcional
   */
  showLoading(message = 'Cargando datos meteorológicos...') {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.querySelector('p').textContent = message;
      loadingElement.classList.remove('hidden');
      this.loading = true;
    }
  }

  /**
   * Oculta indicador de carga
   */
  hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.classList.add('hidden');
      this.loading = false;
    }
  }

  /**
   * Muestra mensaje de error
   * @param {string} message - Mensaje de error
   * @param {Error} error - Objeto de error opcional
   */
  showError(message, error = null) {
    const errorDisplay = document.getElementById('error-display');
    const errorMessage = document.getElementById('error-message');

    if (errorDisplay && errorMessage) {
      errorMessage.textContent = message;
      errorDisplay.classList.remove('hidden');

      if (error) {
        console.error('Error detallado:', error);
      }
    }

    this.hideLoading();
  }

  /**
   * Oculta mensaje de error
   */
  hideError() {
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
      errorDisplay.classList.add('hidden');
    }
  }

  /**
   * Actualiza información del dataset meteorológico
   * @param {string} info - HTML con información del dataset
   */
  updateDatasetInfo(info) {
    const datasetInfo = document.getElementById('dataset-info');
    if (datasetInfo) {
      datasetInfo.innerHTML = info;
    }
  }

  /**
   * Actualiza indicadores meteorológicos en el header
   * @param {Object} stats - Estadísticas del dataset
   */
  updateWeatherIndicators(stats) {
    const totalCountries = document.getElementById('total-countries');
    const tempRange = document.getElementById('temp-range');
    const dataTimestamp = document.getElementById('data-timestamp');

    if (totalCountries && stats.countries) {
      totalCountries.textContent = `${stats.countries} países`;
    }

    if (tempRange && stats.temperatureRange) {
      tempRange.textContent = `${stats.temperatureRange.min.toFixed(
        1
      )}°C a ${stats.temperatureRange.max.toFixed(1)}°C`;
    }

    if (dataTimestamp) {
      dataTimestamp.textContent = `${new Date().toLocaleString('es-ES')}`;
    }
  }

  /**
   * Muestra notificación temporal específica para datos meteorológicos
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación (success, warning, error, info)
   * @param {number} duration - Duración en milisegundos
   */
  showWeatherNotification(message, type = 'success', duration = 4000) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `weather-notification weather-notification-${type}`;

    const icons = {
      success: 'OK',
      warning: 'AVISO',
      error: 'ERROR',
      info: 'INFO',
    };

    notification.innerHTML = `
            <span>${icons[type]} ${message}</span>
            <button class="notification-close">&times;</button>
        `;

    // Estilos específicos para notificaciones meteorológicas
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minWidth: '320px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      backdropFilter: 'blur(10px)',
    });

    // Colores específicos para tema meteorológico
    const colors = {
      success: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
      warning: 'linear-gradient(135deg, #FF9800, #F57C00)',
      error: 'linear-gradient(135deg, #FF6B6B, #EE5A52)',
      info: 'linear-gradient(135deg, #667eea, #764ba2)',
    };
    notification.style.background = colors[type] || colors.info;

    // Botón de cerrar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '0';
    closeBtn.style.marginLeft = 'auto';

    // Agregar al DOM
    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Función para remover notificación
    const removeNotification = () => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };

    // Event listeners
    closeBtn.addEventListener('click', removeNotification);

    // Auto-remover después de la duración especificada
    if (duration > 0) {
      setTimeout(removeNotification, duration);
    }

    return notification;
  }

  /**
   * Actualiza el estado de los filtros en la UI
   * @param {Object} filters - Estado actual de los filtros
   */
  updateFiltersDisplay(filters) {
    // Actualizar indicador de filtros activos
    const activeFilters =
      window.weatherFilterManager?.getActiveFiltersDescription() ||
      'Sin filtros activos';

    // Crear o actualizar indicador de filtros
    let filterIndicator = document.getElementById('weather-filter-indicator');
    if (!filterIndicator) {
      filterIndicator = document.createElement('div');
      filterIndicator.id = 'weather-filter-indicator';
      filterIndicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 10px 16px;
                border-radius: 25px;
                font-size: 12px;
                z-index: 1000;
                max-width: 350px;
                word-wrap: break-word;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                backdrop-filter: blur(10px);
            `;
      document.body.appendChild(filterIndicator);
    }

    filterIndicator.textContent = `${activeFilters}`;

    // Ocultar si no hay filtros activos
    if (activeFilters === 'Sin filtros activos') {
      filterIndicator.style.display = 'none';
    } else {
      filterIndicator.style.display = 'block';
    }
  }

  /**
   * Exporta todos los gráficos meteorológicos de una sección
   * @param {string} sectionId - ID de la sección
   * @param {string} format - Formato de exportación
   */
  exportAllWeatherCharts(sectionId, format) {
    try {
      const section = document.getElementById(sectionId);
      if (!section) return;

      const chartContainers = section.querySelectorAll(
        '.chart-container > div[id$="-chart"]'
      );

      chartContainers.forEach((container, index) => {
        const chartId = container.id;
        const filename = `weather_${chartId}_${
          new Date().toISOString().split('T')[0]
        }`;

        if (sectionId === 'plotly-charts') {
          window.weatherPlotlyCharts.exportChart(chartId, format, filename);
        } else if (sectionId === 'd3-charts' && format === 'svg') {
          window.weatherD3Charts.exportSVG(chartId, filename);
        }
      });

      this.showWeatherNotification(
        `Gráficos meteorológicos exportados en formato ${format.toUpperCase()}`,
        'success'
      );
    } catch (error) {
      console.error('Error exportando gráficos meteorológicos:', error);
      this.showWeatherNotification(
        'Error al exportar gráficos meteorológicos',
        'error'
      );
    }
  }

  /**
   * Exporta datos meteorológicos filtrados como CSV
   */
  exportWeatherData() {
    try {
      if (!window.weatherStateManager) return;

      const filteredData =
        window.weatherStateManager.getStateValue('filteredData');
      if (!filteredData || filteredData.length === 0) {
        this.showWeatherNotification('No hay datos para exportar', 'warning');
        return;
      }

      // Convertir a CSV
      const headers = [
        'País',
        'Ciudad',
        'Temperatura (°C)',
        'Humedad (%)',
        'Condición',
        'Viento (km/h)',
        'Presión (mb)',
      ];
      const csvContent = [
        headers.join(','),
        ...filteredData.map((row) =>
          [
            row.country || '',
            row.location_name || '',
            row.temperature_celsius || 0,
            row.humidity || 0,
            row.condition_text || '',
            row.wind_kph || 0,
            row.pressure_mb || 0,
          ].join(',')
        ),
      ].join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `datos_meteorologicos_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showWeatherNotification(
        'Datos meteorológicos exportados como CSV',
        'success'
      );
    } catch (error) {
      console.error('Error exportando datos meteorológicos:', error);
      this.showWeatherNotification('Error al exportar datos', 'error');
    }
  }

  /**
   * Genera un reporte meteorológico completo
   */
  generateWeatherReport() {
    try {
      if (!window.weatherStateManager || !window.weatherFilterManager) return;

      const filteredData =
        window.weatherStateManager.getStateValue('filteredData');
      const stats = window.weatherFilterManager.getFilteredStats(filteredData);
      const filters = window.weatherFilterManager.getActiveFiltersDescription();

      const reportContent = `
# Reporte Meteorológico Global

**Fecha de generación:** ${new Date().toLocaleString('es-ES')}

## Resumen de Datos
- **Registros analizados:** ${stats.count.toLocaleString()}
- **Temperatura promedio:** ${stats.avgTemp}°C
- **Humedad promedio:** ${stats.avgHumidity}%
- **Países incluidos:** ${stats.countries}
- **Condiciones climáticas:** ${stats.conditions}

## Filtros Aplicados
${filters}

## Análisis
Este reporte incluye datos meteorológicos de ${
        stats.countries
      } países con una temperatura promedio de ${
        stats.avgTemp
      }°C y humedad promedio de ${stats.avgHumidity}%.

---
*Generado por Dashboard de Clima Global*
            `;

      // Descargar reporte
      const blob = new Blob([reportContent], {
        type: 'text/markdown;charset=utf-8;',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_meteorologico_${
        new Date().toISOString().split('T')[0]
      }.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showWeatherNotification('Reporte meteorológico generado', 'success');
    } catch (error) {
      console.error('Error generando reporte meteorológico:', error);
      this.showWeatherNotification('Error al generar reporte', 'error');
    }
  }

  /**
   * Obtiene la sección actual
   * @returns {string} ID de la sección actual
   */
  getCurrentSection() {
    return this.currentSection;
  }

  /**
   * Verifica si está en modo de carga
   * @returns {boolean} True si está cargando
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Limpia todos los elementos temporales de la UI
   */
  cleanup() {
    // Remover notificaciones
    document
      .querySelectorAll('.weather-notification')
      .forEach((el) => el.remove());

    // Remover indicador de filtros
    const filterIndicator = document.getElementById('weather-filter-indicator');
    if (filterIndicator) filterIndicator.remove();

    console.log('UI meteorológica limpiada');
  }
}

// Instancia global del controlador de UI meteorológico
window.weatherUIController = new WeatherUIController();
