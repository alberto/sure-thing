var PENDING = "PENDING";
var FULFILLED = "FULFILLED";
var REJECTED = "REJECTED";

function isFunction(x) {
  return typeof x === "function";
}

function asyncCall(fn, arg) {
  setTimeout(function() {
    fn(arg);
  },0);
}

function deferred() {
  var promise = createPromise();
  var fullfilled = [];
  var rejected = [];
  var state = PENDING;
  var value, reason;
  
  function createPromise() {
    var p = {
      then: function(onFullfilled, onRejected) {
        var d = deferred();
        
        if (state === FULFILLED) {
          asyncCall(function() {
            fullfill(onFullfilled, value, d);
          });
        }
        else {
          fullfilled.push(function(value) {
            fullfill(onFullfilled, value, d);
          });
        }
        
        if (state === REJECTED) {
          asyncCall(function() {
            reject(onRejected, reason, d);
          });
        }
        else {
          rejected.push(function(reason) {
            reject(onRejected, reason, d);
          });
        }
        return d.promise;
      }
    };

    return p;
  }

  function isObject(x) {
    return typeof x === "object";
  }
  
  function isPromiseType(x) {
    return x && (isObject(x) || isFunction(x));
  }

  function fullfill(onFullfilled, value, d) {
    try {
      if (!isFunction(onFullfilled)) {
        d.resolve(value);
      }
      var x = onFullfilled(value);
      resolution(d, x);
    } catch(e) {
      d.reject(e);
    }
  }
  
  function resolution(d, x) {
    if (d.promise === x) {
      throw new TypeError();
    }
    if (isPromiseType(x)) {
      var then = x.then;
      if (isFunction(then)) {
        then.call(x, function resolvePromise(y) {
          resolution(d, y);
        }, function rejectPromise(reason) {
          d.reject(reason);
        });          
      }
      else {
        d.resolve(x);
      }
    } else {
      d.resolve(x);        
    }
  }
  
  function reject(onRejected, reason, d) {
    try {
      if (!isFunction(onRejected)) {
        throw reason;
      }
      var x = onRejected(reason);
      resolution(d, x);
    } catch(e) {
      d.reject(e);
    }
  }
  
  function resolveAll(value) {
    var fn;
    while((fn = fullfilled.shift())) {
      fn(value);
    }
  }
  
  function rejectAll(reason) {
    var fn;
    while((fn = rejected.shift())) {
      fn(reason);
    }
  }
  
  return {
    promise: promise,
    resolve: function(v) {
      if (state !== PENDING) return promise;

      state = FULFILLED;
      value = v;
      asyncCall(resolveAll, value);
      return promise;
    },
    reject: function(r) {
      if (state !== PENDING) return promise;

      state = REJECTED;
      reason = r;
      asyncCall(rejectAll, reason);
      return promise;
    }
  };  
}
module.exports  = {
  deferred: deferred
};