export default function immup(source) {
  return new Immup(source);
}

Object.assign(immup, {
  set(source, keys, value) {
    if (!keys) {
      return typeof value === 'function' ? value(source) : source;
    }

    return dig(source, keys, (o, key) => {
      if (!Array.isArray(o) && !isPlainObject(o) || !(key in o)) {
        throw new Error(`${keys} is not a object or array`);
      }

      return map(o, (v, k) => {
        if (key === k) {
          return typeof value === 'function' ? value(v) : value;
        }
        else {
          return v;
        }
      });
    });
  },

  del(source, keys) {
    return dig(source, keys, (o, key) => {
      if (!Array.isArray(o) && !isPlainObject(o)) {
        throw new Error(`${keys} is not a object or array`);
      }

      return filter(o, (v, k) => key !== k);
    });
  },

  merge(source, keys, value) {
    if (arguments.length === 2) {
      value = keys;
      keys = null;
    }

    return immup.set(source, keys, obj => {
      if (!isPlainObject(obj)) {
        throw new Error(`${keys} is not a object`);
      }

      return deepMerge(obj, value);
    });
  },

  mergeList(source, keys, value, comparator) {
    return immup.set(source, keys, arr => {
      if (!Array.isArray(arr)) {
        throw new Error(`${keys} is not a array`);
      }

      return value.map(v => {
        let target = arr.filter(v2 => comparator(v, v2))[0];
        if (target === undefined) {
          return v;
        }
        else {
          return deepMerge(target, v);
        }
      });
    });
  },

  append(source, keys, ...value) {
    return immup.set(source, keys, arr => {
      if (!Array.isArray(arr)) {
        throw new Error(`${keys} is not a array`);
      }

      return arr.concat(value);
    });
  },

  prepend(source, keys, ...value) {
    return immup.set(source, keys, arr => {
      if (!Array.isArray(arr)) {
        throw new Error(`${keys} is not a array`);
      }

      return value.concat(arr);
    });
  },
});

export class Immup {
  constructor(source) {
    this.source = source;
  }

  end() {
    return this.source;
  }
}

for (let method in immup) {
  Immup.prototype[method] = function(...args) {
    this.source = immup[method](this.source, ...args);
    return this;
  };
}

// private functions
function parseKeys(keys) {
  if (Array.isArray(keys)) {
    return keys.slice();
  }
  else if (typeof keys === 'string') {
    return keys.split('.');
  }
  else {
    throw new Error(`Invalid keys type: ${keys}`);
  }
}

function isPlainObject(obj) {
  return obj instanceof Object && Object.getPrototypeOf(obj) === Object.prototype;
}

function dig(obj, keys, callback) {
  keys = parseKeys(keys);

  let walk = (o) => {
    let clone;
    let key = keys.shift();

    if (keys.length === 0) {
      return callback(o, Array.isArray(o) ? Number(key) : key);
    }

    if (Array.isArray(o)) {
      clone = o.slice();
    }
    else if (isPlainObject(o)) {
      clone = Object.assign({}, o);
    }
    else {
      throw new Error(`${keys} is not a object or array`);
    }

    clone[key] = walk(o[key]);

    return clone;
  };

  return walk(obj);
}

function map(obj, callback) {
  if (Array.isArray(obj)) {
    return obj.map(callback);
  }
  else {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = callback(obj[key], key);
      return acc;
    }, {});
  }
}

function filter(obj, callback) {
  if (Array.isArray(obj)) {
    return obj.filter(callback);
  }
  else {
    return Object.keys(obj).reduce((acc, key) => {
      if (callback(obj[key], key)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }
}

function deepMerge(target, source) {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return target;
  }

  return Object.keys(source).reduce((acc, key) => {
    let value;
    if (!isPlainObject(source[key])) {
      value = source[key];
    }
    else if (key in acc) {
      value = deepMerge(acc[key], source[key]);
    }
    else {
      value = Object.assign({}, source[key]);
    }
    return Object.assign({}, acc, { [key]: value });
  }, target);
}
