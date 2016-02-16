//declare datas
var dataXY = [],
    dataSliced = [];
	
//get Map
function getMap(){
	document.getElementById('dvmap').innerHTML = "";	
		d3.csv('libs/countries.csv', function(err, data) {
        data.forEach(function(d) {
            d.Measure = parseFloat(d.Measure);
        })

		eve.map({
			container: 'dvmap',
			data: data,
			legend: {baseColor: '#' + document.getElementById('color').value},
			series: [{
				map: document.getElementById('mapname').value,
				labelField: 'Country',
				valueField: 'Measure',
				labelsEnabled: document.getElementById('label').checked,
				labelFormat: '{label}:{measure}'
			}],
			balloon: {enabled: document.getElementById('balloon').checked, format: '{label}:{value}'}
		})
	});
}

//load test data
$(document).ready(function() {
    //load test data
    d3.csv('libs/data.csv')
        .row(function(d) {
            return {
                state: d.state,
                date: new Date(d.date),
                id: parseFloat(d.id),
                salary: parseFloat(d.serie1),
                bonus: parseFloat(d.serie2),
                annualExtra: parseFloat(d.serie3)
            };
        })
        .get(function(err, rows) {
            //set datas
            dataXY = rows;

            //set sliced data
            for(var i=0; i<7; i++)
                dataSliced.push(eve.clone(rows[i]));

            //draw area chart
            drawArea();
            drawBar();
            //drawLine();
        });


});

//draw charts
function drawArea() {
    eve.areaChart({
        container: 'dvAreaChart',
        data: dataXY,
        xField: 'id',
        series: [
            { yField: 'salary' },
            { yField: 'bonus' }
        ],
        yAxis: { title: 'Salary vs Bonus' }
    });
}

function drawLine() {
    eve.lineChart({
        container: 'dvLineChart',
        data: dataXY,
        xField: 'id',
        series: [
            { yField: 'salary' },
            { yField: 'bonus' }
        ],
        yAxis: { title: 'Salary vs Bonus' }
    });
}

function drawBar() {
    eve.barChart({
        container: 'dvBarChartStacked',
        data: dataXY,
        xField: 'state',
        series: [
            { yField: 'salary' },
            { yField: 'bonus' }
        ],
        xAxis: { title: 'States' },
        yAxis: { title: 'Salary vs Bonus' }
    });

    eve.barChart({
        container: 'dvBarChartGrouped',
        data: dataSliced,
        xField: 'state',
        series: [
            { yField: 'salary' },
            { yField: 'bonus' }
        ],
        xAxis: { title: 'States' },
        yAxis: { title: 'Salary vs Bonus', stacked: false }
    });

    eve.columnChart({
        container: 'dvColumnChartStacked',
        data: dataXY,
        xField: 'state',
        series: [
            { yField: 'salary' },
            { yField: 'bonus' }
        ],
        xAxis: { title: 'States' },
        yAxis: { title: 'Salary vs Bonus', }
    });

    eve.columnChart({
        container: 'dvColumnChartGrouped',
        data: dataXY,
        xField: 'state',
        series: [
            { yField: 'salary' },
            { yField: 'bonus' }
        ],
        xAxis: { title: 'States' },
        yAxis: { title: 'Salary vs Bonus', stacked: false }
    });
}
