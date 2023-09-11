import * as d3 from 'd3'
import { ChartData } from '../types'

export const generateD3Chart = (
  stockSymbol: string,
  data: ChartData[],
  element: HTMLDivElement,
  width: number,
  height: number
) => {
  // Define margins
  const margin = { top: 20, right: 200, bottom: 20, left: 40 }

  // Define the scale for the X axis
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date) as [Date, Date])
    .range([0, width])

  // Create the X Axis
  const xAxis = d3
    .axisBottom<Date>(x)
    .ticks(11) // we want to show monthly ticks
    .tickFormat(d3.timeFormat('%b %Y'))

  // Define the scale for the Y axis
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.close * 1.2) as number])
    .range([height, 0])

  // Create the Y Axis
  const yAxis = d3
    .axisLeft(y)
    .tickSize(5)

  // Define the stock close price line
  const line = d3.line<ChartData>()
    .x(d => x(d.date))
    .y(d => y(d.close))
    .curve(d3.curveCardinal) // make the line smoother

  // Define the area under the stock close price line
  const area = d3
    .area<ChartData>()
    .x(d => x(d.date))
    .y0(height)
    .y1(d => y(d.close))
    .curve(d3.curveCardinal) // make the area's line smoother

  // Create the SVG
  const svg = d3.select(element)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
    .attr('style', 'max-width: 100%; height: auto;')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Append the X axis to the SVG. Don't add a label because ticks' texts are self-explanatory
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick text').attr('font-size', '1.2em'))
    .append('text')
    .attr('fill', '#000')
    .attr('x', width / 2)
    .attr('y', margin.bottom)
    .attr('dy', 0)

  // Append the Y axis to the SVG, add lines parallel to the X axis, and add a label
  svg.append('g')
    .call(yAxis)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').clone()
      .attr('x2', width)
      .attr('stroke-opacity', 0.1))
    .call(g => g.select('.tick:last-of-type text').clone()
      .attr('x', 3)
      .attr('text-anchor', 'start')
      .attr('font-weight', 'bold')
      .text(`${stockSymbol} daily close ($)`)
      .attr('font-size', '1.5em'))
    .call(g => g.selectAll('.tick text').attr('font-size', '1.2em'))
    .append('text')
    .attr('fill', '#000')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left)
    .attr('dy', '1em')

  // Add the stock close price line
  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)
    .attr('d', line)

  // Add the area under the stock close price line
  svg.append('path')
    .datum(data)
    .attr('fill', 'lightsteelblue')
    .attr('opacity', 0.5)
    .attr('d', area)

  // Add the container for elements that travels along the chart following the mouse
  const focus = svg
    .append('g')
    .attr('class', 'focus')
    .style('display', 'none')

  // Append the projection line to the X axis
  focus
    .append('line')
    .attr('class', 'x-projection')
    .attr('stroke', 'brown')
    .style('stroke-dasharray', '3,3')
    .style('opacity', 0.7)
    .attr('y1', 0)
    .attr('y2', height)

  // Append the projection line to the Y axis
  focus
    .append('line')
    .attr('class', 'y-projection')
    .attr('stroke', 'brown')
    .style('stroke-dasharray', '3,3')
    .style('opacity', 0.7)
    .attr('x1', width)
    .attr('x2', width)

  // Append the circle at the lines intersection
  focus
    .append('circle')
    .attr('class', 'y')
    .attr('stroke', 'brown')
    .style('fill', 'none')
    .attr('r', 5)
    .attr('stroke-width', 2)

  // Place the close price value near the intersection
  focus
    .append('text')
    .attr('class', 'close-price')
    .attr('dx', 8)
    .attr('dy', '1em')
    .attr('stroke', 'steelblue')
    .attr('font-weight', 'normal')

  // Place the date near the intersection
  focus
    .append('text')
    .attr('class', 'date')
    .attr('dx', 8)
    .attr('dy', '-0.5em')
    .attr('stroke', 'steelblue')
    .attr('font-weight', 'normal')


  function mouseMove(event: MouseEvent) {
    // Recover coordinate we need
    const bisect = d3.bisector((d: ChartData) => d.date).left,
      x0 = x.invert(d3.pointer(event)[0]), // the current mouse position
      i = bisect(data, x0, 1), // the index in the data array which is on the left of the mouse position
      d0 = data[i - 1], // the data on the left of the mouse position
      d1 = data[i], // the data on the right of the mouse position
      d = +x0 - +d0.date > +d1.date - +x0 ? d1 : d0 // choose the nearest data point

    // Move the circle
    focus
      .select('circle.y')
      .attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')')

    // Move the text
    focus
      .select('text.close-price')
      .attr('transform', 'translate(' + x(d.date) + ',' + y(d.close / 3) + ')')
      .text(`Close: US $ ${d.close}`)
    focus
      .select('text.date')
      .attr('transform', 'translate(' + x(d.date) + ',' + y(d.close / 3) + ')')
      .text(`Date:  ${d3.timeFormat('%b %d, %Y')(d.date)}`)

    // Move projection lines
    focus
      .select('.x-projection')
      .attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')')
      .attr('y2', height - y(d.close))
    focus
      .select('.y-projection')
      .attr('transform', 'translate(' + width * -1 + ',' + y(d.close) + ')')
      .attr('x2', width + width)

    // Remove the previous tooltip
    svg.select('#side-tooltip').remove()

    // Add a side tooltip
    svg.append('text')
      .attr('id', 'side-tooltip')
      .attr('x', () => 10)
      .attr('y', () => 10)
      .attr('x', () => width + 10)
      .attr('y', () => 10)
      .selectAll('tspan')
      .data([
        'Date: ' + d3.timeFormat('%b %d, %Y')(d.date),
        'Open: ' + d.open.toLocaleString('en-US'),
        'High: ' + d.high.toLocaleString('en-US'),
        'Low: ' + d.low.toLocaleString('en-US'),
        'Close: ' + d.close.toLocaleString('en-US'),
        'Adjusted Close: ' + d.adjusted_close.toLocaleString('en-US'),
        'Volume: ' + d.volume.toLocaleString('en-US')
      ])
      .enter()
      .append('tspan')
      .attr('font-weight', 'bold')
      .attr('fill', 'steelblue')
      .attr('x',
        function () { return d3.select(<HTMLElement>this.parentNode).attr('x') })
      .attr('y', function (_data, i) { return 15 + (i * 25) })
      .text(function (data) { return data })
  }

  // Add the overlay rectangle to capture mouse events
  svg
    .append('rect')
    .attr('width', width)
    .attr('height', height)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mouseover', () => {
      focus.style('display', null)
    })
    .on('mouseout', () => {
      focus.style('display', 'none')
      svg.select('#side-tooltip').remove()
    })
    .on('touchmove mousemove', mouseMove)
}