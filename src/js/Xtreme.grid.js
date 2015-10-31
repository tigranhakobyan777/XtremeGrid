(function (xtreme) {
    "use strict";

    var _defaults = {
        width: 400,
        height: 300,
        headHeight: 45,
        rowHeight: 40,
        columnOptions: true,
        columnOptionsWidth: 150,
        checkboxes: false,
        checkboxesWidth: 50,
        multiSelect: false,
        selectOnRowClick: false,
        bodyTextSelectable: false,
        copyLocal: false,
        cls: false,
        selectable: true,
        dataSource: false,
        data: false,
        columns: false,
        debug: false,
        horizontalScroll: true,
        filter: false,
        listeners: false
    };

    var $X = xtreme;

    var _prefix = "xtreme",
        _gridClass = _prefix + '-grid',

        _headPrefix = _prefix + 'GridHead-',
        _headClass = _prefix + '-grid-head',
        _columnOptionsClass = _prefix + '-grid-column-options',

        _headCheckboxPrefix = _prefix + 'GridHeadCheckbox-',
        _bodyPrefix = _prefix + 'GridBody-',
        _leftPrefix = _prefix + 'GridLeft-',
        _rightPrefix = _prefix + 'GridRight-',
        _centerPrefix = _prefix + 'GridCenter-',
        _leftClass = _prefix + '-grid-body-left',
        _rightClass = _prefix + '-grid-body-right',
        _centerClass = _prefix + '-grid-body-center',
        _rowEvenClass = _prefix + '-grid-row-even',
        _rowOddClass = _prefix + '-grid-row-odd',
        _bodyRowSelectedClass = _prefix + '-grid-row-selected',

        _columnHeaderArrowClass = _prefix + '-grid-column-header-arrow',
        _columnHeaderArrowActiveClass = _prefix + '-grid-column-header-arrow-active',
        _columnSortArrowClass = _prefix + '-grid-column-sort-arrow',
        _columnSortedClass = _prefix + '-grid-column-sorted',
        _columnSortAscendingArrowClass = _prefix + '-grid-column-sort-arrow-ascending',
        _columnSortArrowPrefix = _prefix + 'GridSortArrow-',
        _columnHeaderArrowPrefix = _prefix + 'GridHeaderArrow-',

        _columnOptionClass = _prefix + '-grid-column-header-option-checkbox',

        _bodyClass = _prefix + '-grid-body',
        _vScrollContainerClass = _prefix + '-grid-body-scroll-container',
        _vScrollDivClass = _prefix + '-grid-body-div-container',
        _bodyBlockClass = _prefix + '-grid-body-block',
        _rowClass = _prefix + '-grid-row',
        _cellClass = _prefix + '-grid-cell',

        _divTemplate = new $X.HtmlTemplate('<div {properties} {styles}>{body}</div>'),
        
        _typeHeaderArrow = 1,
        _typeSortArrow = 2,
        _typeHeaderCell = 3,
        _typeBodyCell = 4,
        _typeHeaderOption = 5,
        _typeHeaderCheckbox = 6,
        _typeBodyCheckbox = 7;

    var _filter = function(caller, data, fn, ref) {
        if (!!fn) {
            var temp = [];
            for (var i = 0; i < data.length; i++) {
                if (fn.call(caller, i, data[i], data)) {
                    temp[temp.length] = (ref ? data[i] : $X.clone(data[i]));
                }
            }

            return temp;
        }

        return ref ? data : $X.clone(data);
    };

    var _process = function (source) {
        var temp = [];
        var X;
        for (var i = 0; i < source.length; i++) {
            X = $X.clone(source[i]);
            X._id_ = i;
            temp[temp.length] = X;
        }
        return temp;
    };
    
    var XtremeGrid = function (container, options) {
        'use strict';
        var self = this;

        _defaults.width = container.clientWidth;
        _defaults.height = container.clientHeight;
        
        //Options
        this.options = this.merge(options || {}, _defaults);

        //Data variables [public]
        this.container = container;
        this.id = this.options.id || $X.Guid.newGuid();
        this.name = this.options.name || this.id;
        this.data = [];
        this.dataSource = false;
        this._data = [];
        this._viewData = [];
        this.blocked = false;
        this.columns = [];
        this.currentPosition = 0;

        //Data variables [private]
        this._columns = [];
        this._selected = [];

        //General elements
        this._grid = null;
        this._blockDiv = null;
        this._head = null;
        this._body = null;
        this._left = null;
        this._center = null;
        this._right = null;
        this._vScrollContainer = null;
        this._vScrollDiv = null;
        this.debug = {};
        this.ready = false;

        $X.Register(self, self.name);

        var headerMenuRenderer = function () {
            var ul = self.$new('ul');
            var _cols = self._columns;
            for (var i = 0; i < _cols.length; i++) {
                if (self.columns[i].options === false) {
                    continue;
                }

                var li = self.$new('li');
                li.className = _columnOptionClass;

                var chBox = self.$new('input');
                chBox.type = 'checkbox';
                chBox.setAttribute('column', i);
                chBox.checked = _cols[i].visible;
                chBox.setAttribute('phType', _typeHeaderOption);
                chBox.id = $X.Guid.newGuid();

                var label = self.$new('label');
                label.setAttribute('for', chBox.id);
                label.setAttribute('phType', _typeHeaderOption);
                label.innerHTML = self.columns[i].title;
                label.setAttribute('column', i);

                li.appendChild(chBox);
                li.appendChild(label);

                ul.appendChild(li);
            }
            return ul;
        };

        this.headerOptionsMenu = [
            {
                name: "Columns",
                renderer: headerMenuRenderer
            }
        ];

        //functions [public]
        this.getSelected = function () {
            var temp = [];
            var x;
            for (var i = 0; i < this._data; i++) {
                if (this._selected.indexOf(this._data[i]._id_) >= 0) {
                    x = this._data[i].clone();
                    x._id_ = null;
                    temp[temp.length] = x;
                }
            }
            return temp;
        };

        //Initialization
        self.init();
    };
    XtremeGrid.prototype.changeOptions = function (ops) {
        if (ops) {
            this._selected.length = 0;

            this.unWatch('_grid');
            this.unWatch('_header');
            this.unWatch('_body');
            this.unWatch('container');

            this.container.innerHTML = '';
            this.options = this.merge(ops, this.options);
            this.init();
            this.refresh();

            this.callListener('optionsChanged', true, ops);
        }
    };

    XtremeGrid.prototype.dispose = function () {
        this._dispose();
        
        this.unWatch('columns');
        this.unWatch('_columns');
        this.unWatch('data');
        this.unWatch('_data');
        this.unWatch('_viewData');
        this.unWatch('dataSource');
        this.unWatch('currentPosition');
        this.unWatch('blocked');

        this.unWatch('_grid');
        this.unWatch('_header');
        this.unWatch('_body');
        this.unWatch('container');

        this._center.children.remove();
        this._left.children.remove();
        this._right.children.remove();
        this._body.children.remove();
        this._head.children.remove();
        this._grid.children.remove();
        this.container.removeChild(this._grid);

        this.callListener('disposed', true);
        for (var p in this) {
            this[p] = null;
        }
    };

    XtremeGrid.prototype.hideShowColumn = function (n) {
        var self = this;
        var visibleCount = 0;
        var _cols = self._columns;
        if (n < _cols.length) {
            for (var j = 0; j < _cols.length; j++) {
                if (_cols[j].visible && _cols[j].options !== false) {
                    visibleCount++;
                }
            }

            if (visibleCount > 1 || (visibleCount < 2 && !_cols[n].visible)) {
                _cols[n].visible = !_cols[n].visible;
                self._columns = _cols;
            }
        }
    };

    XtremeGrid.prototype.deleteRow = function (_id) {
        var i;
        for (i = 0; i < this._data.length; i++) {
            if (this._data[i]._id_ == _id) {
                this._data.splice(i, 1);
                this.callListener('deleteRow', true);
                break;
            }
        }
        for (i = 0; i < this._viewData.length; i++) {
            if (this._viewData[i]._id_ == _id) {
                this._viewData.splice(i, 1);
                break;
            }
        }

        this._selected.length = 0;
        this._viewData = (this._viewData.length > 0 ? this._viewData : this._data);
    };

    XtremeGrid.prototype.merge = function (obj1, obj2, override) {
        var obj3 = {};

        for (var a in obj1) { obj3[a] = obj1[a]; }
        for (var b in obj2) {
            if (override) {
                obj3[b] = obj2[b];
            } else {
                if (obj3[b] === undefined) {
                    obj3[b] = obj2[b];
                }
            }
        }

        return obj3;
    };

    XtremeGrid.prototype.getIdFor = function (prefix) {
        return prefix + this.id;
    };

    XtremeGrid.prototype.$new = function (tag) {
        return document.createElement(tag);
    };

    XtremeGrid.prototype.$id = function (id) {
        return document.getElementById(id);
    };

    XtremeGrid.prototype.$own = function (prefix) {
        return document.getElementById(prefix + this.id);
    };

    XtremeGrid.prototype.init = function () {
        'use strict';
        var self = this;
        
        this._blockDiv = this.$new('div');
        this._blockDiv.className = _bodyBlockClass;

        this._grid = this.$new('div');
        this._grid.id = this.id;
        this._grid.className = _gridClass + (this.options.cls ? ' ' + this.options.cls : '');

        this._grid.style.width = this.options.width + 'px';
        this._grid.style.height = this.options.height + 'px';
       
        this.container.appendChild(this._grid);
        var gridClientWidth = this._grid.clientWidth;

        this._head = this.$new('div');
        this._head.id = this.getIdFor(_headPrefix);
        this._head.className = _headClass;
        this._head.style.height = this.options.headHeight + 'px';
        this._head.style.lineHeight = this.options.headHeight + 'px';
        this._head.style.width = gridClientWidth + 'px';

        this._body = this.$new('div');
        this._body.id = this.getIdFor(_bodyPrefix);
        this._body.className = _bodyClass + (this.options.bodyTextSelectable ? '' : ' no-user-select');
        this._body.style.height = (this.options.height - this.options.headHeight) + 'px';
        this._body.style.width = gridClientWidth + 'px';

        this._grid.appendChild(this._head);
        this._grid.appendChild(this._body);

        var bodyHeight = this._body.clientHeight - 2;
        var bodyWidth = this._body.clientWidth;
        var headHeight = this._head.offsetHeight;

        this._left = this.$new('div');
        this._left.id = this.getIdFor(_leftPrefix);
        this._left.style.height = bodyHeight + 'px';
        this._left.className = _leftClass;

        this._right = this.$new('div');
        this._right.id = this.getIdFor(_rightPrefix);
        this._right.style.height = bodyHeight + 'px';
        this._right.className = _rightClass;

        this._center = this.$new('div');
        this._center.id = this.getIdFor(_centerPrefix);
        this._center.style.height = bodyHeight + 'px';
        this._center.style.width = bodyWidth + 'px';
        this._center.className = _centerClass;

        this._vScrollContainer = this.$new('div');
        this._vScrollContainer.className = _vScrollContainerClass;
        this._vScrollContainer.style.height = bodyHeight + 'px';
        this._vScrollContainer.style.top = (headHeight + 1) + 'px';
        this._vScrollContainer.onscroll = function () {
            self.currentPosition = Math.ceil(this.scrollTop / self.options.rowHeight);
        };
        this._vScrollDiv = this.$new('div');
        this._vScrollDiv.className = _vScrollDivClass;
        this._vScrollContainer.appendChild(this._vScrollDiv);

        this._body.appendChild(this._left);
        this._body.appendChild(this._center);
        this._body.appendChild(this._right);
        this._grid.appendChild(this._vScrollContainer);
        this._grid.appendChild(this._blockDiv);

        this._grid.onscroll = self._onGridScroll;

        self.setMouseEvents();
        self.setWatchers();

        self.ready = true;

        if (this.options.columns) {
            self.columns = this.options.columns;
        }
        if (this.options.data) {
            self.data = this.options.data;
        }

        if (this.options.dataSource) {
            self.dataSource = this.options.dataSource;
        }

        self.callListener('draw', true);
    };
    
    XtremeGrid.prototype._onGridScroll = function() {
        this._vScrollContainer.style.right = (this._grid.scrollLeft > 0 ? (-1 * this._grid.scrollLeft) + 'px' : 0);
    };

    XtremeGrid.prototype.requestData = function (url) {
        var self = this;

        if (self.options.debug) {
            $X.DebugSession(self.id).start();
        }

        self.blocked = true;
        $X.Ajax
            .request(url || self.dataSource)
            .done(function (data) {
                if (self.options.debug) {
                    $X.DebugSession(self.id).end();
                    self.debug.ajaxLoad = $X.DebugSession(self.id).duration();
                    self.options.debug.call(self, 'ajaxLoad', $X.DebugSession(self.id).duration());
                }

                self.blocked = false;
                self.data = JSON.parse(data);
            });
    };

    XtremeGrid.prototype.isBlocked = function() {
        return this.blocked;
    };

    XtremeGrid.prototype._onColumnsSet = function () {
        this._selected.length = 0;
        this._columns = $X.clone(this.columns, true);
    };

    XtremeGrid.prototype._on_ColumnsSet = function () {
        for (var i = 0; i < this.columns.length; i++) {
            if (this._columns[i].visible === undefined) {
                this._columns[i].visible = true;
            }
            if (this._columns[i].sortable === undefined) {
                this._columns[i].sortable = true;
            }
        }

        this.renderHead();
        this.renderBody();
    };

    XtremeGrid.prototype._onDataSet = function () {
        if (this.options.debug) {
            $X.DebugSession(this.id + 'render').start();
        }

        this._selected.length = 0;
        this._data = _filter(this, _process(this.data));

        if (this.options.debug) {
            $X.DebugSession(this.id + 'render').end();
            this.debug.render = $X.DebugSession(this.id + 'render').duration();

            this.options.debug.call(this, 'render', $X.DebugSession(this.id + 'render').duration());
        }
    };

    XtremeGrid.prototype._on_DataSet = function () {
        this._viewData = (this.options.filter ? _filter(this, this._data, this.options.filter, true) : this._data);
    };

    XtremeGrid.prototype._onBlockedSet = function (p, o, n) {
        this._blockDiv.style.display = (n ? 'block' : 'none');
    };

    XtremeGrid.prototype._onDataSourceSet = function (p, o, n) {
        this.requestData();
    };

    XtremeGrid.prototype.setWatchers = function () {
        'use strict';
        var self = this;

        self.readOnly('_grid');
        self.readOnly('_header');
        self.readOnly('_body');
        self.readOnly('container');
        
        self.onChange('columns', !self.isBlocked, self._onColumnsSet);
        self.onChange('_columns', null, self._on_ColumnsSet);

        self.onChange('data', !self.isBlocked, self._onDataSet);
        self.onChange('_data', null, self._on_DataSet);
        self.onChange('_viewData', null, self.renderBody);
        self.onChange('dataSource', null, self._onDataSourceSet);
        self.onChange('currentPosition', null, self.renderBody);
        self.onChange('blocked', null, self._onBlockedSet);
    };

    XtremeGrid.prototype.refresh = function () {
        this.renderHead();
        this.renderBody();

        this.callListener('refresh', true);
    };

    XtremeGrid.prototype.selectRow = function (_id, state) {
        if (!this.options.selectable) {
            return;
        }
        if (_id < this._data.length) {
            if (state || state === undefined) {
                if (!this.options.multiSelect) {
                    this._selected.length = 0;
                }

                if (this._selected.indexOf(_id) < 0) {
                    this._selected[this._selected.length] = _id;
                    this.callListener('selectRow', true);
                }
            } else {
                this._selected.splice(this._selected.indexOf(_id), 1);
            }

            var allCheckbox = this.$own(_headCheckboxPrefix);
            if (allCheckbox) {
                allCheckbox.checked = (this._selected.length === this._viewData.length);
                allCheckbox.indeterminate = this._selected.length > 0 && !allCheckbox.checked;
            }

            this.renderBody();
        }
    };

    XtremeGrid.prototype.toggleRow = function (_id) {
        if (!this.options.selectable || _id == null) {
            return;
        }

        this.selectRow(_id, this._selected.indexOf(_id) < 0);
    };

    XtremeGrid.prototype.selectAll = function (state) {
        if (!this.options.selectable) {
            return;
        }
        if (this.options.multiSelect && !this.blocked) {
            if (state || state === undefined) {
                this._selected.length = 0;
                for (var i = 0; i < this._viewData.length; i++) {
                    this._selected[this._selected.length] = this._viewData[i]._id_;
                }

                this.callListener('selectAll', true);
            } else {
                this._selected.length = 0;
            }

            var allCheckbox = this.$own(_headCheckboxPrefix);
            if (allCheckbox) {
                allCheckbox.checked = (this._selected.length == this._viewData.length);
            }

            this.renderBody();
        }
    };

    XtremeGrid.prototype.setMouseEvents = function () {
        var self = this;

        var onmousewheel = function (event) {
            
            var e = window.event || event;

            var src = e.srcElement || e.target;

            if (src) {
                var type = parseInt(src.getAttribute('phType'));
                if (type == _typeHeaderOption) {

                } else {
                    event.preventDefault();
                    var delta = e.wheelDelta || (-1 * e.detail);
                    self.scroll(delta > 0);
                }
            }

            return false;
        };

        var sort = function (src) {
            var col = parseInt(src.getAttribute('column'));
            if (!self._columns[col].sortable) {
                return;
            }

            self._columns[col].ascending = !self._columns[col].ascending;
            var asc = self._columns[col].ascending;

            var sortArrow = self.$id(_columnSortArrowPrefix + self.id + col);

            var sib = self.siblings(src);
            var i;
            for (i = 0; i < sib.length; i++) {
                if (sib[i].className.indexOf(_columnSortedClass) >= 0) {
                    sib[i].classList.toggle(_columnSortedClass);
                }
            }

            if (!src.classList.contains(_columnSortedClass)) {
                src.classList.add(_columnSortedClass);
            }
            if (asc) {
                if (sortArrow.className.indexOf(_columnSortAscendingArrowClass) < 0) {
                    sortArrow.classList.add(_columnSortAscendingArrowClass);
                }
            } else {
                if (sortArrow.className.indexOf(_columnSortAscendingArrowClass) >= 0) {
                    sortArrow.classList.toggle(_columnSortAscendingArrowClass);
                }
            }

            self._selected.length = 0;

            var allCheckbox = self.$own(_headCheckboxPrefix);
            if (allCheckbox) {
                allCheckbox.checked = false;
            }

            for (i = 0; i < self.columns.length; i++) {
                self.columns[i].sorted = (i == col);
            }

            self.blocked = true;
            setTimeout(function () {
                self._data = self.sort(self._data, self.columns[col].data, asc);
                self.blocked = false;
            }, 20);
            
        };

        var ongridclick = function (event) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            self.removeColumnOptions();

            var src = event.srcElement || event.target;
            if (src) {
                if (self.blocked) {
                    if (src.getAttribute('type') == 'checkbox' || src.getAttribute('type') == 'radio') {
                        src.checked = !src.checked;
                    }
                    return null;
                }

                var type = parseInt(src.getAttribute('phType'));

                switch (type) {

                    case _typeBodyCheckbox: self.toggleRow(parseInt(src.parentElement.getAttribute('_id_'))); break;
                    case _typeBodyCell:
                        if (self.options.selectOnRowClick) {
                            self.toggleRow(parseInt(src.parentElement.getAttribute('_id_')));
                        }
                        break;
                    case _typeHeaderCell: sort(src); break;
                    case _typeHeaderArrow: self.onColumnOptionsClick(event); break;
                    case _typeSortArrow: sort(src.parentElement); break;
                    case _typeHeaderCheckbox:
                        if (self.blocked) {
                            src.checked = false;
                        } else {
                            self.selectAll(src.checked);
                        }
                        break;
                    case _typeHeaderOption:
                        self.hideShowColumn(parseInt(src.getAttribute('column')));
                        break;

                    default:
                        break;
                }
            }
        };

        if (this._body.addEventListener) {
            // IE9, Chrome, Safari, Opera
            this._body.addEventListener("mousewheel", onmousewheel, false);
            // Firefox
            this._body.addEventListener("DOMMouseScroll", onmousewheel, false);
        } else {
            this._body.attachEvent("onmousewheel", onmousewheel);
        }

        this.listen(this._grid, 'click', ongridclick);

        this.listen(window, 'click', function (event) {
            var src = event.srcElement || event.target;
            if (src) {
                var type = parseInt(src.getAttribute('phType'));

                if (type != _typeHeaderOption) {
                    self.removeColumnOptions();
                }
            }
        });
    };

    XtremeGrid.prototype.visibleRows = function () {
        return Math.ceil(this._center.clientHeight / this.options.rowHeight);
    };

    XtremeGrid.prototype.maxScroll = function () {
        return this._data.length - Math.ceil(this._center.clientHeight / this.options.rowHeight) + 1;
    };

    XtremeGrid.prototype.scrollTo = function (rowIndex) {
        var maxScroll = this.maxScroll();
        var I = rowIndex < 0 ? 0 : rowIndex > maxScroll ? maxScroll : rowIndex;

        this.currentPosition = I;
    };

    XtremeGrid.prototype.scroll = function (up) {
        var maxScroll = this.maxScroll();

        if (up) {
            if (this.currentPosition > 0) {
                this.currentPosition -= 1;
            }
        } else {
            if (this.currentPosition < maxScroll) {
                this.currentPosition += 1;
            }
        }
    };
    
    XtremeGrid.prototype.siblings = function () {
        var getChildren = function (n, skipMe) {
            var r = [];
            for (; n; n = n.nextSibling) {
                if (n.nodeType == 1 && n != skipMe) {
                    r[r.length] = n;
                }
            }

            return r;
        };

        return function (n) {
            return getChildren(n.parentNode.firstChild, n);
        };
    }();

    XtremeGrid.prototype.listen = function (element, eventName, handler) {
        if (element.addEventListener) {
            element.addEventListener(eventName, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + eventName, handler);
        } else {
            element['on' + eventName] = handler;
        }
    };

    XtremeGrid.prototype.removeListener = function (element, eventName, handler) {
        if (element.addEventListener) {
            element.removeEventListener(eventName, handler, false);
        } else if (element.detachEvent) {
            element.detachEvent('on' + eventName, handler);
        } else {
            element['on' + eventName] = null;
        }
    };

    XtremeGrid.prototype.removeColumnOptions = function () {
        var arrows = document.getElementsByClassName(_columnHeaderArrowActiveClass);
        if (arrows.length > 0) {
            for (var i = 0; i < arrows.length; i++) {
                if (!!arrows[i].hideOptions) {
                    arrows[i].hideOptions();
                }
            }
        }
    };

    XtremeGrid.prototype.onColumnOptionsClick = function (event) {
        'use strict';
        var self = this;

        var src = event.srcElement || event.target;
        if (src) {
            var right = src.offsetParent.offsetLeft + src.offsetLeft + src.offsetWidth - this._body.offsetLeft;
            var maxHeight = self._grid.clientHeight - self._head.offsetHeight - 10;

            var div = this.$new('div');
            div.className = _columnOptionsClass;

            var ul = this.$new('ul');
            for (var i = 0; i < self.headerOptionsMenu.length; i++) {
                var option = self.headerOptionsMenu[i];
                if (!!option.renderer) {
                    ul.appendChild(option.renderer());
                } else {
                    var li = this.$new('li');
                    li.innerHTML = self.headerOptionsMenu[i].name;

                    ul.appendChild(li);
                }
            }
            div.appendChild(ul);
            self._body.appendChild(div);
            if (div.offsetHeight >= maxHeight) {
                div.style.height = maxHeight + 'px';
            }

            var width = div.offsetWidth;
            var left = (right - width + 1);
            if (left < 0) {
                left += (width - src.offsetWidth) - 1;
            }

            div.style.width = width + 'px';
            div.style.left = left + 'px';

            src.classList.add(_columnHeaderArrowActiveClass);
            src.hideOptions = function () {
                if (src.className.indexOf(_columnHeaderArrowActiveClass) >= 0) {
                    src.classList.toggle(_columnHeaderArrowActiveClass);
                }

                div.remove();
            };
        }

        return false;
    };

    XtremeGrid.prototype.renderHead = function () {
        if (!this.ready) {
            return;
        }

        this.removeColumnOptions();

        var cols = this.columns;
        var _cols = this._columns;

        if (cols.length > 0) {
            var colsCount = 0;
            var i;
            for (i = 0; i < _cols.length; i++) {
                if (_cols[i].visible) {
                    colsCount++;
                }
            }

            var startWidth = this.options.checkboxes && this.options.selectable ? this.options.checkboxesWidth : 0;
            var remainCols = 0;
            for (i = 0; i < _cols.length; i++) {
                if (_cols[i].visible) {
                    if (cols[i].width != undefined) {
                        startWidth += cols[i].width;
                    } else {
                        remainCols++;
                    }
                }
            }

            var remainingWidth = this._grid.clientWidth - startWidth;
            if (remainingWidth < 0) {
                remainingWidth = 0;
            }

            if (this.options.horizontalScroll && remainCols > 0 && remainingWidth < remainCols * 40) {
                remainingWidth = remainCols * 40;
            }

            var allWidth = startWidth + remainingWidth;

            this._head.style.width = allWidth + 'px';
            var colWidth = remainingWidth / remainCols;

            for (i = 0; i < _cols.length; i++) {
                if (_cols[i].visible && cols[i].width === undefined) {
                    _cols[i].width = colWidth;
                }
            }

            var html = '';
            var headerArrow = '';
            var headerSortArrow = '';
            var headHeight = this._head.clientHeight + 'px';

            if (this.options.checkboxes && this.options.selectable) {
                html += _divTemplate.replace({
                    body: this.options.multiSelect
                        ? '<input type="checkbox" id="' + this.getIdFor(_headCheckboxPrefix) + '" phType="' + _typeHeaderCheckbox + '" />'
                        : '',
                    properties: {
                        column: '-1',
                        'class': _cellClass + ' alignment-center'
                    },
                    styles: {
                        width: this.options.checkboxesWidth + 'px',
                        height: headHeight
                    }
                }, true);
            }

            for (i = 0; i < _cols.length; i++) {
                headerArrow = '';
                if (!_cols[i].visible) {
                    continue;
                }

                if (this.options.columnOptions && _cols[i].options !== false) {
                    headerArrow = _divTemplate.replace({
                        properties: {
                            id: _columnHeaderArrowPrefix + i,
                            'class': _columnHeaderArrowClass,
                            phType: _typeHeaderArrow,
                            column: i
                        }
                    }, true);
                }

                headerSortArrow = _divTemplate.replace({
                    properties: {
                        'column': i,
                        phType: _typeSortArrow,
                        'id': _columnSortArrowPrefix + this.id + i,
                        'class': _columnSortArrowClass
                    }
                }, true);

                html += _divTemplate.replace({
                    body: _cols[i].title + headerSortArrow + headerArrow,
                    properties: {
                        column: i,
                        phType: _typeHeaderCell,
                        'class': _cellClass
                            + (i == _cols.length - 1 ? ' ' + _cellClass + '-last' : '')
                            + ' alignment-' + (_cols[i].align ? ' alignment-' + _cols[i].align : 'left')
                            + (_cols[i].sorted ? ' ' + _columnSortedClass : '')
                    },
                    styles: {
                        width: _cols[i].width + 'px',
                        height: headHeight
                    }
                }, true);
            }

            this._head.innerHTML =
                _divTemplate.replace({
                    body: html,
                    properties: {
                        'class': _rowClass
                    }
                }, true);
        }
    };

    XtremeGrid.prototype.renderVScroll = function () {
        this._body.style.height = (this._grid.clientHeight - this._head.offsetHeight) + 'px';
        this._left.style.height = this._body.style.height;
        this._center.style.height = this._body.style.height;
        this._right.style.height = this._body.style.height;

        this._vScrollDiv.style.height = (this._viewData.length * this.options.rowHeight) + 'px';
        this._vScrollContainer.scrollTop = this.currentPosition * this.options.rowHeight;
        this._vScrollContainer.style.height = this._body.style.height;
    };

    XtremeGrid.prototype.Filter = function (custom) {
        var fn = custom || this.options.filter;
        this._viewData = _filter(this, this._data, fn, true);
    };

    XtremeGrid.prototype.callListener = function (name, async, params) {
        var self = this;

        if (self.options.listeners && self.options.listeners[name]) {

            if (async) {
                setTimeout(function() {
                    self.options.listeners[name].call(self, params);
                }, 10);
            } else {
                self.options.listeners[name].call(self, params);
            }
        }
    };

    XtremeGrid.prototype.renderBody = function () {
        if (!this.ready) {
            return;
        }

        if (this.options.debug) {
            $X.DebugSession(this.id).start();
        }

        var data = this._viewData,
            _cols = this._columns,
            _position = this.currentPosition;

        if (_cols.length > 0) {
            var allCheckbox = this.$own(_headCheckboxPrefix);
            if (allCheckbox) {
                allCheckbox.checked = (this._selected.length > 0 && this._selected.length === this._data.length);
                allCheckbox.indeterminate = this._selected.length > 0 && !allCheckbox.checked;
            }

            this.renderVScroll();

            var visibleCols = [], colsCount = 0, i;

            for (i = 0; i < _cols.length; i++) {
                if (_cols[i].visible) {
                    visibleCols[visibleCols.length] = _cols[i];
                    colsCount++;
                }
            }

            _cols = visibleCols;

            var rowCount = this._center.clientHeight / this.options.rowHeight;
            if (rowCount > data.length) {
                rowCount = data.length;
            }
            var intRowCount = parseInt(rowCount);

            var needFix = (intRowCount < rowCount && this.currentPosition == this.maxScroll());
            if (needFix) {
                _position -= 1;
            }

            this._body.style.width = this._head.style.width;
            this._center.style.width = this._head.style.width;

            var html = '', row = '', p, _pos, rowSelected, j, currentDataValue;

            for (i = 0; i < rowCount; i++) {
                _pos = i + _position;
                row = '';
                
                if (this.options.checkboxes && this.options.selectable) {
                    row += _divTemplate.replace({
                        body: '<input type="checkbox" ' + (this._selected.indexOf(data[_pos]._id_) >= 0 ? "checked='checked'" : '') + ' phType="' + _typeBodyCheckbox + '" row="' + _pos + '" />',
                        properties: {
                            'class': _cellClass + ' alignment-center',
                            _id_: data[_pos]._id_
                        },
                        styles: {
                            width: this.options.checkboxesWidth + 'px',
                            height: this.options.rowHeight + 'px'
                        }
                    }, true);
                }

                for (j = 0; j < _cols.length; j++) {
                    if (data[_pos] instanceof Array) {
                        currentDataValue = data[_pos][j];
                    } else {
                        p = _cols[j].data;
                        currentDataValue = data[_pos][p];
                    }
                    
                    row += _divTemplate.replace({
                        body: (_cols[j].renderer
                            ? _cols[j].renderer(currentDataValue, _pos, data[_pos]._id_, data[_pos], data) //value, row, dataId, object(original), data(original)
                            : currentDataValue),
                        properties: {
                            column: j,
                            phType: _typeBodyCell,
                            'class': _cellClass + (j == _cols.length - 1 ? ' ' + _cellClass + '-last' : ''),
                            _id_: data[_pos]._id_
                        },
                        styles: {
                            width: _cols[j].width + 'px',
                            height: this.options.rowHeight + 'px'
                        }
                    }, true);
                }
                
                rowSelected = this._selected.indexOf(data[_pos]._id_) >= 0;

                html += _divTemplate.replace({
                    body: row,
                    properties: {
                        row: _pos,
                        _id_: data[_pos]._id_,
                        selected: rowSelected,
                        'class': _rowClass + ' '
                            + ((_pos) % 2 == 0 ? _rowEvenClass : _rowOddClass)
                            + ((intRowCount == rowCount && i == intRowCount - 1) || (intRowCount < rowCount && i == intRowCount) ? ' ' + _rowClass + '-last' : '')
                            + (rowSelected ? ' ' + _bodyRowSelectedClass : '')
                    },
                    styles: {
                        height: this.options.rowHeight + 'px',
                        'line-height': this.options.rowHeight + 'px'
                    }
                }, true);
            }
            
            var margin = '0px';
            if (needFix) {
                margin = rowCount % intRowCount;
                margin = ((1 - margin) * this.options.rowHeight) + 1;
                margin *= -1;
                margin += 'px';
            }

            this._center.style.marginTop = margin;
            this._center.innerHTML = html;
            this.renderVScroll();

            this.callListener('afterRender', true, { msg: 'rendered' });
        }

        if (this.options.debug) {
            $X.DebugSession(this.id).end();
            this.debug.renderBody = $X.DebugSession(this.id).duration();
            this.options.debug.call(this, 'renderBody', $X.DebugSession(this.id).duration());
        }
    };

    XtremeGrid.prototype.sort = function (items, p, asc) {
        "use strict";

        var compareDesc = function (prop) {
            return function (a, b) {
                return ((b[prop] < a[prop]) ? 1 : ((b[prop] > a[prop]) ? -1 : 0));
            };
        };

        var compareAsc = function (prop) {
            return function (a, b) {
                return ((b[prop] < a[prop]) ? -1 : ((b[prop] > a[prop]) ? 1 : 0));
            };
        };

        return items.sort(asc ? compareAsc(p) : compareDesc(p));
    };

    $X.Define('Grid', XtremeGrid);
})(window.Xtreme);