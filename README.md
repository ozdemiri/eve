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
  balloon: {
    format: '<b>{title}</b>: {value}'
  },
  series: [
    {
      titleField: 'name',
      valueField: 'commits'
    }
  ]
});
```
###Contributors
- Ismail Ozdemir
- Onur Aytar
- Utkucan Ari
- Bilge Ozdemir

###Demos and Documentation
http://eve.artgratis.com/
