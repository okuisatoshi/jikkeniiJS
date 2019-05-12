// A toy monadic parser combinator library

// Basic monadic operations
    
const unit = function (a) {
    const m = function (s) { return {a:m.action(a), s:s}; };
    m.action = function(s) { return s; } // Default action does nothing
    return m;
}; 


const bind = function (m, f) {
    const mf = function (s) {
        let r = m(s);
        r = r && f(r.a)(r.s);
        return r && { a:mf.action(r.a), s:r.s }
    };
    mf.action = function(s) { return s; } // Default action does nothing
    return mf;
};


const fail = function (s) { return undefined; };  


const plus = function (m1, m2) {
    return function(s) { return m1(s) || m2(s); };
};


// Utilities

const silent = function (p) {
    return bind(p, function(a) { return unit([]); }); // Attach silent action
};


const toParser = function (p) {
    return typeof(p) === "string" ? silent(word(p)) : p;
};
    
// Parser combinators
    
const word = function (w) {
    const p = function (s) {
        const n = s.match(/^\s*/)[0].length;
        s = s.slice(n)
        if (s.slice(0,w.length) === w) {
            return {a:w, s:s.slice(w.length)};
	}    
        return undefined;
    };
    return bind(p, unit); // Attach default action
};

const pattern = function (re) {
    const p = function (s) {
        const n = s.match(/^\s*/)[0].length;
        s = s.slice(n)
        const r = s.match(new RegExp('^' + re))
        if (r) {
	    const w = r[0]
	    return {a:w, s:s.slice(w.length)};
	}
        return undefined;
    };
    return bind(p,unit); // Attach default action	
};

const empty = unit([]);

    return (a1 instanceof Array ? a1 : [a1]).concat(a2);
const cat = function (p1, p2) {
    return bind(toParser(p1), function(a1) {
        return bind(toParser(p2), function(a2) {
            return unit((a1 instanceof Array ? a1 : [a1]).concat(a2));
        });
    });
};


const seq = function (/* arguments */) {
    return Array.from(arguments).reduce(cat,empty);
};
    

const or = function (p1, p2) {
    return plus(toParser(p1), toParser(p2));
};


const oneOf = function (/* arguments */) {
    return Array.from(arguments).reduce(or,fail);
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
    // Need a thunk to avoid infinite recursive call
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
