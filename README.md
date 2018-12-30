Eve is a simple visualization library including **charts**, **diagrams** and **maps".

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
### Contributors
- Ismail Ozdemir
- Utkucan Ari

### Special Thanks
[Pagos Inc.,](http://www.pagos.com)
[Ugur Kadakal](https://github.com/ukadakal)

### References and Showcase
https://www.vysda.com
