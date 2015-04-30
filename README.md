![alt tag](https://dl.dropboxusercontent.com/u/36801868/eve.jpg) 

Eve is a visualization library including **charts**, **diagrams**, **grid** and **pivot table**. 

###Basic Usage
####HTML
```html
<div id="dvChart"></div>
```
####JavaScript
```javascript
eve('#dvChart').pie({
  data: jsonData,
  balloon: {
    format: '<b>{{title}}</b>: {{value}}'
  },
  series: [
    {
      titleField: 'name',
      valueField: 'commits'
    }
  ]
});
```
