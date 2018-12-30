/*!
 * eve.grid.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for grids.
 */
//Adds group function to the number object.
Number.prototype.group = function (decimalSeperator, thousandsSeperator, decimalCount) {
    //Set default values
    if (decimalSeperator === null) decimalSeperator = '.';
    if (thousandsSeperator === null) thousandsSeperator = ',';
    if (decimalCount === null) decimalCount = 2;

    //Handle type errors
    if (eve.getType(decimalCount) !== 'number') decimalCount = 2;
    if (eve.getType(decimalSeperator) !== 'string') decimalSeperator = '.';
    if (eve.getType(thousandsSeperator) !== 'string') thousandsSeperator = ',';

    //Declare variables
    var _val = decimalCount < 0 ? this : this.toFixed(decimalCount),
        _valS = _val.toString(),
        _v = _valS.split('.'),
        _v1 = _v[0],
        _v2 = _v.length > 1 ? decimalSeperator + _v[1] : '',
        _rgx = /(\d+)(\d{3})/;

    //Iterate reg test.
    while (_rgx.test(_v1)) {
        //Set x1
        _v1 = _v1.replace(_rgx, '$1' + thousandsSeperator + '$2');
    }

    //Return grouped value
    return _v1 + _v2;
};

(function (e) {
    //create the grid class
    function grid(options) {
        //declare members
        this.behavior = "tabular";
        this.container = "";
        this.columns = [];
        this.data = null;
        this.width = "auto";
        this.height = "auto";
        this.pageIndex = 1;
        this.pageSize = 100;
        this.sortDirection = "asc";
        this.sortField = "";
        this.paginatorText = 'Records from {0} to {1} of total {2}';
        this.pivotMode = "tree";

        //declare needed variables
        var that = this;
        var container = null;

        //iterate all keys in options
        for (var key in options) {
            that[key] = options[key];
        }

        //handle errors
        if (that.container === "")
            return null;

        //declare internal members
        that._totalPages = 0;
        that._pager = null;
        that._firstCol = null;
        that._minMaxValues = null;
        that._classicalMinMax = null;
        that._rows = null;
        that._totalRecords = null;
        that._columnNames = [];
        that._rowTitles = [];
        that._rowNames = [];
        that._dataNames = [];
        that._totalColWidth = 0;
        that._subBtns = null;
        that._btns = null;
        that._header = null;
        that._footer = null;
        that._rowsContainer = null;
        that._colElements = null;
        that._colResizers = null;
        that._selectedRow = null;
        that._rowElements = null;
        that._gauges = [];

        //iterate all columns to set col specific members
        that.columns.forEach(function (c) {
            switch (c.direction) {
                case "column":
                    {
                        that._columnNames.push(c.fieldName);
                    }
                    break;
                case "row":
                    {
                        that._rowNames.push(c.fieldName);
                        that._rowTitles.push(c.columnName);

                        //set first col
                        if (that._rowNames.length === 1)
                            that._firstCol = c;
                    }
                    break;
                case "data":
                    {
                        that._dataNames.push(c.fieldName);
                    }
                    break;
                default:
                    {
                        that._columnNames.push(c.fieldName);
                    }
                    break;
            }
        });

        //initializes the grid
        let initGrid = function () {
            //set document element
            container = $('#' + that.container);

            //add pagos class into the client element
            if (!container.hasClass('pagos-grid'))
                container.addClass('pagos-grid');

            //declare needed variables
            let headerHeight = 0,
                rowsHeight = container.height() - 56,
                footerHeight = 0,
                headerHtml = "",
                html = "";

            //set grid dimensio
            container.css("width", (that.width === 'auto' ? '100%' : that.width + 'px'));
            container.css("height", (that.height === 'auto' ? container.height() : that.height + 'px'));

            //check if the behavior is pivot
            if (that.behavior === "pivot") {
                //declare variables
                let colWidth = that._firstCol.width ? that._firstCol.width : 100,
                    colAlign = that._firstCol.labelPosition === "auto" ? "left" : that._firstCol.labelPosition,
                    cellStyle = 'width: ' + colWidth + 'px;',
                    colStyle = 'width: ' + colWidth + 'px; text-align: ' + colAlign + '; height: 27px; padding-top: 5px;',
                    sortClass = '';

                //set background position
                if (colAlign === "right")
                    colStyle += 'background-position: left';
                else
                    colStyle += 'background-position: right';

                //construct column
                headerHtml += '<td class="colContainer ' + that.container + '_rowCol_0" style="' + cellStyle + '">';
                headerHtml += '<div id="' + that.container + '_col_0" columnindex="0" colname="' + that._firstCol.fieldName + '" colid="' + that._firstCol.fieldID + '" dataindex="0" class="column ' + that.container + '_cols ' + sortClass + ' ' + that.container + '_rowCol_0" style="' + colStyle + '">';
                headerHtml += that._rowTitles.join('-');
                headerHtml += '</div></td>';

                //set min and max values
                that._minMaxValues = {};
            }

            //iterate all column
            that.columns.forEach(function (c, i) {
                //declare variables
                let colWidth = c.width ? c.width : 100,
                    colAlign = c.labelPosition === "auto" ? "left" : c.labelPosition,
                    cellStyle = 'width: ' + colWidth + 'px;',
                    colStyle = 'width: ' + colWidth + 'px; text-align: ' + colAlign + '; height: 27px; padding-top: 5px;',
                    sortClass = '';

                //set sorter position
                if (colAlign === 'right')
                    colStyle += 'background-position: left';
                else
                    colStyle += 'background-position: right';

                //check grid behavior
                if (that.behavior === 'tabular') {
                    //construct column
                    headerHtml += '<td class="colContainer ' + that.container + '_rowCol_' + i + '" style="' + cellStyle + '">';
                    headerHtml += '<div id="' + that.container + '_col_' + i + '" columnindex="' + i + '" colname="' + c.fieldName + '" colid="' + c.fieldID + '" dataindex="' + i + '" class="column ' + that.container + '_cols ' + sortClass + '" style="' + colStyle + '">';
                    headerHtml += c.columnName;
                    headerHtml += '</div></td>';
                } else {
                    //check column behavior
                    if (c.direction === 'data') {
                        //set min and max values
                        that._minMaxValues['min' + c.fieldName] = 0;
                        that._minMaxValues['max' + c.fieldName] = 0;

                        //construct column
                        headerHtml += '<td class="colContainer ' + that.container + '_rowCol_' + i + '" style="' + cellStyle + '">';
                        headerHtml += '<div id="' + that.container + '_col_' + i + '" columnindex="' + i + '" colname="' + c.fieldName + '"  colid="' + c.fieldID + '"dataindex="' + i + '" class="column ' + that.container + '_cols ' + sortClass + '" style="' + colStyle + '">';
                        headerHtml += c.columnName;
                        headerHtml += '</div></td>';
                    }
                }

                //set an empty col
                headerHtml += '</td>';

                //check grid behaivor
                if (that.behavior === 'tabular') {
                    //set col width
                    that._totalColWidth += c.width ? c.width : 100;
                } else {
                    //check col behavior
                    if (c.direction === 'row' || c.direction === 'data')
                        that._totalColWidth += c.width ? c.width : 100;
                }
            });

            //set grid content
            html += '<div id="' + that.container + '_hct" style="width: 100%;" class="pagos-grid-rail-content">';
            html += '<table id="' + that.container + '_hdr" class="pagos-grid-header" style="" border="0" cellpadding="0" cellspacing="0"><tr>';
            html += headerHtml;
            html += '</tr></table></div>';
            html += '<div id="' + that.container + '_rows" class="' + (that.behavior == 'tabular' ? 'pagos-grid-row-container' : 'pagos-pivot-row-container') + '" style="width: 100%; height: ' + rowsHeight + 'px;">';
            html += '</div>';

            //create footer
            if (that.behavior === 'tabular') {
                //set grid footer content
                html += '<table id="' + that.container + '_ft" class="pagos-grid-footer" style="min-width: 100%;"><tr><td>';
                html += '<div id="' + that.container + '_first" class="pagos-grid-button pagos-grid-button-first"><i class="fa fa-fast-backward"></i></div>';
                html += '<div id="' + that.container + '_prev" class="pagos-grid-button pagos-grid-button-prev"><i class="fa fa-backward"></i></div>';
                html += '<div id="' + that.container + '_navText" class="pagos-grid-footer-layer">' + that.paginatorText + '</div>';
                html += '<div id="' + that.container + '_next" class="pagos-grid-button pagos-grid-button-next"><i class="fa fa-forward"></i></div>';
                html += '<div id="' + that.container + '_last" class="pagos-grid-button pagos-grid-button-last"><i class="fa fa-fast-forward"></i></div>';
                html += '<div id="grid_footer_layer" class="pagos-grid-footer-layer">Jump to page: <input id="' + that.container + '_pager" type="text" style="text-align: center; padding-left: 0px; width: 50px;" /></div>';
                html += '</td></tr></table>';
            } else {
                //check whether the sub totals are visible
                if (that.showSubTotals) {
                    //set pivot footer content
                    let colWidth = that._firstCol.width ? that._firstCol.width : 100;
                    html += '<div id="' + that.container + '_fct" class="pagos-grid-rail-content" style="width: 100%;">';
                    html += '<table id="' + that.container + '_ft" class="pagos-grid-subtotal" border="0" cellpadding="0" cellspacing="0"><tr>';
                    html += '<td class="pagos-grid-subtotal-cell-container ' + that.container + '_rowCol_0" style="width: ' + colWidth + 'px;">';
                    html += '<div id="' + that.container + '_subTotal_0" class="pagos-grid-subtotal-cell ' + that.container + '_rowCol_0" style="width: ' + colWidth + 'px;">Grand Total</div></td>';

                    //Iterate all data columns
                    that.columns.forEach(function (column, columnIndex) {
                        //check if the column is data
                        if (column.direction === 'data') {
                            let colDataWidth = column.width ? column.width : 100;
                            html += '<td class="pagos-grid-subtotal-cell-container ' + that.container + '_rowCol_' + columnIndex + '" style="width: ' + colDataWidth + 'px;">';
                            html += '<div id="' + that.container + '_subTotal_' + columnIndex + '" class="pagos-grid-subtotal-cell ' + that.container + '_rowCol_' + columnIndex + '" style="width: ' + colDataWidth + 'px;">0</div></td>';
                        }
                    });

                    //set empty col
                    html += '</td>';

                    //closure for pivot footer
                    html += '</tr></table></div>';
                }
            }

            //append the content
            container.html(html);

            //set footer events
            if (that.behavior === 'tabular') {
                //Set buttons
                $('#' + that.container + '_first').on("click", function () {
                    //check if first page
                    if (that.pageIndex == 1)
                        return;

                    //set page index
                    that.pageIndex = 1;

                    //update footer
                    setFooter();

                    //raise page changed event
                    if (that.onPageChanged)
                        that.onPageChanged(that.pageIndex);
                });

                $('#' + that.container + '_prev').on("click", function () {
                    //check if first page
                    if (that.pageIndex == 1)
                        return;

                    //set page index
                    that.pageIndex -= 1;

                    //update footer
                    setFooter();

                    //raise page changed event
                    if (that.onPageChanged)
                        that.onPageChanged(that.pageIndex);
                });

                $('#' + that.container + '_next').on("click", function () {
                    //check if last page
                    if (that.pageIndex == that._totalPages)
                        return;

                    //set page index
                    that.pageIndex += 1;

                    //update footer
                    setFooter();

                    //raise page changed event
                    if (that.onPageChanged)
                        that.onPageChanged(that.pageIndex);
                });

                $('#' + that.container + '_last').on("click", function () {
                    //check if last page
                    if (that.pageIndex == that._totalPages)
                        return;

                    //set page index
                    that.pageIndex = that._totalPages;

                    //update footer
                    setFooter();

                    //raise page changed event
                    if (that.onPageChanged)
                        that.onPageChanged(that.pageIndex);
                });

                //set pager textbox
                that._pager = $("#" + that.container + "_pager");
                that._pager.on("change", function () {
                    let enteredPageIndex = parseInt(that._pager.val());
                    if (isNaN(enteredPageIndex))
                        return false;

                    //handle min
                    if (enteredPageIndex < 1)
                        if (that.pageIndex === 1) {
                            that._pager.val(1);
                            return;
                        }
                        else
                            enteredPageIndex = 1;

                    //handle min
                    if (enteredPageIndex > that._totalPages)
                        if (that.pageIndex === that._totalPages) {
                            that._pager.val(that._totalPages);
                            return;
                        }
                        else
                            enteredPageIndex = that._totalPages;

                    //set page index
                    that.pageIndex = enteredPageIndex;

                    //update footer
                    setFooter();

                    //raise page changed event
                    if (that.onPageChanged)
                        that.onPageChanged(that.pageIndex);

                });

                //set pager content
                that._pager.val(that.pageIndex.toString());
            }

            //get columns
            that._header = $('#' + that.container + '_hdr');
            that._footer = $('#' + that.container + '_ft');
            that._colElements = $('.' + that.container + '_cols');
            that._rowsContainer = $('#' + that.container + '_rows');

            //check if col elements is not null
            if (that._colElements != null && that._colElements.length) {
                //set column click event
                that._colElements.on("click", function () {
                    //get colindex and dataindex
                    let colIndex = parseInt($(this).attr('columnindex'));
                    let dataIndex = parseInt($(this).attr('dataindex'));

                    //set sorter
                    setSorter(colIndex, dataIndex);
                });
            }

            //check if rows container is not null
            if (that._rowsContainer != null && that._rowsContainer.length) {
                //set scroll event for rows container
                that._rowsContainer.scroll(function () {
                    let scrollArea = $(this);
                    let leftPos = scrollArea.scrollLeft();
                    let maxLeft = scrollArea[0].scrollWidth - scrollArea[0].clientWidth;
                    let lastSubTotalCol = $('#' + that.container + '_subTotal_' + (that.columns.length - 1));
                    let hct = $('#' + that.container + '_hct');
                    let fct = $('#' + that.container + '_fct');

                    //check header container
                    if (hct != null && hct.length)
                        hct.scrollLeft(leftPos);

                    //check footer container
                    if (fct != null && fct.length)
                        fct.scrollLeft(leftPos);
                    
                });
            }

            //check if grid has data
            if (that.data != null)
                bindData(that.data);
        };

        //sets footer
        let setFooter = function () {
            //declare variables
            var navText = that.paginatorText,
                rangeMin = ((that.pageIndex - 1) * that.pageSize) + 1,
                rangeMax = rangeMin + that.pageSize - 1,
                nText = $('#' + that.container + '_navText');

            //set range max
            if (rangeMax > that._totalRecords)
                rangeMax = that._totalRecords;

            //set total pages
            that._totalPages = Math.ceil(that._totalRecords / that.pageSize);

            //set navigator text
            navText = navText.replace('{0}', rangeMin.group('.', ',', 0));
            navText = navText.replace('{1}', rangeMax.group('.', ',', 0));
            navText = navText.replace('{2}', that._totalRecords);

            //set text content in navigator
            if (nText != null)
                nText.html(navText);

            //set pager text
            if (that._pager != null)
                that._pager.val(that.pageIndex);
        };

        //sets sorter 
        let setSorter = function (colIndex, dataIndex) {
            //declare variables
            var col = $('#' + that.container + '_col_' + colIndex),
                column = that.columns[dataIndex],
                sortClass = that.sortDirection === 'desc' ? 'pagos-grid-sorter-desc' : 'pagos-grid-sorter-asc';

            //check if col elements is not null
            if (that._colElements != null) {
                //clear sorters
                that._colElements.removeClass('pagos-grid-sorter-asc');
                that._colElements.removeClass('pagos-grid-sorter-desc');
            }

            //check if sorter field is changed
            if (that.sortField != column.fieldName) {
                that.sortDirection = 'asc';
                sortClass = 'pagos-grid-sorter-asc';
            }

            if (typeof isSinglePostPage != 'undefined') {

                var fieldName = column.fieldName;
                var dataType = column.columnType;

                that._rows = that._rows.sort(function (a, b) {
                    switch (dataType) {
                        case 'numeric':
                            {
                                //get field values
                                var aValue = parseFloat(a[fieldName]);
                                var bValue = parseFloat(b[fieldName]);

                                if (isNaN(aValue))
                                    aValue = 0;

                                if (isNaN(bValue))
                                    bValue = 0;

                                if (that.sortDirection === 'asc') {
                                    return aValue - bValue;
                                } else {
                                    return bValue - aValue;
                                }
                            }
                        case 'datetime':
                            {
                                //get field values
                                if (that.sortDirection === 'asc') {
                                    return (new Date(a[fieldName]) > new Date(b[fieldName])) ? 1 : ((new Date(a[fieldName]) < new Date(b[fieldName])) ? -1 : 0);
                                } else {
                                    return (new Date(b[fieldName]) > new Date(a[fieldName])) ? 1 : ((new Date(b[fieldName]) < new Date(a[fieldName])) ? -1 : 0);
                                }
                            }
                        default:
                            {
                                if (that.sortDirection === 'asc') {
                                    return (a[fieldName] > b[fieldName]) ? 1 : ((a[fieldName] < b[fieldName]) ? -1 : 0);
                                } else {
                                    return (b[fieldName] > a[fieldName]) ? 1 : ((b[fieldName] < a[fieldName]) ? -1 : 0);
                                }
                            }
                    }
                });

                that.bind(that.data);

                //update sort direction
                that.sortDirection = that.sortDirection === 'asc' ? 'desc' : 'asc';
            }

            //set sort field
            that.sortField = column.fieldName;
            that.sortFieldID = column.fieldID;

            //check if col element is not null
            if (col != null) {
                //add sort class
                col.addClass(sortClass);

                //set sorter position
                if (column.labelPosition === 'right')
                    col.css('backgroundPosition', 'left');
                else
                    col.css('backgroundPosition', 'right');
            }

            //set page index and paginator
            /*if (that.behavior === 'tabular') {
                //set pae index
                that.pageIndex = 1;

                //set footer
                setFooter();
            }*/

            //raise on before sort
            if (that.onSort) {
                that.onSort(that.sortField, that.sortFieldID, that.sortDirection === 'asc' ? 'desc' : 'asc');

                //update sort direction
                that.sortDirection = that.sortDirection === 'asc' ? 'desc' : 'asc';
            }

        };

        //binds data for the grid
        let bindData = function () {
            //switch grid behavior
            switch (that.behavior) {
                case 'tabular':
                    bindGrid(that.data);
                    break;
                case 'pivot':
                    bindPivot(that.data);
                    break;
            }

            //assign resizable to each cols
            $('.' + that.container + '_cols').each(function (index) {
                //attach resizable
                $(this).resizable({
                    handles: 'e',
                    resize: function (e, ui) {
                        //declare needed variables
                        let currentColField = $(this).attr('colid');
                        let currentColIndex = getColIndexByID(currentColField);

                        //update col size
                        that.columns[currentColIndex].width = ui.size.width;

                        //resize columns
                        $('.' + that.container + '_rowCol_' + currentColIndex).css('width', ui.size.width + 'px');

                        //raise callback
                        if (that.onColumnResize)
                            that.onColumnResize(currentColField, currentColIndex, ui.size.width);
                    },
                    stop: function (e, ui) {

                    }
                });
            });
        };

        //binds grid dataset
        let bindGrid = function (data) {
            //declare variables
            let html = '';

            //set rows, minmax and total records
            that._rows = data.rows;
            that._totalRecords = data.totalRecords;
            that._minMaxValues = data.minMaxValues;

            //get length
            let rowsContainerHeight = parseInt(that._rowsContainer.css('height'));
            let rowLimit = Math.floor(rowsContainerHeight / 20);

            //iterate all rows
            that._rows.forEach(function (row, rowIndex) {
                //hide class for screenshots
                let hideClassForScreenshot = '';

                //check row index to set screenshot class
                if (rowIndex >= rowLimit)
                    hideClassForScreenshot = ' pagos-grid-last2';

                //build html
                html += '<tr id="' + that.container + '_row_' + rowIndex + '" class="pagos-grid-row pagos-grid-row-hlines ' + that.container + '_rows ' + hideClassForScreenshot + '">';

                //iterate all columns
                that.columns.forEach(function (column, colIndex) {
                    //check if the column behavior is column
                    html += getCellContent(row, column, rowIndex, colIndex, 0);
                });

                //closure for row html
                html += '</tr>';
            });

            //append rows html
            that._rowsContainer.html('<table cellpadding="0" cellspacing="0">' + html + '</table>');
            that._rowElements = $('.' + that.container + '_rows');

            //check if row elements is not null
            if (that._rowElements.length) {
                //set rows click event
                that._rowElements.on("click", function (index) {
                    //declare variables
                    var item = $(this);

                    //remove selected class from all rows
                    that._rowElements.removeClass('pagos-grid-row-selected');

                    //add current item seleted class
                    item.addClass('pagos-grid-row-selected');

                    //set selected row
                    that._selectedRow = that._rows[index];

                    //raise row selected event
                    if (that.onRowSelected)
                        that.onRowSelected(that._selectedRow);
                });
            }

            //set conditional formatting
            setConditionalFormat(that._rows, 0);

            //check if the page index = 1
            if (that.pageIndex === 1) {
                //set footer content
                setFooter();


            }
        };

        //binds pivot dataset
        let bindPivot = function (data) {
            //declare needed variables
            var rowID = '',
                subID = '',
                subDiv = null,
                rowIndex = 0,
                subTotalCell = null,
                subTotalValue = '',
                html = '';

            //set rows
            that._rows = data.rows;

            //iterate all rows
            that._rows.forEach(function (row, index) {
                //set row and sub id
                rowID = that.container + '_row_' + index;
                subID = rowID + '_sub';

                //build html
                html += '<tr id="' + rowID + '" class="pagos-grid-row pagos-grid-row-hlines ' + that.container + '_rows">';

                //set first row
                html += getCellContent(row, that._firstCol, index, 0, 0);

                //iterate all columns
                that.columns.forEach(function (column) {
                    //check if the current column has a data behavior
                    if (column.direction === 'data') {
                        //increase col index
                        var colIndex = getColIndexByfieldName(column.fieldName);

                        //set cell
                        html += getCellContent(row, column, index, colIndex, 0);

                        //set min col value
                        if (row[column.fieldName] < that._minMaxValues['min' + column.fieldName])
                            that._minMaxValues['min' + column.fieldName] = row[column.fieldName];

                        //set max col value
                        if (row[column.fieldName] > that._minMaxValues['max' + column.fieldName])
                            that._minMaxValues['max' + column.fieldName] = row[column.fieldName];
                    }
                });

                //closure for row
                html += '</tr>';

                //add sub row container
                html += '<tr id="' + subID + '" class="pagos-grid-sub-row-container"><td colspan="' + (that.columns.length - 1) + '"></td></tr>';
            });

            //append rows html
            that._rowsContainer.html('<table cellpadding="0" cellspacing="0">' + html + '</table>');
            that._rowElements = $('.' + that.container + '_rows');

            //check if row elements is not null
            if (that._rowElements.length) {
                //set rows click event
                that._rowElements.on("click", function (index) {
                    //declare variables
                    var item = $(this);

                    //remove selected class from all rows
                    that._rowElements.removeClass('pagos-grid-row-selected');

                    //add current item seleted class
                    item.addClass('pagos-grid-row-selected');

                    //set selected row
                    that._selectedRow = that._rows[index];

                    //raise row selected event
                    if (that.onRowSelected)
                        that.onRowSelected(that._selectedRow);
                });
            }

            //set sub buttons click event
            that._subBtns = $('.' + that.container + '_subBtns_0');

            //check if sub buttons is not null
            if (that._subBtns.length) {
                //attach click event
                that._subBtns.on("click", function (index) {
                    var item = $(this);
                    rowIndex = parseInt(item.attr('rowindex'));

                    //declare variables
                    var subDivID = '#' + that.container + '_row_' + rowIndex + '_sub';

                    //get sub content div
                    subDiv = $(subDivID);

                    //set sub button class
                    if (item.hasClass('pagos-grid-minus'))
                        item.removeClass('pagos-grid-minus');
                    else
                        item.addClass('pagos-grid-minus');

                    //hide all subs
                    $('.pagos-grid-sub-row-container').css("display", "none");

                    //check if expanded
                    if (item.hasClass('pagos-grid-minus')) {
                        //set sub div style
                        subDiv.css('display', 'table-row');

                        //build sub rows
                        buildSubRows(subDiv, subDivID, that._rows[rowIndex], 0);
                    } else {
                        //set sub div style
                        subDiv.css('display', 'none');
                    }
                });
            }

            //check if sub totals are visible
            if (that.showSubTotals) {
                //iterate all columns
                that.columns.forEach(function (column) {
                    //check if col behavior is data
                    if (column.direction === 'data') {
                        //get column index
                        let columnIndex = getColIndexByfieldName(column.fieldName);

                        //get subtotal cell
                        subTotalCell = $('#' + that.container + '_subTotal_' + columnIndex);

                        //get summarize value
                        subTotalValue = getSummarizeByColumn(columnIndex);

                        //check if sub total cell is not null
                        if (subTotalCell != null) {
                            //set sub total cell
                            subTotalCell.html(subTotalValue);

                            //attach title value
                            subTotalCell.attr('title', subTotalValue);
                        }
                    }
                });
            }

            //check whether the pivot mode is classical
            if (that.pivotMode === 'classical')
                that._classicalMinMax = getClassicalMinMaxValues(that._rows);

            //set conditional format
            setConditionalFormat(that._rows, 0);
        };

        let buildSubRows = function (div, divID, row, depth) {
            //declare variables
            var increasedDepth = depth + 1,
                html = '',
                firstCol = null,
                subRowElements = null,
                subBtns = null,
                subID = '',
                subDiv = null,
                rowIndex = 0,
                subs = row.sub;

            //check whether the rows has sub
            if (subs != null && subs.length > 0) {
                //get first col
                firstCol = getColByName(that._rowNames[increasedDepth]);
                firstCol.width = getColByName(that._rowNames[0]).width;

                //iterate all sub rows
                subs.forEach(function (row, index) {
                    //set sub cell id
                    subID = divID + '_row_' + index + '_sub';

                    //build html
                    html += '<tr id="' + that.container + '_subs_' + increasedDepth + '" class="pagos-grid-sub-row ' + that.container + '_subRows_' + increasedDepth + '">';
                    html += getSubCellContent(row, firstCol, index, 0, (depth + 1), divID);

                    //iterate all columns
                    that.columns.forEach(function (column) {
                        //check whether the col behavior is data
                        if (column.direction === 'data') {
                            //increase col index
                            var colIndex = getColIndexByID(column.fieldID);

                            //get cell html
                            html += getSubCellContent(row, column, index, colIndex, (depth + 0), divID);

                            //set min value
                            if (row[column.fieldName] < that._minMaxValues['min' + column.fieldName])
                                that._minMaxValues['min' + column.fieldName] = row[column.fieldName];

                            //set max value
                            if (row[column.fieldName] > that._minMaxValues['max' + column.fieldName])
                                that._minMaxValues['max' + column.fieldName] = row[column.fieldName];
                        }
                    });

                    //closure for row
                    html += '</tr>';
                    html += '<tr id="' + subID + '" class="pagos-grid-sub-row-container"><td colspan="' + (that.columns.length - 1) + '"></td></tr>';
                });
            }

            //set sub content
            div.children().first().html('<table border="0" cellpadding="0" cellspacing="0">' + html + '</table>');

            //set sub row elements
            subRowElements = $('.' + that.container + '_subRows_' + increasedDepth);

            //check if sub row eelemnts is not  null
            if (subRowElements.length) {
                //set click event
                subRowElements.on("click", function (index) {
                    //get item
                    var item = $(this);

                    //remove selected class
                    subRowElements.removeClass('pagos-grid-row-selected');

                    //add selected class
                    item.addClass('pagos-grid-row-selected');
                });
            }

            //get sub buttons
            subBtns = $('.' + that.container + '_subBtns_' + increasedDepth);

            //check if subButtons are not null
            if (subBtns.length) {
                //attach click event to sub buttons
                subBtns.on("click", function (index) {
                    //get item
                    var item = $(this);

                    //set row index
                    rowIndex = parseInt(item.attr('rowindex'));

                    //get sub content div
                    subDiv = $('#' + that.container + '_row_' + rowIndex + '_sub');

                    //set sub button class
                    if (item.hasClass('pagos-grid-minus'))
                        item.removeClass('pagos-grid-minus');
                    else
                        item.addClass('pagos-grid-minus');

                    //check if expanded
                    if (item.hasClass('pagos-grid-minus')) {
                        //show subs
                        subDiv.css('display', 'table-row');

                        //build sub rows
                        buildSubRows(subDiv, '#' + that.container + '_row_' + rowIndex + '_sub', subs[rowIndex], increasedDepth);
                    } else {
                        //hide subs
                        subDiv.css('display', 'none');
                    }
                });
            }

            //set conditional format
            setConditionalFormat(subs, depth, divID);
        };

        let getSummarizeValueForColumn = function (column, row, rowIndex) {
            let abs = row[column.fieldName];

            //gets count of the rows
            let getSubRowCount = function () {
                let cnt = 0;
                row.sub.forEach(function (d) {
                    if (d[column.fieldName] != null)
                        cnt++;
                });
                return cnt;
            };

            if (row.sub && row.sub.length) {
                let totalValue = d3.sum(row.sub, function (d) { return d[column.fieldName]; });
                let subRowsCount = getSubRowCount();

                //switch expression
                switch (column.expression) {
                    case 'count':
                        abs = subRowsCount;
                    case 'sum':
                        abs = totalValue;
                        break;
                    case 'avg':
                        {
                            abs = totalValue / subRowsCount;
                        }
                        break;
                    case 'min':
                        abs = d3.min(row.sub, function (d) { return d[column.fieldName]; });
                        break;
                    case 'max':
                        abs = d3.max(row.sub, function (d) { return d[column.fieldName]; });
                        break;
                    default:
                        abs = totalValue;
                        break;
                }
            }


            return abs;
        }

        let getCellContent = function (row, column, rowIndex, colIndex, depth) {
            //declare variables
            let html = '',
                cellID = that.container + '_row_' + rowIndex + '_col_' + colIndex + '_depth_' + depth,
                subs = row['sub'],
                bSub = '',
                actualColumnValue = row[column.fieldName],
                formattedColumnValue = formatCell(row[column.fieldName], column),
                cellStyle = 'width: ' + column.width + 'px; text-align: ' + column.labelPosition + '; ';

            if (that.type === "pivot" && column.direction === "data") {
                actualColumnValue = column.expression === "avg" ? +row[column.fieldName] : getSummarizeValueForColumn(column, row, rowIndex);
                formattedColumnValue = formatCell(actualColumnValue, column);
            }

            //check col index
            if (colIndex === that.columns.length - 1 && that._totalColWidth > container.width())
                cellStyle = 'width: ' + (column.width - 2) + 'px; text-align: ' + column.labelPosition + '; ';

            //set sub button
            if (colIndex === 0 && subs != null && that.behavior !== 'tabular')
                bSub = '<i class="pagos-grid-plus ' + that.container + '_subBtns_0 fa fa-plus"  rowindex="' + rowIndex + '" colindex="' + colIndex + '" depth="0"></i>&nbsp;';

            //set html
            html += '<td id="' + cellID + '" title="' + formattedColumnValue + '" value="' + actualColumnValue + '" class="pagos-grid-cell pagos-grid-row-vlines ' + that.container + '_rowCol_' + colIndex + '"';

            //chek whether the first index
            if (rowIndex == 0)
                html += ' style="' + cellStyle + '"';

            //cell clas
            var cellClass = that.container + '_rowCol_' + colIndex;

            //set gauge
            if (column.conditionalFormat.type !== 'bars')
                cellClass += ' pagos-grid-cell-padding';

            //create cell
            html += '><div id="' + cellID + '_div" style="' + cellStyle + '" class="' + cellClass + '">';

            //set value if values are shown
            if (!column.hideValues) {
                html += bSub + formattedColumnValue;
            } else {
                html += bSub;
            }

            //closure for cell
            html += '</div></td>';

            //return generated cell content
            return html;
        };

        let getSubCellContent = function (row, column, rowIndex, colIndex, depth, baseDivID) {
            //declare needed variables
            let idStart = baseDivID.startsWith("#") ? baseDivID.replace("#", "") : baseDivID,
                cellID = idStart + '_row_' + rowIndex + '_col_' + colIndex + '_depth_' + depth,
                subs = row.sub,
                subID = idStart + '_row_' + rowIndex + '_sub',
                bSub = '',
                topBorder = '',
                cellStyle = 'width: ' + column.width + 'px; text-align: ' + column.labelPosition + '; ',
                actualColumnValue = row[column.fieldName],
                formattedColumnValue = formatCell(row[column.fieldName], column),
                html = '';

            if (that.type === "pivot" && column.direction === "data") {
                actualColumnValue = getSummarizeValueForColumn(column, row);
                formattedColumnValue = formatCell(actualColumnValue, column);
            }

            //check col index
            if (colIndex === that.columns.length - 1 && that._totalColWidth > container.width())
                cellStyle = 'width: ' + (column.width - 2) + 'px; text-align: ' + column.labelPosition + '; ';

            //check if row index === 0 then create a top border
            if (rowIndex === 0)
                topBorder = ' border-top: 1px solid #85b9f6; '

            //check if first col
            if (colIndex === 0 && subs != null)
                bSub = '<i class="pagos-grid-plus ' + that.container + '_subBtns_' + depth + '" sid="' + subID + '" rowindex="' + rowIndex + '" colindex="' + colIndex + '" depth="' + depth + '"></i>&nbsp;';

            //set 

            //create cell
            html += '<td id="' + cellID + '" title="' + formattedColumnValue + '" value="' + actualColumnValue + '" class="pagos-grid-cell pagos-grid-row-vlines ' + that.container + '_rowCol_' + colIndex + '" style="' + cellStyle + topBorder + '">';

            //update cell style
            if (colIndex === 0)
                cellStyle += 'padding-left: ' + ((depth * 16) + 5) + 'px; padding-right: 5px';
            else
                cellStyle += 'padding-right: 5px';

            //cell clas
            var cellClass = that.container + '_rowCol_' + colIndex;

            //set gauge
            if (column.conditionalFormat.type !== 'bars')
                cellClass += ' pagos-grid-cell-padding';

            //set cell div
            html += '<div id="' + cellID + '_div" style="' + cellStyle + '" class="' + cellClass + '">';

            //set value if values are shown
            if (!column.hideValues)
                html += bSub + formattedColumnValue;
            else
                html += bSub;

            //finalize html
            html += '</div></td>';

            //return generated cell content
            return html;
        };

        let formatCell = function (data, column) {
            //handle error
            if (data == null) return '';

            //declare variables
            let formattedValue = data,
                dateValue = null;

            //check column type
            if (column.columnType === 'datetime') {
                //declare default format
                let defaultFormat = column.labelFormat == '' ? '%x' : column.labelFormat;

                if (column.includeTime)
                    defaultFormat += ' %X';

                formattedValue = e.formatDate(data, defaultFormat);
            } else if (column.columnType === 'numeric') {
                //create data
                formattedValue = e.formatNumber(data, column.labelFormat);
            }

            //handle formatted value's null values
            if (formattedValue == null || formattedValue == 'null' || formattedValue == 'nan' || formattedValue == 'NaN' || formattedValue == 'Nan' || formattedValue == NaN || formattedValue == Infinity || formattedValue == 'Infinity' || formattedValue == 'infinity')
                formattedValue = '';

            //return formatted value
            return formattedValue;
        };

        let setConditionalFormat = function (rows, depth, baseDivID) {
            //declare variables
            let cell = null,
                minMaxVals = null,
                min = 0,
                max = 0,
                ratio = 0,
                cellID = '',
                iterationColumns = null,
                value = 0,
                cond = null,
                negativeValues = {},
                positiveValues = {},
                minPositive = {}, maxPositive = {},
                minNegative = {}, maxNegative = {},
                dividerRatio = {};

            //clear gauges
            that._gauges.length = 0;

            //set min max values
            if (that.behavior === 'tabular') {
                //set columns
                iterationColumns = that.columns;
            } else {
                //arrayify iteration columns
                iterationColumns = [];

                //set iteration columns from rows
                getRows().forEach(function (r) {
                    //push current row into the iteration columns
                    iterationColumns.push(r);
                });

                //set iteration columns from measures
                getMeasures().forEach(function (r) {
                    //push current measure into the iteration columns
                    iterationColumns.push(r);
                });
            }

            //iterate all rows
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                //get current row
                let row = rows[rowIndex];

                //iterate all columns
                iterationColumns.forEach(function (column, colIndex) {
                    //set condition
                    cond = column.conditionalFormat;
                    
                    //check whether the condition is not empty
                    if (cond && cond.type !== "none") {
                        //get min max
                        minMaxVals = getMinMaxValues(column.fieldName);
                        min = minMaxVals.min;
                        max = minMaxVals.max;

                        //set min if null
                        if (min == null || min == undefined)
                            min = 0;

                        //check whether the column has start from zero flag
                        if (column.startFromZero != null && column.startFromZero === true)
                            min = 0;

                        //set min and max positives for the column
                        minNegative[column.fieldName] = min < 0 ? min : 0;
                        maxNegative[column.fieldName] = max >= 0 ? 0 : max;
                        minPositive[column.fieldName] = min < 0 ? 0 : min;
                        maxPositive[column.fieldName] = max >= 0 ? max : 0;

                        //set cell id
                        cellID = that.container + '_row_' + rowIndex + '_col_' + colIndex + '_depth_' + depth;

                        //check if basedivid is not null
                        if (baseDivID != null)
                            cellID = baseDivID + '_row_' + rowIndex + '_col_' + colIndex + '_depth_' + depth;

                        //set cell element
                        if (cellID.startsWith("#"))
                            cell = $(cellID);
                        else
                            cell = $('#' + cellID);

                        //get current value of cell
                        value = parseFloat(cell.attr('value'));

                        //set ratio
                        if (min < 0) {
                            ratio = ((Math.abs(value)) * 100) / (max);
                        } else {
                            ratio = ((Math.abs(value) - min) * 100) / (max - min);
                        }

                        //handle ratio instabilities
                        if (ratio < 0) ratio = 0;
                        if (ratio > 100) ratio = 100;
                        if (isNaN(value)) ratio = 0;

                        //switch condition type
                        switch (cond.type) {
                            case 'bars':
                                {
                                    //declare bars variables
                                    let cellDiv = cell.children().first();
                                    let widthRange = max - min;
                                    let widthPercent = Math.abs(value) / widthRange * 100 - (min / widthRange * 100);
                                    let barWidth = column.width * widthPercent / 100;
                                    let cellDivHtml = '';
                                    let data = null;

                                    //clear cell content
                                    cell.css('padding', '0px 0px 0px 0px !important');
                                    cellDiv.css('padding', '0px 0px 0px 0px !important');
                                    cellDiv.css('height', '20px');
                                    cellDiv.css('position', 'relative');
                                    cellDiv.html('');

                                    //round percent
                                    widthPercent = Math.round(widthPercent);

                                    //do number formatting if exists
                                    if (column.labelFormat != '') {
                                        if (value == 0)
                                            value = '';
                                        else
                                            value = eve.formatNumber(value, column.labelFormat);
                                    }

                                    //set label data
                                    data = (isNaN(value) && column.labelFormat == '') ? '' : value;
                                    if (data.toString().indexOf('NaN') != -1)
                                        data = '';

                                    //set div html
                                    if (data === "") {
                                        cellDivHtml += '<div style="width:100%; height:20px; text-align: ' + column.labelPosition + '; position: absolute; top: 0; z-index:2; padding: 0;" class="pagos-grid-cell-padding">' + data + '</div>';
                                    } else {
                                        //if hide values flag is selected
                                        if (column.hideValues)
                                            data = '';

                                        //set div content
                                        cellDivHtml += '<div style="width:100%; height:20px; text-align: ' + column.labelPosition + '; position: absolute; padding: 0; top: 0; z-index:2;" class="pagos-grid-cell-padding">' + data + '</div>';

                                        //check whether the value is less than zero
                                        if (widthPercent != 0)
                                            cellDivHtml += '<div style="width:' + widthPercent + '%; height: 20px; text-align: ' + column.labelPosition + '; position: absolute; top: 0; background: ' + cond.startColor + '; padding: 0;" class="pagos-grid-cell-padding"></div>';

                                        cellDiv.html(cellDivHtml);
                                    }
                                }
                                break;
                            case "gradient":
                                {
                                    //declare gradient variables
                                    let gradient = e.gridGradient(cond.startColor, cond.endColor, ratio);

                                    //set cell value
                                    if (value == 0) {
                                        value = '';
                                        cell.html(value);
                                    }

                                    //set cell background color
                                    if (!isNaN(value)) {
                                        if (value != 0 || column.startFromZero) {
                                            cell.css('backgroundColor', gradient);
                                        }
                                    }
                                }
                                break;
                        }
                        
                    }
                });
            }
        };

        let getMeasures = function () {
            //declare variables
            let measures = [];

            //iterate all cols
            that.columns.forEach(function (c) {
                //check behavior
                if (c.direction === 'data')
                    measures.push(e.clone(c));
            });

            //return founded measures
            return measures;
        };

        let getRows = function () {
            //declare variables
            let rows = [];

            //iterate all cols
            that.columns.forEach(function (c) {
                //check behavior
                if (c.direction === 'row')
                    rows.push(e.clone(c));
            });

            //return founded measures
            return rows;
        };

        let getColByName = function (name) {
            //declare needed variables
            let col = null;

            //iterate all columns
            that.columns.forEach(function (column) {
                //check if columnname matches with the given
                if (column.fieldName === name)
                    col = column;
            });

            //return founded column
            return col;
        };

        let getSelectedRow = function () {
            return that._selectedRow;
        };

        let getColIndexByfieldName = function (fieldName) {
            //declare needed variables
            let index = -1;

            //iterate all columns to find index
            that.columns.forEach(function (c, i) {
                //check if current col field matches with the given
                if (c.fieldName === fieldName)
                    index = i;
            });

            //return found index
            return index;
        };

        let getMinMaxValues = function (fieldName) {
            //declare needed variables
            let min = 0, max = 0;
            let rows = that._rows;

            //check whether the vis is grid
            if (that.behavior === "tabular") {
                //set min and max values
                min = parseFloat(that._minMaxValues[0][fieldName + "_min"]);
                max = parseFloat(that._minMaxValues[0][fieldName + "_max"]);

                //return calculated min and max
                return {
                    min: min,
                    max: max
                };
            }

            //check whether the pivot mode is classical
            if (that.pivotMode === 'classical') {
                //get row count
                let rowsArray = getRows(),
                    rowNames = [];

                //iterate all rows
                rowsArray.forEach(function (r) {
                    //push current row into the rownames
                    rowNames.push(r.fieldName);
                });

                //iterate all rows to set max
                rows.forEach(function (row, index) {
                    //check row index
                    for (var key in row) {
                        //check key
                        if (rowNames.indexOf(key) == -1) {
                            //check if current value bigger than max
                            if (row[key] > max)
                                max = parseFloat(row[key]);
                        }
                    }
                });

                //set min as max
                min = max;

                //iterate all rows to set min
                rows.forEach(function (row, index) {
                    //check row index
                    for (var key in row) {
                        //check key
                        if (rowNames.indexOf(key) == -1) {
                            //check if current value bigger than max
                            if (row[key] != null)
                                if (row[key] < min)
                                    min = parseFloat(row[key]);
                        }
                    }
                });

                //return calculated min and max
                return {
                    min: min,
                    max: max
                };
            } else {
                //iterate all rows to set max
                rows.forEach(function (row, index) {
                    //check whether the current cell is not null or undefined
                    if (row[fieldName] != null && row[fieldName] != undefined && !isNaN(row[fieldName])) {
                        //set max value
                        if (row[fieldName] > max)
                            max = parseFloat(row[fieldName]);
                    }
                });

                //set min as max
                min = max;

                //iterate all rows to set min
                rows.forEach(function (row, index) {
                    //check whether the current cell is not null or undefined
                    if (row[fieldName] != null && row[fieldName] != undefined && !isNaN(row[fieldName])) {
                        //set min value
                        if (row[fieldName] < min)
                            min = parseFloat(row[fieldName]);
                    }
                });

                //return calculated min and max
                return {
                    min: min,
                    max: max
                };
            }
        };

        let getClassicalMinMaxValues = function (rows) {
            //declare needed variables
            let min = 0, max = 0;

            //iterate all rows
            rows.forEach(function (row, rowIndex) {
                //iterate all columns
                that.columns.forEach(function (column, colIndex) {
                    //check whether the current column behavior is data
                    if (column.direction === 'data') {
                        //check whether the current cell value is not null or undefined
                        if (row[column.fieldName] != null && row[column.fieldName] != undefined && !isNaN(row[column.fieldName])) {
                            //check whether the max
                            if (row[column.fieldName] > max)
                                max = row[column.fieldName];
                        }
                    }
                });
            });

            //set mins
            min = max;

            //iterate all rows
            rows.forEach(function (row, rowIndex) {
                //iterate all columns
                that.columns.forEach(function (column, colIndex) {
                    //check whether the current column behavior is data
                    if (column.direction === 'data') {
                        //check whether the current cell value is not null or undefined
                        if (row[column.fieldName] != null && row[column.fieldName] != undefined && !isNaN(row[column.fieldName])) {
                            //check whether the min
                            if (row[column.fieldName] < min)
                                min = row[column.fieldName];
                        }
                    }
                });
            });

            //return min max
            return {
                min: min,
                max: max
            };
        };

        let getSummarizeByColumn = function (colIndex) {
            //declare needed variables
            let col = that.columns[colIndex],
                valueArray = [],
                subRowsCount = 0,
                min = 0, max = 0, abs = 0, total = 0;

            //iterate all rows
            that._rows.forEach(function (row) {
                //get column value
                let currentValue = parseFloat(row[col.fieldName]);

                //check if current value is not nan
                if (!isNaN(currentValue)) {
                    //push current value into stack
                    valueArray.push(currentValue);

                    //increase total value
                    total += currentValue;
                }

                if (row[col.fieldName] != null)
                    subRowsCount++;
            });

            //sort value array
            valueArray.sort();

            //switch expression
            switch (col.expression) {
                case 'count':
                    abs = subRowsCount;
                case 'sum':
                    abs = total;
                    break;
                case 'avg':
                    abs = total / subRowsCount;
                    break;
                case 'min':
                    abs = d3.min(valueArray);
                    break;
                case 'max':
                    abs = d3.max(valueArray);
                    break;
                default:
                    abs = total;
                    break;
            }

            //return formatted value
            return formatCell(abs, col);
        };

        let getColIndexByID = function (colID) {
            //declare needed variables
            var index = -1;

            //iterate all columns to find index
            that.columns.forEach(function (c, i) {
                //check if current col field matches with the given
                if (c.fieldID === colID)
                    index = i;
            });

            //return found index
            return index;
        };

        //attach update dataset
        this.update = function (data) {
            //handle errors
            if (data == null) return false;

            //declare variables
            var that = this;    

            //switch grid behavior
            switch (that.behavior) {
                case 'tabular':
                    bindGrid(data);
                    break;
                case 'pivot':
                    bindPivot(data);
                    break;
            }

            //assign resizable to each cols
            $('.' + that.container + '_cols').each(function (index) {
                //attach resizable
                $(this).resizable({
                    handles: 'e',
                    resize: function (e, ui) {
                        //declare needed variables
                        var currentColField = $(this).attr('colid'),
                            currentColIndex = getColIndexByID(currentColField);

                        //update col size
                        that.columns[currentColIndex].width = ui.size.width;

                        //resize columns
                        $('.' + that.container + '_rowCol_' + currentColIndex).css('width', ui.size.width + 'px');
                    },
                    stop: function (e, ui) {
                            
                    }
                });
            });
        };

        //check document ready
        $(document).ready(function () {
            //initialize grid
            initGrid();
        });
    }

    //attach grid 
    eve.grid = function (options) {
        //set behavior
        options.behavior = "tabular";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the grid
        return new grid(options);
    };

    //attach pivot
    eve.pivot = function (options) {
        //set behavior
        options.behavior = "pivot";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the grid
        return new grid(options);
    };
})(eve);