import * as d3 from 'd3'
import { ChartData } from '../types'

const getVolumeTickText = (value: d3.NumberValue): string => {
  const volume = +value
  if (volume >= 1_000_000) {
    return `${(+value / 1_000_000).toLocaleString('en-US')}M`
  } else if (volume >= 1_000) {
    return `${(+value / 1_000).toLocaleString('en-US')}K`
  } else {
    return `${volume.toLocaleString('en-US')}`
  }
}

export const generateD3Chart = (
  stockSymbol: string,
  data: ChartData[],
  element: HTMLDivElement,
  width: number,
  height: number
) => {
  // Define margins
  const margin = { top: 20, right: 250, bottom: 20, left: 40 }

  // Define the scale for the X axis
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date) as [Date, Date])
    .range([0, width])

  // Create the X Axis
  const xAxis = d3
    .axisBottom<Date>(x)
    .ticks(11) // we want to show monthly ticks
    .tickFormat(d3.timeFormat('%b %Y'))

  // Define the scale for the left Y axis (close price)
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.close * 1.2) as number])
    .range([height, 0])

  // Create the left Y Axis
  const yAxis = d3
    .axisLeft(y)
    .ticks(9)
    .tickSize(5)

  // Define the scale for the right Y axis (volume)
  const y1 = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.volume * 2) as number])
    .range([height, 0])

  // Create the right Y Axis
  const yAxis1 = d3
    .axisRight(y1)
    .tickSize(5)
    .tickFormat(getVolumeTickText)

  // Define the close price line
  const closePriceLine = d3.line<ChartData>()
    .x(d => x(d.date))
    .y(d => y(d.close))
    .curve(d3.curveCardinal) // make the line smoother

  // Define the volume area
  const volumeArea = d3
    .area<ChartData>()
    .x(d => x(d.date))
    .y0(height)
    .y1(d => y1(d.volume))


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

  // Append the X axis to the SVG. Don't add a label because tick texts are self-explanatory
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
    // Create a label for the Y axis
    .call(g => g.select('.tick:last-of-type text').clone()
      .attr('x', 3)
      .attr('text-anchor', 'start')
      .attr('font-weight', 'bold')
      .text(`${stockSymbol} daily close ($)`)
      .attr('font-size', '1.75em'))
    .call(g => g.selectAll('.tick text').attr('font-size', '1.2em'))

  // Append the right Y axis to the SVG and add a label
  svg.append('g')
    .attr('transform', `translate(${width}, 0)`)
    .call(yAxis1)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick text').attr('font-size', '1.2em'))
    .append('text') // Add the label
    .attr('transform', 'rotate(270)')
    .attr('font-size', '1.75em')
    .attr('x', -height + 5)
    .attr('y', -25)
    .attr('dy', '1em')
    .attr('fill', '#000')
    .text('Volume')

  // Add the close price line
  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)
    .attr('d', closePriceLine)

  // Add the area to represent volume values
  svg.append('path')
    .datum(data)
    .attr('fill', 'lightsteelblue')
    .attr('opacity', 0.5)
    .attr('d', volumeArea)

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

  // Place the date near the projection line to the X axis
  focus
    .append('text')
    .attr('class', 'date')
    .attr('stroke', 'brown')
    .attr('font-weight', 'normal')

  // Append the projection line to the left Y axis
  focus
    .append('line')
    .attr('class', 'y-projection')
    .attr('stroke', 'brown')
    .style('stroke-dasharray', '3,3')
    .style('opacity', 0.7)
    .attr('x1', width)
    .attr('x2', width)

  // Append the name of the projection line to the left Y axis and the current value
  focus
    .append('text')
    .attr('class', 'y-projection-name')
    .attr('dx', 0)
    .attr('dy', '1.25em')
    .attr('stroke', 'brown')
    .attr('font-weight', 'normal')

  // Append the projection line to the right Y axis
  focus
    .append('line')
    .attr('class', 'y1-projection')
    .attr('stroke', 'brown')
    .style('stroke-dasharray', '3,3')
    .style('opacity', 0.7)
    .attr('x1', width)
    .attr('x2', width)

  // Append the name of the projection line to the right Y axis and the current value
  focus
    .append('text')
    .attr('class', 'y1-projection-name')
    .attr('dx', 0)
    .attr('dy', '-0.5em')
    .attr('stroke', 'brown')
    .attr('font-weight', 'normal')

  // Append the circle at the intersection of the projection lines to X and left Y axes
  focus
    .append('circle')
    .attr('class', 'x-y')
    .attr('stroke', 'brown')
    .style('fill', 'none')
    .attr('r', 5)
    .attr('stroke-width', 2)

  // Append the circle at the intersection of the projection lines to X and right Y axes
  focus
    .append('circle')
    .attr('class', 'x-y1')
    .attr('stroke', 'brown')
    .style('fill', 'none')
    .attr('r', 5)
    .attr('stroke-width', 2)


  function mouseMove(event: MouseEvent) {
    // Recover coordinate we need
    const bisect = d3.bisector((d: ChartData) => d.date).left,
      x0 = x.invert(d3.pointer(event)[0]), // the current mouse position
      i = bisect(data, x0, 1), // the index in the data array which is on the left of the mouse position
      d0 = data[i - 1], // the data on the left of the mouse position
      d1 = data[i], // the data on the right of the mouse position
      d = +x0 - +d0.date > +d1.date - +x0 ? d1 : d0 // choose the nearest data point

    // Move intersection circles
    focus
      .select('circle.x-y')
      .attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')')
    focus
      .select('circle.x-y1')
      .attr('transform', 'translate(' + x(d.date) + ',' + y1(d.volume) + ')')

    // Move date text
    focus
      .select('text.date')
      .attr('transform', 'rotate(-90)')
      .attr('dy', x(d.date) - 15)
      .attr('x', -y(d.close / 2 - 50))
      .text(`Date:  ${d3.timeFormat('%b %d, %Y')(d.date)}`)

    // Move projection lines
    focus
      .select('.x-projection')
      .attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')')
      .attr('y2', height - y(d.close))
    focus
      .select('.y-projection')
      .attr('transform', 'translate(' + -width + ',' + y(d.close) + ')')
      .attr('x2', width + x(d.date))
    focus
      .select('.y1-projection')
      .attr('transform', 'translate(' + (-width + x(d.date)) + ',' + y1(d.volume) + ')')
      .attr('x2', width * 2 - x(d.date))

    // Move projection line names and values
    focus
      .select('.y-projection-name')
      .attr('transform', 'translate(' + (x(d.date) / 2 - 60) + ',' + y(d.close) + ')')
      .text(`Close: US $ ${d.close}`)
    focus
      .select('.y1-projection-name')
      .attr('transform', 'translate(' + (x(d.date) + (width - x(d.date)) / 2 - 60) + ',' + y1(d.volume) + ')')
      .text(`Volume:  ${d.volume.toLocaleString('en-US')}`)


    // Remove the previous tooltip
    svg.select('#side-tooltip').remove()

    // Add a side tooltip
    svg.append('text')
      .attr('id', 'side-tooltip')
      .attr('x', () => width + 50)
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
      .attr('y', function (_data, i) { return 20 + (i * 25) })
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