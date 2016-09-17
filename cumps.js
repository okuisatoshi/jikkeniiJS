//
// A simple monadic parser combinators written in JavaScript
//

var exports; // For CommonJS module specs

(function() { // Create local scope ...
    
    // Basic monadic operators
    
    var ret = function (a) {
        return function (s) { return {a:a, s:s}; };
    }; 

    var bind = function (m, f) {
        return function (s) {
            var r = m(s);
            return r && f(r.a)(r.s);
        };
    };

    var zero = function (s) { return undefined; };  

    var plus = function (m1, m2) {
        return function(s) { return m1(s) || m2(s); };
    };

    // Utilities

    var foldr = function (f, u, array) {
        var r = u;
        for (var i = array.length - 1; i >= 0; i--) {
	    r = f(array[i], r);
        }
        return r;
    };
    
    var aggregate = function (a1, a2) {
        return (a1 instanceof Array ? a1 : [a1]).concat(a2);
    };

    var withAction = function (p, action) {
        var q = bind(p, function(a) { return ret(q.action(a)); });
        q.action = action || function(a) { return a; };
        return q;        
    };

    var word = function (w) {
        return withAction(function (s) {
            s.match(/^[ \t\n]*/);
            s = RegExp.rightContext;
            if (s.slice(0,w.length) == w)
                return { a: w, s: s.slice(w.length) };
            return undefined;
        });
    };

    var silent = function (p) {
        return withAction(p, function(a) { return []; }); 
    };

    var toParser = function (p) {
        return typeof(p) === "string" ? silent(word(p)) : p;
    };

    var pattern = function (re) {
        return withAction(function (s) {
            if (s.match(new RegExp('^[ \t\n]*(' + re + ')'))) {
                return {a: RegExp.$1, s: RegExp.rightContext};
            }
            return undefined;
        });
    };

    // Basic Parser Combinators

    var empty = withAction(ret([]));

    var fail = withAction(zero);

    var cat = function (p1, p2) {
        p1 = toParser(p1); p2 = toParser(p2);
        return withAction(
            bind(p1,
    	         function(a1) {
		     return bind(p2, 
                                 function(a2) {
				     return ret(aggregate(a1, a2));
                                 });
                 }));
    };

    var or = function (p1, p2) {
        p1 = toParser(p1); p2 = toParser(p2);    
        return withAction(plus(p1, p2));
    };

    // Derived parser combinators
    
    var not = function (p) { 
        p = toParser(p);
        // Look-ahead predicate: 
        return withAction(function(s) {
            return p(s) ? fail(s) : empty(s);
        });
    };

    var amp = function (p) { return not(not(p)); };
    
    var req = function (p) {
        p = toParser(p);
        return withAction(function(s) {
            var r = p(s);
            if (! r) throw new Error("Syntax error:" + s);
            return r;
        });
    };
    
    var seq = function (/* arguments */) {
        return foldr(cat, empty, arguments);
    };

    var oneOf = function (/* arguments */) {
        return foldr(or, fail, arguments);
    };

    var optional = function (p) { return or(p, empty); };

    var moreThan0 = function (p) {
        // Note: This enclosing function is mandatory to avoid eager evaluation 
        function q(s) {
            return or(seq(amp(pattern(".")), p, q), empty)(s);
        }
        return withAction(q);
    };
                       
    var moreThan1 = function (p) {
        return cat(p, moreThan0(p));
    };
    
    var sepBy = function (p, sep) {
        return cat(p, moreThan0(cat(sep, p)));
    };

    // Expose public functions

    exports.word = this.word = exports.w = this.w = word;
    exports.pattern = this.pattern = exports.pat = this.pat = pattern;
    exports.empty = this.empty = empty;
    exports.not = this.not = not;
    exports.amp = this.amp = amp;
    exports.req = this.req = req;
    exports.seq = this.seq = seq;
    exports.oneOf = this.oneOf = oneOf;
    exports.optional = this.optional = exports.opt = this.opt = optional;
    exports.moreThan0 = this.moreThan0 = moreThan0;
    exports.moreThan1 = this.moreThan1 = moreThan1;
    exports.sepBy =  this.sepBy = sepBy;
    
})(); // End of local scope 


