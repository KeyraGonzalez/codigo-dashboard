/**
 * WeatherPlotlyCharts - Maneja todas las visualizaciones meteorológicas con Plotly.js
 * Incluye todos los tipos de gráficos requeridos adaptados para datos de clima
 */
class WeatherPlotlyCharts {
  constructor() {
    this.charts = {};
    this.defaultLayout = {
      font: { family: 'Segoe UI, sans-serif', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(248,249,250,0.8)',
      margin: { l: 60, r: 30, t: 80, b: 60 },
      autosize: true,
      width: null,
      height: 400,
    };
    this.config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
      displaylogo: false,
    };
  }

  /**
   * Función helper para crear gráficos con redimensionamiento automático
   * @param {string} containerId - ID del contenedor
   * @param {Array} traces - Trazas del gráfico
   * @param {Object} layout - Layout del gráfico
   */
  createPlotlyChart(containerId, traces, layout) {
    try {
      Plotly.newPlot(containerId, traces, layout, this.config);
      this.charts[containerId] = { traces, layout };

      // Redimensionar después de un breve delay para asegurar que el DOM esté listo
      setTimeout(() => {
        this.resizeChart(containerId);
      }, 100);
    } catch (error) {
      console.error(`Error creando gráfico ${containerId}:`, error);
    }
  }

  /**
   * Crea gráfico combinado (temperatura + humedad)
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos procesados
   */
  createCombinedChart(containerId, data) {
    const trace1 = {
      x: data.labels,
      y: data.y1,
      type: 'bar',
      name: 'Temperatura Promedio (°C)',
      marker: {
        color: '#FF6B6B',
        line: { color: '#FF5252', width: 1 },
      },
      yaxis: 'y',
    };

    const trace2 = {
      x: data.labels,
      y: data.y2,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Humedad Promedio (%)',
      line: { color: '#4ECDC4', width: 3 },
      marker: { size: 8, color: '#26A69A' },
      yaxis: 'y2',
    };

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '🌡️ Temperatura y Humedad Promedio por Mes',
        font: { size: 16, color: '#2C3E50' },
      },
      xaxis: {
        title: 'Mes',
        gridcolor: '#E0E0E0',
      },
      yaxis: {
        title: 'Temperatura (°C)',
        side: 'left',
        color: '#FF6B6B',
        gridcolor: '#FFE0E0',
      },
      yaxis2: {
        title: 'Humedad (%)',
        side: 'right',
        overlaying: 'y',
        color: '#4ECDC4',
        gridcolor: '#E0F7F5',
      },
      legend: {
        x: 0,
        y: 1.1,
        orientation: 'h',
        bgcolor: 'rgba(255,255,255,0.8)',
      },
    };

    this.createPlotlyChart(containerId, [trace1, trace2], layout);
  }

  /**
   * Crea gráfico de cascada (cambios estacionales)
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos procesados
   */
  createWaterfallChart(containerId, data) {
    const trace = {
      x: data.x,
      y: data.y,
      type: 'waterfall',
      measure: data.measure,
      connector: {
        line: { color: 'rgb(63, 63, 63)' },
      },
      increasing: { marker: { color: '#FF9800' } },
      decreasing: { marker: { color: '#2196F3' } },
      totals: { marker: { color: '#4CAF50' } },
      textposition: 'outside',
      textfont: { color: '#2C3E50' },
    };

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '📊 Cambios de Temperatura por Trimestre',
        font: { size: 16, color: '#2C3E50' },
      },
      xaxis: {
        title: 'Período',
        gridcolor: '#E0E0E0',
      },
      yaxis: {
        title: 'Temperatura (°C)',
        gridcolor: '#E0E0E0',
      },
    };

    this.createPlotlyChart(containerId, [trace], layout);
  }

  /**
   * Crea mapa de árbol (países por temperatura)
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos jerárquicos
   */
  createTreemap(containerId, data) {
    const trace = {
      type: 'treemap',
      labels: data.labels,
      parents: data.parents,
      values: data.values,
      textinfo: 'label+value',
      textfont: { size: 11 },
      marker: {
        colorscale: [
          [0, '#2196F3'], // Azul para frío
          [0.25, '#00BCD4'], // Cian
          [0.5, '#4CAF50'], // Verde para templado
          [0.75, '#FF9800'], // Naranja
          [1, '#F44336'], // Rojo para caliente
        ],
        showscale: true,
        colorbar: {
          title: 'Categoría Térmica',
          titleside: 'right',
        },
      },
    };

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '🌳 Países Organizados por Temperatura',
        font: { size: 16, color: '#2C3E50' },
      },
    };

    this.createPlotlyChart(containerId, [trace], layout);
  }

  /**
   * Crea diagrama de Sankey (flujo climático)
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Nodos y enlaces
   */
  createSankeyDiagram(containerId, data) {
    const trace = {
      type: 'sankey',
      node: {
        pad: 15,
        thickness: 20,
        line: { color: 'black', width: 0.5 },
        label: data.nodes.map((node) => node.label),
        color: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7',
          '#DDA0DD',
        ],
      },
      link: {
        source: data.links.map((link) => link.source),
        target: data.links.map((link) => link.target),
        value: data.links.map((link) => link.value),
        color: 'rgba(70, 130, 180, 0.4)',
      },
    };

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '🌊 Flujo de Condiciones Climáticas por Región',
        font: { size: 16, color: '#2C3E50' },
      },
      font: { size: 10 },
    };

    this.createPlotlyChart(containerId, [trace], layout);
  }

  /**
   * Crea gráfico de enjambre (distribución de temperaturas)
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos por condición climática
   */
  createSwarmPlot(containerId, data) {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#FF8A65',
      '#A1C4FD',
    ];

    const traces = Object.entries(data).map(
      ([condition, conditionData], index) => ({
        x: conditionData.x,
        y: conditionData.y,
        type: 'scatter',
        mode: 'markers',
        name: condition,
        text: conditionData.text,
        hovertemplate: '%{text}<extra></extra>',
        marker: {
          size: 6,
          color: colors[index % colors.length],
          opacity: 0.7,
          line: { width: 1, color: 'white' },
        },
      })
    );

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '🐝 Distribución de Temperaturas por Condición Climática',
        font: { size: 16, color: '#2C3E50' },
      },
      xaxis: {
        title: 'Condición Climática',
        gridcolor: '#E0E0E0',
      },
      yaxis: {
        title: 'Temperatura (°C)',
        gridcolor: '#E0E0E0',
      },
      showlegend: true,
      legend: {
        orientation: 'v',
        x: 1.02,
        y: 1,
      },
    };

    this.createPlotlyChart(containerId, traces, layout);
  }

  /**
   * Crea mapa geográfico (temperaturas mundiales)
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos geográficos
   */
  createGeoMap(containerId, data) {
    const trace = {
      type: 'choropleth',
      locationmode: 'country names',
      locations: data.countries,
      z: data.z,
      text: data.text,
      hovertemplate: '%{text}<extra></extra>',
      colorscale: [
        [0, '#2196F3'], // Azul para frío
        [0.25, '#00BCD4'], // Cian
        [0.5, '#4CAF50'], // Verde
        [0.75, '#FF9800'], // Naranja
        [1, '#F44336'], // Rojo para caliente
      ],
      colorbar: {
        title: 'Temperatura (°C)',
        titleside: 'right',
      },
    };

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '🗺️ Temperaturas Promedio Mundiales',
        font: { size: 16, color: '#2C3E50' },
      },
      geo: {
        showframe: false,
        showcoastlines: true,
        projection: { type: 'natural earth' },
      },
    };

    this.createPlotlyChart(containerId, [trace], layout);
  }

  /**
   * Crea gráfico de embudo (condiciones climáticas)
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos del embudo
   */
  createFunnelChart(containerId, data) {
    const trace = {
      type: 'funnel',
      y: data.y,
      x: data.x,
      textinfo: 'value+percent initial',
      textposition: 'inside',
      textfont: { color: 'white', size: 12 },
      marker: {
        color: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7',
          '#DDA0DD',
          '#FF8A65',
        ],
      },
      connector: {
        line: { color: 'royalblue', dash: 'dot', width: 3 },
      },
    };

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '📉 Distribución de Condiciones Climáticas',
        font: { size: 16, color: '#2C3E50' },
      },
    };

    this.createPlotlyChart(containerId, [trace], layout);
  }

  /**
   * Crea gráfico radar (métricas por región)
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos por región
   */
  createRadarChart(containerId, data) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    const traces = Object.entries(data).map(([region, regionData], index) => ({
      type: 'scatterpolar',
      r: regionData.r,
      theta: regionData.theta,
      fill: 'toself',
      name: region,
      line: { color: colors[index % colors.length] },
      fillcolor: `${colors[index % colors.length]}20`,
    }));

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '🕸️ Comparación de Métricas Climáticas por Región',
        font: { size: 16, color: '#2C3E50' },
      },
      polar: {
        radialaxis: {
          visible: true,
          range: [
            0,
            Math.max(...Object.values(data).flatMap((d) => d.r)) * 1.1,
          ],
        },
      },
      showlegend: true,
      legend: {
        orientation: 'v',
        x: 1.02,
        y: 1,
      },
    };

    this.createPlotlyChart(containerId, traces, layout);
  }

  /**
   * Crea mapa de calor de correlación
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Matriz de correlación
   */
  createHeatmap(containerId, data) {
    const trace = {
      z: data.z,
      x: data.x,
      y: data.y,
      type: 'heatmap',
      colorscale: 'RdBu',
      zmid: 0,
      text: data.z.map((row) => row.map((val) => val.toFixed(2))),
      texttemplate: '%{text}',
      textfont: { size: 10 },
      hoverongaps: false,
      colorbar: {
        title: 'Correlación',
        titleside: 'right',
      },
    };

    const layout = {
      ...this.defaultLayout,
      title: {
        text: '🔥 Correlación entre Variables Meteorológicas',
        font: { size: 16, color: '#2C3E50' },
      },
      xaxis: {
        title: 'Variables',
        side: 'bottom',
      },
      yaxis: {
        title: 'Variables',
      },
    };

    this.createPlotlyChart(containerId, [trace], layout);
  }

  /**
   * Actualiza un gráfico existente con nuevos datos
   * @param {string} containerId - ID del contenedor
   * @param {Object} newData - Nuevos datos
   * @param {string} chartType - Tipo de gráfico
   */
  updateChart(containerId, newData, chartType) {
    if (!this.charts[containerId]) {
      console.warn(`⚠️ Gráfico ${containerId} no encontrado`);
      return;
    }

    try {
      switch (chartType) {
        case 'combined':
          this.createCombinedChart(containerId, newData);
          break;
        case 'waterfall':
          this.createWaterfallChart(containerId, newData);
          break;
        case 'treemap':
          this.createTreemap(containerId, newData);
          break;
        case 'sankey':
          this.createSankeyDiagram(containerId, newData);
          break;
        case 'swarm':
          this.createSwarmPlot(containerId, newData);
          break;
        case 'geo':
          this.createGeoMap(containerId, newData);
          break;
        case 'funnel':
          this.createFunnelChart(containerId, newData);
          break;
        case 'radar':
          this.createRadarChart(containerId, newData);
          break;
        case 'heatmap':
          this.createHeatmap(containerId, newData);
          break;
        default:
          console.warn(`⚠️ Tipo de gráfico ${chartType} no reconocido`);
      }
    } catch (error) {
      console.error(`❌ Error actualizando gráfico ${containerId}:`, error);
    }
  }

  /**
   * Redimensiona todos los gráficos
   */
  resizeCharts() {
    Object.keys(this.charts).forEach((containerId) => {
      try {
        const container = document.getElementById(containerId);
        if (container && container.offsetParent !== null) {
          // Solo redimensionar si el contenedor es visible
          Plotly.Plots.resize(containerId);
        }
      } catch (error) {
        console.error(`Error redimensionando gráfico ${containerId}:`, error);
      }
    });
  }

  /**
   * Redimensiona un gráfico específico
   * @param {string} containerId - ID del contenedor
   */
  resizeChart(containerId) {
    try {
      const container = document.getElementById(containerId);
      if (
        container &&
        container.offsetParent !== null &&
        this.charts[containerId]
      ) {
        Plotly.Plots.resize(containerId);
      }
    } catch (error) {
      console.error(`Error redimensionando gráfico ${containerId}:`, error);
    }
  }

  /**
   * Limpia un gráfico específico
   * @param {string} containerId - ID del contenedor
   */
  clearChart(containerId) {
    if (this.charts[containerId]) {
      Plotly.purge(containerId);
      delete this.charts[containerId];
    }
  }

  /**
   * Limpia todos los gráficos
   */
  clearAllCharts() {
    Object.keys(this.charts).forEach((containerId) => {
      this.clearChart(containerId);
    });
  }

  /**
   * Exporta un gráfico como imagen
   * @param {string} containerId - ID del contenedor
   * @param {string} format - Formato (png, jpeg, pdf, svg)
   * @param {string} filename - Nombre del archivo
   */
  exportChart(containerId, format = 'png', filename = 'weather_chart') {
    if (!this.charts[containerId]) {
      console.warn(`⚠️ Gráfico ${containerId} no encontrado`);
      return;
    }

    Plotly.downloadImage(containerId, {
      format: format,
      width: 1200,
      height: 800,
      filename: filename,
    });
  }
}

// Instancia global del manejador de gráficos meteorológicos Plotly
window.weatherPlotlyCharts = new WeatherPlotlyCharts();
