// A toy monadic parser combinator library

// Basic monadic operations
    
const unit = function (a) {
    const m = function (s) { return {a:m.action(a), s:s}; };
    m.action = function(s) { return s; } // Default action do nothing
    return m;
}; 


const bind = function (m, f) {
    const mf = function (s) {
        let r = m(s);
        r = r && f(r.a)(r.s);
        return r && { a:mf.action(r.a), s:r.s }
    };
    mf.action = function(s) { return s; } // Default action do nothing
    return mf;
};


const fail = function (s) { return undefined; };  


const plus = function (m1, m2) {
    return function(s) { return m1(s) || m2(s); };
};


// Utilities

const foldr = function (f, u, array) {
    let r = u;
    for (let i = array.length - 1; i >= 0; i--) {
	r = f(array[i], r);
    }
    return r;
};


const aggregate = function (a1, a2) {
    return (a1 instanceof Array ? a1 : [a1]).concat(a2);
};


const silent = function (p) {
    return bind(p, function(a) { return unit([]); }); // Attach silent action
};


const toParser = function (p) {
    return typeof(p) === "string" ? silent(word(p)) : p;
};
    
// Parser combinators
    
const word = function (w) {
    const p = function (s) {
        s.match(/^[ \t\n]*/);
        s = RegExp.rightContext;
        if (s.slice(0,w.length) == w)
            return { a: w, s: s.slice(w.length) };
        return undefined;
    };
    return bind(p, unit); // Attach default action
};


const pattern = function (re) {
    const p = function (s) {
        if (s.match(new RegExp('^[ \t\n]*(' + re + ')'))) {
            return {a: RegExp.$1, s: RegExp.rightContext};
        }
        return undefined;
    };
    return bind(p,unit); // Attach default action	
};

const empty = unit([]);


const cat = function (p1, p2) {
    return bind(toParser(p1), function(a1) {
        return bind(toParser(p2), function(a2) {
            return unit(aggregate(a1, a2));
        });
    });
};


const seq = function (/* arguments */) {
    return foldr(cat, empty, arguments);
};
    

const or = function (p1, p2) {
    return plus(toParser(p1), toParser(p2));
};


const oneOf = function (/* arguments */) {
    return foldr(or, fail, arguments);
};


const not = function (p) { 
    const q = function(s) {
        return toParser(p)(s) ? fail(s) : empty(s);
    };
    return bind(q,unit); // Attach default action
};


const amp = function (p) { return not(not(p)); };


const optional = function (p) { return or(p, empty); };


const moreThan0 = function (p) {
    // Consume at least one character; fails otherwise
    const q = function(s) {
	const n = s.length;
	r = p(s);
	if (r && r.s.length < n) return r
	return undefined
    };
    // Use a thunk to avoid infinite recursive call
    const p_star = function (s) {
	return oneOf(seq(q, p_star), empty)(s);
    };
    return bind(p_star, unit); // Attach default action
};


const moreThan1 = function (p) {
    return cat(p, moreThan0(p));
};


const sepBy = function (p, sep) {
    return cat(p, moreThan0(cat(sep, p)));
};


exports.pattern = exports.pat = pattern
exports.word = exports.w = word
exports.fail = fail
exports.empty = empty
exports.seq = seq
exports.oneOf = oneOf
exports.optional = optional
exports.moreThan0 = moreThan0
exports.moreThan1 = moreThan1    
exports.sepBy = sepBy
exports.not = not
exports.amp = amp
