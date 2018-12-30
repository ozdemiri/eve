/*!
 * eve.data.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for chart data.
 */
(function (e) {
    //sets and gets column properties
    function getSetColumnProperties(data, colNames) {
        //declare columns
        let columns = {};

        //get columns from the data and map them to the columns
        colNames.map(function (d) {
            columns[d] = {
                type: [e.getType(data[0][d])],
                uniques: data.length < 1000 ? e.getUniqueValues(data, d) : []
            };
        });

        return columns;
    }

    //sets data type for the top 5 records
    function setColumnDataTypes(data, columns) {
        //declare needed variables
        let iterationStop = data.length > 5 ? 5 : data.length,
            currentData = null,
            currentDataType = 'string';

        //iterate to stop
        for (let i = 1; i < iterationStop; i++) {
            //get current data
            currentData = data[i];

            //iterate all keys of the current data
            d3.keys(currentData).map(function (d, i) {
                //set current data type
                currentDataType = e.getType(currentData[d]);

                //push the current data type to the types stack
                columns[d].type.push(currentDataType);
            });
        }

        //get column data types
        return getColumnDataTypes(columns);
    }

    //guesses data type by top 5 records' data types
    function getColumnDataTypes(columns, firstType, lastType) {
        //declare variables
        let areIdentical = true,
            currentType = 'string';

        //iterate all keys in columns
        d3.keys(columns).map(function (d) {
            //check whether the types are identical
            areIdentical = e.isIdentical(columns[d].type);

            //check whether the types are identical
            if (areIdentical) {
                //set current type
                currentType = columns[d].type[0];
            } else {
                //iterate types
                for (let i = 0; i < columns[d].type.length; i++) {
                    //check whether the current type is not null
                    if (columns[d].type[i] && columns[d].type[i] !== 'null') {
                        currentType = columns[d].type[i];
                        break;
                    }
                }
            }

            //update column type
            columns[d].type = currentType;//areIdentical ? lastType : firstType;
        });

        return columns;
    }

    //gets properties of the data set
    e.getDataProperties = function () {
        //check whether the data has passed
        if (arguments.length === 0) return null;

        //get type of the data
        let data = arguments[0],
            datatype = e.getType(data);

        //check whether the datatype is an array
        if (datatype === 'array') {
            //declare a columns object to store their properties
            let colNames = d3.keys(data[0]),
                columns = getSetColumnProperties(data, colNames);

            //update columns with estimated data types
            columns = setColumnDataTypes(data, columns);

            //return columns
            return {
                columns: columns,
                rowCount: data.length,
                colCount: colNames.length
            };
        } else {
            //probably it's a json data so we can return it directly
            return {
                columns: d3.keys(data)
            };
        }
    };

})(eve);