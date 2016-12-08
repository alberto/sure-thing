module.exports = defer;

function defer() {
  var PENDING = "PENDING",
    FULFILLED = "FULFILLED",
    REJECTED = "REJECTED",
    state = PENDING,
    handlers = { "FULFILLED": [], "REJECTED": []},
    value;

  var deferred = {
    promise: {
      then: function(onFulfilled, onRejected) {
        var deferred = defer();
        registerHandler(deferred, FULFILLED, onFulfilled);
        registerHandler(deferred, REJECTED, onRejected);
        return deferred.promise;
      },
    },
    resolve: settleState(FULFILLED),
    reject: settleState(REJECTED)
  };
  return deferred;

  function registerHandler(deferred, targetState, handler) {
    handlers[targetState].push(resolveHandler.bind(null, deferred, handler));

    if (state === targetState) {
      consumeHandlers(targetState);
    }
  }

  function resolveHandler(deferred, handler) {
    try {
      if (isFunction(handler)) {
        return resolutionProcedure(deferred, handler(value));
      }
      state === FULFILLED ? deferred.resolve(value) : deferred.reject(value);
    } catch(e) {
      deferred.reject(e);
    }
  }

  function resolutionProcedure(deferred, x) {
    var called = false;
    try {
      if (deferred.promise === x) {
        throw new TypeError("Promise cannot be resolved with itself");
      }
      if (x && (typeof x === "object" || isFunction(x))) {
        var then = x.then;
        if (isFunction(then)) {
          return then.call(x, function resolvePromise(y) {
            if (called) return;
            called = true;
            resolutionProcedure(deferred, y);
          }, function rejectPromise(reason) {
            if (called) return;
            called = true;
            deferred.reject(reason);
          });
        }
      }
      deferred.resolve(x);
    }
    catch(e) {
      if (called) return;
      deferred.reject(e);
    }
  }

  function settleState(targetState) {
    return function (v) {
      if (state !== PENDING) return deferred.promise;
      state = targetState;
      value = v;
      consumeHandlers(state);
      return deferred.promise;
    };
  }

  function consumeHandlers(state) {
    var fn, stateHandlers = handlers[state];
    setTimeout(function() {
      while((fn = stateHandlers.shift())) {
        fn.apply(value);
      }
    }, 0);
  }
}

function isFunction(x) {
  return typeof x === "function";
}
