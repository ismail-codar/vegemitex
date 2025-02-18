import klona from "klona";

export const valueFn = (val) => {
	var value = val;
	return (val) => {
		if (val !== undefined) {
			value = val;
		}
		return value;
	};
};

function loop(list, data, state, idx, isAsync) {
	var tmp,
		fn = list[idx++];
	if (!fn) return isAsync ? Promise.resolve(state) : state;

	try {
		tmp = fn(state, data);
	} catch (err) {
		if (isAsync) return Promise.reject(err);
		else throw err;
	}
	if (tmp == null) return loop(list, data, state, idx);
	if (typeof tmp.then == "function")
		return tmp.then((d) => loop(list, data, d, idx, true));

	if (typeof tmp == "object") state = tmp;
	return loop(list, data, state, idx);
}

export default function (obj) {
	var $,
		tree = {},
		hooks = {},
		value = obj || {};

	var rem = (arr, func) => {
		arr.splice(arr.indexOf(func) >>> 0, 1);
	};

	return ($ = {
		get state() {
			return klona(value);
		},

		on(evt, func) {
			tree[evt] = (tree[evt] || []).concat(func);
			return () => rem(tree[evt], func);
		},

		set(obj, evt) {
			return loop(
				(hooks["*"] || []).concat((evt && hooks[evt]) || []),
				value,
				klona((value = obj)),
				0
			);
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
					if (x == null) throw "state did not returned!";
					return $.set(x, evt);
				});
			else return $.set(tmp, evt);
		},
	});
}
