[![Code Climate](https://codeclimate.com/github/ozdemiri/eve/badges/gpa.svg)](https://codeclimate.com/github/ozdemiri/eve)

![alt tag](https://dl.dropboxusercontent.com/u/36801868/eve.jpg)

Eve is a simple visualization library including **charts** and **diagrams**.

###Basic Usage
####HTML
```html
<div id="dvChart"></div>
```
####JavaScript
```javascript
eve.pie({
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
###Contributors
- Ismail Ozdemir
- Utkucan Ari

###Special Thanks
[Pagos Inc.,](http://www.pagos.com)
[Ugur Kadakal](https://github.com/ukadakal)

###References and Showcase
https://www.vysda.com
