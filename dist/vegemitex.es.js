function klona(x) {
  if (typeof x !== "object")
    return x;
  var k, tmp, str = Object.prototype.toString.call(x);
  if (str === "[object Object]") {
    if (x.constructor !== Object && typeof x.constructor === "function") {
      tmp = new x.constructor();
      for (k in x) {
        if (tmp.hasOwnProperty(k) && tmp[k] !== x[k]) {
          tmp[k] = klona(x[k]);
        }
      }
    } else {
      tmp = {};
      for (k in x) {
        if (k === "__proto__") {
          Object.defineProperty(tmp, k, {
            value: klona(x[k]),
            configurable: true,
            enumerable: true,
            writable: true
          });
        } else {
          tmp[k] = klona(x[k]);
        }
      }
    }
    return tmp;
  }
  if (str === "[object Array]") {
    k = x.length;
    for (tmp = Array(k); k--; ) {
      tmp[k] = klona(x[k]);
    }
    return tmp;
  }
  if (str === "[object Set]") {
    tmp = new Set();
    x.forEach(function(val) {
      tmp.add(klona(val));
    });
    return tmp;
  }
  if (str === "[object Map]") {
    tmp = new Map();
    x.forEach(function(val, key) {
      tmp.set(klona(key), klona(val));
    });
    return tmp;
  }
  if (str === "[object Date]") {
    return new Date(+x);
  }
  if (str === "[object RegExp]") {
    tmp = new RegExp(x.source, x.flags);
    tmp.lastIndex = x.lastIndex;
    return tmp;
  }
  if (str.slice(-6) === "Array]") {
    return new x.constructor(x);
  }
  return x;
}
const valueFn = (val) => {
  var value = val;
  return (val2) => {
    if (val2 !== void 0) {
      value = val2;
    }
    return value;
  };
};
function loop(list, data, state, idx, isAsync) {
  var tmp, fn = list[idx++];
  if (!fn)
    return isAsync ? Promise.resolve(state) : state;
  try {
    tmp = fn(state, data);
  } catch (err) {
    if (isAsync)
      return Promise.reject(err);
    else
      throw err;
  }
  if (tmp == null)
    return loop(list, data, state, idx);
  if (typeof tmp.then == "function")
    return tmp.then((d) => loop(list, data, d, idx, true));
  if (typeof tmp == "object")
    state = tmp;
  return loop(list, data, state, idx);
}
function index(obj) {
  var $, tree = {}, hooks = {}, value = obj || {};
  var rem = (arr, func) => {
    arr.splice(arr.indexOf(func) >>> 0, 1);
  };
  return $ = {
    get state() {
      return klona(value);
    },
    on(evt, func) {
      tree[evt] = (tree[evt] || []).concat(func);
      return () => rem(tree[evt], func);
    },
    set(obj2, evt) {
      return loop((hooks["*"] || []).concat(evt && hooks[evt] || []), value, klona(value = obj2), 0);
    },
    listen(evt, func) {
      if (typeof evt == "function") {
        func = evt;
        evt = "*";
      }
      hooks[evt] = (hooks[evt] || []).concat(func);
      return () => rem(hooks[evt], func);
    },
    dispatch(evt, data) {
      var tmp = loop(tree[evt] || [], data, klona(value), 0);
      if (typeof tmp.then == "function")
        return tmp.then((x) => {
          if (x == null)
            throw "state did not returned!";
          return $.set(x, evt);
        });
      else
        return $.set(tmp, evt);
    }
  };
}
export { index as default, valueFn };
