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
  
  function isPromise(x) {
    return (x && (isObject(x) || isFunction(x)) &&
      x.then && isFunction(x.then));
  }

  function fullfill(fn, x, d) {
    try {
      var fullfilledValue = isFunction(fn) ? fn(x) : x;
      if (isPromise(fullfilledValue)) {
        fullfilledValue.then(function(x) {
          d.resolve(x);
        }, function(reason) {
          d.reject(reason);
        });
      } else {
        d.resolve(fullfilledValue);        
      }
    } catch(e) {
      d.reject(e);
    }
  }
  
  function reject(fn, reason, d) {
    try {
      if (isFunction(fn)) {
        var rejectedValue = fn(reason);
        if (isPromise(rejectedValue)) {
          rejectedValue.then(function(value) {
            d.resolve(value);
          }, function(reason) {
            d.reject(reason);
          });
        } else {
          d.resolve(rejectedValue);
        }
      } else {
        throw reason;
      }
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