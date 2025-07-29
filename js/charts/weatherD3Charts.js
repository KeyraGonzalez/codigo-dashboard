/**
 * WeatherD3Charts - Maneja visualizaciones meteorológicas personalizadas con D3.js
 * Incluye gráficos de Cinta (Ribbon), Pareto y Densidad (KDE) para datos climáticos
 */
class WeatherD3Charts {
  constructor() {
    this.charts = {};
    this.colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#FF8A65',
      '#A1C4FD',
    ];
    this.margin = { top: 80, right: 100, bottom: 80, left: 80 };
  }

  /**
   * Crea gráfico de cinta (Ribbon Chart) para conexiones climáticas
   * @param {string} containerId - ID del contenedor
   * @param {Array} data - Datos para el ribbon
   */
  createRibbonChart(containerId, data) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();

    const width = 600;
    const height = 400;
    const innerRadius = 100;
    const outerRadius = 180;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Título
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#2C3E50')
      .text('🎀 Conexiones entre Condiciones Climáticas');

    // Datos simulados para ribbon basados en condiciones climáticas comunes
    const matrix = [
      [0, 1200, 800, 600, 400], // Sunny
      [1200, 0, 1500, 300, 200], // Cloudy
      [800, 1500, 0, 900, 100], // Partly cloudy
      [600, 300, 900, 0, 700], // Overcast
      [400, 200, 100, 700, 0], // Clear
    ];

    const names = [
      'Soleado',
      'Nublado',
      'Parcialmente Nublado',
      'Cubierto',
      'Despejado',
    ];

    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    const ribbon = d3.ribbon().radius(innerRadius);

    const chords = chord(matrix);

    // Grupos (arcos externos)
    const group = g
      .append('g')
      .selectAll('g')
      .data(chords.groups)
      .enter()
      .append('g');

    group
      .append('path')
      .style('fill', (d, i) => this.colors[i])
      .style('stroke', '#fff')
      .style('stroke-width', '2px')
      .attr('d', arc);

    group
      .append('text')
      .each((d) => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '.35em')
      .attr(
        'transform',
        (d) => `
                rotate(${(d.angle * 180) / Math.PI - 90})
                translate(${outerRadius + 15})
                ${d.angle > Math.PI ? 'rotate(180)' : ''}
            `
      )
      .style('text-anchor', (d) => (d.angle > Math.PI ? 'end' : null))
      .style('font-size', '12px')
      .style('fill', '#2C3E50')
      .text((d, i) => names[i]);

    // Ribbons (conexiones)
    g.append('g')
      .selectAll('path')
      .data(chords)
      .enter()
      .append('path')
      .attr('d', ribbon)
      .style('fill', (d) => this.colors[d.source.index])
      .style('opacity', 0.7)
      .style('stroke', '#fff')
      .style('stroke-width', '1px')
      .on('mouseover', function (event, d) {
        d3.select(this).style('opacity', 1);

        // Tooltip
        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'd3-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('opacity', 0);

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(
            `${names[d.source.index]} ↔ ${
              names[d.target.index]
            }<br/>Conexiones: ${d.source.value}`
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 0.7);
        d3.selectAll('.d3-tooltip').remove();
      });

    this.charts[containerId] = { svg, type: 'ribbon' };
  }

  /**
   * Crea gráfico de Pareto para análisis de países por temperatura
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos procesados para Pareto
   */
  createParetoChart(containerId, data) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();

    const width = 700;
    const height = 450;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    const innerWidth = width - this.margin.left - this.margin.right;
    const innerHeight = height - this.margin.top - this.margin.bottom;

    // Título
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#2C3E50')
      .text('📊 Análisis de Pareto - Países por Temperatura');

    // Escalas
    const xScale = d3
      .scaleBand()
      .domain(data.categories)
      .range([0, innerWidth])
      .padding(0.1);

    const yScaleLeft = d3
      .scaleLinear()
      .domain([d3.min(data.values), d3.max(data.values)])
      .range([innerHeight, 0]);

    const yScaleRight = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Ejes
    const xAxis = d3.axisBottom(xScale);
    const yAxisLeft = d3
      .axisLeft(yScaleLeft)
      .tickFormat((d) => d.toFixed(1) + '°C');
    const yAxisRight = d3.axisRight(yScaleRight).tickFormat((d) => d + '%');

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '10px');

    g.append('g').call(yAxisLeft);

    g.append('g')
      .attr('transform', `translate(${innerWidth}, 0)`)
      .call(yAxisRight);

    // Barras con gradiente de color basado en temperatura
    const colorScale = d3
      .scaleSequential(d3.interpolateRdYlBu)
      .domain([d3.max(data.values), d3.min(data.values)]);

    g.selectAll('.bar')
      .data(data.categories)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d))
      .attr('width', xScale.bandwidth())
      .attr('y', (d, i) => yScaleLeft(data.values[i]))
      .attr('height', (d, i) => innerHeight - yScaleLeft(data.values[i]))
      .attr('fill', (d, i) => colorScale(data.values[i]))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8)
      .on('mouseover', function (event, d, i) {
        d3.select(this).attr('opacity', 1);

        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'd3-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('opacity', 0);

        const index = data.categories.indexOf(d);
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(
            `🌍 ${d}<br/>🌡️ Temperatura: ${data.values[index].toFixed(
              1
            )}°C<br/>📊 % Individual: ${data.percentages[index].toFixed(
              1
            )}%<br/>📈 % Acumulado: ${data.cumulative[index].toFixed(1)}%`
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.8);
        d3.selectAll('.d3-tooltip').remove();
      });

    // Línea de Pareto (acumulativa)
    const line = d3
      .line()
      .x((d, i) => xScale(data.categories[i]) + xScale.bandwidth() / 2)
      .y((d) => yScaleRight(d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data.cumulative)
      .attr('fill', 'none')
      .attr('stroke', '#FF6B6B')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Puntos en la línea
    g.selectAll('.dot')
      .data(data.cumulative)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d, i) => xScale(data.categories[i]) + xScale.bandwidth() / 2)
      .attr('cy', (d) => yScaleRight(d))
      .attr('r', 4)
      .attr('fill', '#FF6B6B')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Línea del 80%
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScaleRight(80))
      .attr('y2', yScaleRight(80))
      .attr('stroke', '#FF9800')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    g.append('text')
      .attr('x', innerWidth - 50)
      .attr('y', yScaleRight(80) - 5)
      .style('font-size', '12px')
      .style('fill', '#FF9800')
      .style('font-weight', 'bold')
      .text('80%');

    // Etiquetas de ejes
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 20)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#2C3E50')
      .text('Temperatura (°C)');

    svg
      .append('text')
      .attr('x', width - 20)
      .attr('y', height / 2)
      .attr('transform', `rotate(90, ${width - 20}, ${height / 2})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#2C3E50')
      .text('% Acumulado');

    this.charts[containerId] = { svg, type: 'pareto' };
  }

  /**
   * Crea gráfico de densidad (KDE) para distribución de temperaturas
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos para KDE
   */
  createKDEChart(containerId, data) {
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();

    const width = 700;
    const height = 450;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    const innerWidth = width - this.margin.left - this.margin.right;
    const innerHeight = height - this.margin.top - this.margin.bottom;

    // Título
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#2C3E50')
      .text('📈 Distribución de Densidad de Temperaturas Globales');

    // Escalas
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data.x))
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data.y)])
      .range([innerHeight, 0]);

    // Ejes
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => d + '°C');
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.3f'));

    g.append('g').attr('transform', `translate(0, ${innerHeight})`).call(xAxis);

    g.append('g').call(yAxis);

    // Línea de densidad
    const line = d3
      .line()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveCardinal);

    const lineData = data.x.map((x, i) => ({ x: x, y: data.y[i] }));

    // Área bajo la curva con gradiente
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'temperature-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', innerHeight)
      .attr('x2', 0)
      .attr('y2', 0);

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4ECDC4')
      .attr('stop-opacity', 0.8);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FF6B6B')
      .attr('stop-opacity', 0.3);

    const area = d3
      .area()
      .x((d) => xScale(d.x))
      .y0(innerHeight)
      .y1((d) => yScale(d.y))
      .curve(d3.curveCardinal);

    g.append('path')
      .datum(lineData)
      .attr('fill', 'url(#temperature-gradient)')
      .attr('d', area);

    g.append('path')
      .datum(lineData)
      .attr('fill', 'none')
      .attr('stroke', '#FF6B6B')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Puntos de datos originales (rug plot) - muestra limitada
    if (data.values && data.values.length > 0) {
      const sampleValues = data.values.filter((_, i) => i % 50 === 0); // Cada 50 valores

      g.selectAll('.rug')
        .data(sampleValues)
        .enter()
        .append('line')
        .attr('class', 'rug')
        .attr('x1', (d) => xScale(d))
        .attr('x2', (d) => xScale(d))
        .attr('y1', innerHeight)
        .attr('y2', innerHeight - 10)
        .attr('stroke', '#2C3E50')
        .attr('stroke-width', 1)
        .attr('opacity', 0.6);
    }

    // Estadísticas
    if (data.values && data.values.length > 0) {
      const mean = data.values.reduce((a, b) => a + b, 0) / data.values.length;
      const median = d3.median(data.values);
      const q1 = d3.quantile(data.values.sort(d3.ascending), 0.25);
      const q3 = d3.quantile(data.values.sort(d3.ascending), 0.75);

      // Línea de media
      g.append('line')
        .attr('x1', xScale(mean))
        .attr('x2', xScale(mean))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#FF6B6B')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      g.append('text')
        .attr('x', xScale(mean) + 5)
        .attr('y', 20)
        .style('font-size', '12px')
        .style('fill', '#FF6B6B')
        .style('font-weight', 'bold')
        .text(`Media: ${mean.toFixed(1)}°C`);

      // Línea de mediana
      g.append('line')
        .attr('x1', xScale(median))
        .attr('x2', xScale(median))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#4ECDC4')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3');

      g.append('text')
        .attr('x', xScale(median) + 5)
        .attr('y', 40)
        .style('font-size', '12px')
        .style('fill', '#4ECDC4')
        .style('font-weight', 'bold')
        .text(`Mediana: ${median.toFixed(1)}°C`);

      // Cuartiles
      g.append('line')
        .attr('x1', xScale(q1))
        .attr('x2', xScale(q1))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#96CEB4')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      g.append('line')
        .attr('x1', xScale(q3))
        .attr('x2', xScale(q3))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#96CEB4')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');
    }

    // Etiquetas de ejes
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#2C3E50')
      .text('Temperatura (°C)');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 20)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#2C3E50')
      .text('Densidad');

    // Interactividad
    const focus = g.append('g').attr('class', 'focus').style('display', 'none');

    focus
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#FF6B6B')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    focus
      .append('text')
      .attr('x', 9)
      .attr('dy', '.35em')
      .style('font-size', '12px')
      .style('fill', '#2C3E50');

    const bisect = d3.bisector((d) => d.x).left;

    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => focus.style('display', null))
      .on('mouseout', () => focus.style('display', 'none'))
      .on('mousemove', function (event) {
        const x0 = xScale.invert(d3.pointer(event)[0]);
        const i = bisect(lineData, x0, 1);
        if (i < lineData.length) {
          const d0 = lineData[i - 1];
          const d1 = lineData[i];
          const d = x0 - d0.x > d1.x - x0 ? d1 : d0;

          focus.attr('transform', `translate(${xScale(d.x)}, ${yScale(d.y)})`);
          focus.select('text').text(`${d.x.toFixed(1)}°C, ${d.y.toFixed(4)}`);
        }
      });

    this.charts[containerId] = { svg, type: 'kde' };
  }

  /**
   * Actualiza un gráfico D3.js existente
   * @param {string} containerId - ID del contenedor
   * @param {Object} newData - Nuevos datos
   * @param {string} chartType - Tipo de gráfico
   */
  updateChart(containerId, newData, chartType) {
    if (!this.charts[containerId]) {
      console.warn(`⚠️ Gráfico D3 ${containerId} no encontrado`);
      return;
    }

    try {
      switch (chartType) {
        case 'ribbon':
          this.createRibbonChart(containerId, newData);
          break;
        case 'pareto':
          this.createParetoChart(containerId, newData);
          break;
        case 'kde':
          this.createKDEChart(containerId, newData);
          break;
        default:
          console.warn(`⚠️ Tipo de gráfico D3 ${chartType} no reconocido`);
      }
    } catch (error) {
      console.error(`❌ Error actualizando gráfico D3 ${containerId}:`, error);
    }
  }

  /**
   * Limpia un gráfico específico
   * @param {string} containerId - ID del contenedor
   */
  clearChart(containerId) {
    if (this.charts[containerId]) {
      d3.select(`#${containerId}`).selectAll('*').remove();
      delete this.charts[containerId];
    }
  }

  /**
   * Limpia todos los gráficos D3
   */
  clearAllCharts() {
    Object.keys(this.charts).forEach((containerId) => {
      this.clearChart(containerId);
    });
  }

  /**
   * Exporta un gráfico D3 como SVG
   * @param {string} containerId - ID del contenedor
   * @param {string} filename - Nombre del archivo
   */
  exportSVG(containerId, filename = 'weather_chart') {
    if (!this.charts[containerId]) {
      console.warn(`⚠️ Gráfico D3 ${containerId} no encontrado`);
      return;
    }

    const svg = d3.select(`#${containerId} svg`);
    const svgData = new XMLSerializer().serializeToString(svg.node());
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${filename}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}

// Instancia global del manejador de gráficos meteorológicos D3
window.weatherD3Charts = new WeatherD3Charts();
