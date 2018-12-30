Eve is a simple visualization library including **charts**, **diagrams** and **maps**.

### Basic Usage for a Pie Chart

#### HTML
```html
<div id="dvChart"></div>
```
#### JavaScript
```javascript
eve.pieChart({
  data: jsonData,
  tooltip: {
    format: '<b>{title}</b>: {value}'
  },
  xField: 'name',
  series: [
    {
      sizeField: 'commits'
    }
  ]
});
```
### Supported Visualizations
#### Charts
- Area Chart
- Bar Chart
- Bubble Chart
- Column Chart
- Combination Chart
- Donut Chart
- Funnel Chart
- Line Chart
- Pie Chart
- Pyramid Chart
- Radar Chart
- Scatter Chart
#### Diagrams
- Abacus
- Bubble Force
- Bullet
- Bump
- Calendarmap
- Circle Clusters
- Chord
- Circle Packing
- Co-Occurence Matrix
- Dendrogram
- Force Directed
- Gantt
- Heatmap
- Matrix
- Mirrored Bars
- Network
- Parallel Lines
- Sankey
- Seatmap
- Slope
- Streamgraph
- Sunburst
- Timeline
- Treemap
- Wordcloud
#### Maps
- Cartogram
- Continous Cartogram
- Density
- Location
- Route
- Standard
- Tile (US Only)
#### Gauges
- Dial
- Digital
- Linear
- Standard
#### Tabular
- Grid (Has conditional formatting)
- Pivot (Has conditional formatting)

### Contributors
- Ismail Ozdemir
- Utkucan Ari

### Special Thanks
[Pagos Inc.,](http://www.pagos.com)
[Ugur Kadakal](https://github.com/ukadakal)

### References and Showcase
https://www.vysda.com
