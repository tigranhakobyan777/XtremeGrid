var Xtreme = (function () {
    'use strict';

    var _w = [],
        _debug = [];

    function _dispose(name) {
        _w[name] = null;
    };
    
    var _ajax = {
        request: function(_ops) {
            if (typeof _ops == 'string') _ops = { url: _ops };
            _ops.url = _ops.url || '';
            _ops.method = _ops.method || 'get';
            _ops.data = _ops.data || {};
            var getParams = function(data, url) {
                var arr = [], str;
                for (var name in data) {
                    arr.push(name + '=' + encodeURIComponent(data[name]));
                }
                str = arr.join('&');
                if (str != '') {
                    return url ? (url.indexOf('?') < 0 ? '?' + str : '&' + str) : str;
                }
                return '';
            };
            var api = {
                host: {},
                process: function(ops) {
                    var self = this;
                    this.xhr = null;
                    if (window.ActiveXObject) {
                        this.xhr = new ActiveXObject('Microsoft.XMLHTTP');
                    } else if (window.XMLHttpRequest) {
                        this.xhr = new XMLHttpRequest();
                    }
                    if (this.xhr) {
                        this.xhr.onreadystatechange = function() {
                            if (self.xhr.readyState == 4 && self.xhr.status == 200) {
                                var result = self.xhr.responseText;
                                if (ops.json === true && typeof JSON != 'undefined') {
                                    result = JSON.parse(result);
                                }
                                self.doneCallback && self.doneCallback.apply(self.host, [result, self.xhr]);
                            } else if (self.xhr.readyState == 4) {
                                self.failCallback && self.failCallback.apply(self.host, [self.xhr]);
                            }
                            self.alwaysCallback && self.alwaysCallback.apply(self.host, [self.xhr]);
                        };
                    }
                    if (ops.method == 'get') {
                        this.xhr.open("GET", ops.url + getParams(ops.data, ops.url), true);
                    } else {
                        this.xhr.open(ops.method, ops.url, true);
                        this.setHeaders({
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-type': 'application/x-www-form-urlencoded'
                        });
                    }
                    if (ops.headers && typeof ops.headers == 'object') {
                        this.setHeaders(ops.headers);
                    }
                    setTimeout(function() {
                        ops.method == 'get' ? self.xhr.send() : self.xhr.send(getParams(ops.data));
                    }, 20);
                    return this;
                },
                done: function(callback) {
                    this.doneCallback = callback;
                    return this;
                },
                fail: function(callback) {
                    this.failCallback = callback;
                    return this;
                },
                always: function(callback) {
                    this.alwaysCallback = callback;
                    return this;
                },
                setHeaders: function(headers) {
                    for (var name in headers) {
                        this.xhr && this.xhr.setRequestHeader(name, headers[name]);
                    }
                }
            };
            return api.process(_ops);
        }
    };
    
    var _debugSession = function () {
        var _start = 0, _end = 0;

        return {
            start: function() {
                return _start = (+new Date());
            },

            end: function() {
                return _end = (+new Date());;
            },

            duration: function () {
                return _end - _start;
            },

            dispose: function () {
                var I = _debug.indexOf(this);
                if (I >= 0) {
                    _debug.splice(I, 1);
                }
            }
        };
    };

    var _guid = function () {

        var s4 = function () {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        };

        return {
            newGuid: function () {
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            },

            empty: function () {
                return '00000000-0000-0000-0000-000000000000';
            }
        };
    };

    var _htmlTemplate = function (temp) {
        var self = this;

        this.template = temp;

        var reserved = ['properties', 'styles'];

        return {
            replace: function (data, replaceUndefined) {
                var regExp;
                var replaced = self.template;
                for (var p in data) {
                    if (reserved.indexOf(p) >= 0) continue;

                    regExp = new RegExp("{" + p + "}", "g");
                    replaced = replaced.replace(regExp, data[p]);
                }

                if (data.properties) {
                    var properties = ' ';
                    for (var d in data.properties) {
                        properties += d + '="' + data.properties[d] + '" ';
                    }
                    replaced = replaced.replace(/{properties}/i, properties);
                } else {
                    replaced = replaced.replace(/{properties}/g, '');
                }

                if (data.styles) {
                    var styles = 'style="';
                    for (var s in data.styles) {
                        styles += s + ': ' + data.styles[s] + ';';
                    }
                    styles += '"';

                    replaced = replaced.replace(/{styles}/i, styles);
                } else {
                    replaced = replaced.replace(/{styles}/g, '');
                }

                if (replaceUndefined) {
                    replaced = replaced.replace(/{([^}]+)}/g, '');
                }
                return replaced;
            }
        };
    };

    var _onchange = function (prop, beforeHandler, handler) {
        var val = this[prop],
            scope = this,
            getter = function () {
                return val;
            },
            setter = function (newval) {
                var cond = true;
                if (!!beforeHandler) {
                    cond = beforeHandler.call(scope, prop, val, newval);
                }
                if (cond) {
                    var oldVal = val;
                    val = newval;
                    setTimeout(function () {
                        handler.call(scope, prop, oldVal, newval);
                    }, 1);
                }

                return val;
            };

        if (delete scope[prop]) {
            if (scope.constructor.defineProperty) {
                scope.constructor.defineProperty(scope, prop, {
                    get: getter,
                    set: setter
                });
            } else if (scope.constructor.prototype.__defineGetter__ &&
                scope.constructor.prototype.__defineSetter__) {
                scope.constructor.prototype.__defineGetter__.call(scope, prop, getter);
                scope.constructor.prototype.__defineSetter__.call(scope, prop, setter);
            } else if (Object.defineProperty) {
                Object.defineProperty(scope, prop, {
                    get: getter,
                    set: setter,
                });
            }
        }
    };

    var _readonly = function (prop) {
        var val = this[prop],
            scope = this,
            getter = function () {
                return val;
            };

        if (delete this[prop]) {
            if (scope.constructor.defineProperty) {
                scope.constructor.defineProperty(scope, prop, {
                    get: getter,
                    set: getter
                });
            } else if (scope.constructor.prototype.__defineGetter__ &&
                scope.constructor.prototype.__defineSetter__) {
                scope.constructor.prototype.__defineGetter__.call(scope, prop, getter);
                scope.constructor.prototype.__defineSetter__.call(scope, prop, getter);
            } else if (Object.defineProperty) {
                Object.defineProperty(scope, prop, {
                    get: getter,
                    set: getter,
                });
            }
        }
    };

    var _unwatch = function(prop) {
        var val = this[prop];
        delete this[prop];
        this[prop] = val;
    };

    Element.prototype.remove = function () {
        this.parentElement.removeChild(this);
    };

    NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
        for (var i = 0, len = this.length; i < len; i++) {
            if (this[i] && this[i].parentElement) {
                this[i].parentElement.removeChild(this[i]);
            }
        }
    };

    var _cloneArray = function (source, deep) {
        var o, prop, type;

        if (typeof source != 'object' || source === null) {
            // What do to with functions, throw an error?
            o = source;
            return o;
        }

        o = new source.constructor();

        for (prop in source) {
            if (deep) {
                type = typeof source[prop];

                if (type == 'object' && source[prop] !== null) {
                    o[prop] = _cloneArray(source[prop]);

                } else {
                    o[prop] = source[prop];
                }
            } else {
                o[prop] = source[prop];
            }
        }
        return o;
    };

    var _cloneObject = function (source, deep) {
        var o, prop, type;

        if (typeof source != 'object' || source === null) {
            // What do to with functions, throw an error?
            o = source;
            return o;
        }

        o = {};

        for (prop in source) {
            if (deep) {
                type = typeof source[prop];

                if (type == 'object' && source[prop] !== null) {
                    o[prop] = _cloneObject(source[prop]);

                } else {
                    o[prop] = source[prop];
                }
            } else {
                o[prop] = source[prop];
            }
        }
        return o;
    };

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt) {
            var len = this.length >>> 0;

            var from = Number(arguments[1]) || 0;
            from = (from < 0)
                 ? Math.ceil(from)
                 : Math.floor(from);
            if (from < 0)
                from += len;

            for (; from < len; from++) {
                if (from in this &&
                    this[from] === elt)
                    return from;
            }
            return -1;
        };
    }

    var xtreme = function (name) {
        return _w[name];
    };

    var define = function (name, fn) {
        xtreme[name] = fn;
    }

    xtreme.Define = function(name, fn) {
        define(name, fn);
    }

    xtreme.Register = function (fn, name) {
        fn._dispose = function() {
            _dispose(name);
        };
        fn.onChange = function(prop, beforeHandler, handler) {
            _onchange.call(fn, prop, beforeHandler, handler);
        };
        fn.readOnly = function (prop) {
            _readonly.call(fn, prop);
        };
        fn.unWatch = function (prop) {
            _unwatch.call(fn, prop);
        };
        _w[name] = fn;
    };

    xtreme.DebugSession = function (id) {
        return _debug[id] || (_debug[id] = new _debugSession());
    };

    xtreme.Guid = new _guid();

    xtreme.HtmlTemplate = _htmlTemplate;

    xtreme.Ajax = _ajax;

    xtreme.clone = function (source, deep) {
        return (source instanceof Array ? _cloneArray(source, deep) : _cloneObject(source, deep));
    };
    
    window.$X = window.Xtreme = xtreme;

    if (!window.X) {
        window.X = window.Xtreme;
    }

    return xtreme;
})();