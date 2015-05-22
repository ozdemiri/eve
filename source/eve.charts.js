/*!
 * eve.charts.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for chart.
 */
(function (eveCharts) {
    //stores chart instances
    eveCharts.instances = {};

    //stores eve.charts version
    eveCharts.version = '0.0.1 beta';

    //stores constants to use in eve visualization library
    eveCharts.constants = {
        min: 'Min',
        max: 'Max',
        total: 'Total',
        average: 'Average',
        sum: 'Sum',
        count: 'Count',
        records: 'Records'
    };

    //stores chart colors in general
    eveCharts.colors = ['#83AA30', '#1499D3', '#4D6684', '#3D3D3D', '#B9340B', '#CEA45C', '#C5BE8B', '#498379', '#3F261C', '#E74700', '#F1E68F', '#FF976F', '#FF6464', '#554939', '#706C4D']

    //gets chart count
    eveCharts.getChartCount = function () {
        /// <summary>
        /// Gets total chart count.
        /// </summary>
        /// <returns type="number"></returns>

        //iterate all charts in instances
        var chartCount = 0;

        //iterate all keys in chart
        for (var key in this.instances) {
            //check whether the key has eveCharts word
            if (key.indexOf('eveCharts') > -1)
                chartCount++;
        };

        //return chart count
        return chartCount;
    };

    //removes given chart
    eveCharts.remove = function (chart) {
        /// <summary>
        /// Removes given chart from instances.
        /// </summary>
        /// <param name="chart"></param>
        if (this.instances[chart.id])
            delete this.instances[chart.id];
    };
})(eve.charts);