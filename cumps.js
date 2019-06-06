// A toy monadic parser combinator library


// Basic monadic operations


const unit = function (a) {
    const m = s => ({a:m.action(a), s:s})
    m.action = s => s; // Default action does nothing
    return m;
}; 


const bind = function (m, f) {
    const mf = s => {
        let r = m(s);
        r = r && f(r.a)(r.s);
        return r && { a:mf.action(r.a), s:r.s }
    };
    mf.action = s => s; // Default action does nothing
    return mf;
};


const fail = _ => undefined;  


const plus = (m1, m2) => (s => m1(s) || m2(s));


// Utilities


const newParser = raw_func => bind(raw_func,unit); // Attach default action


const silent = p => bind(p, _ => unit([])) // Attach silent action


const toParser = p => typeof(p) === "string" ? silent(word(p)) : p;

    
// Parser combinators


const word = w => 
    newParser(function (s) {
        const n = s.match(/^\s*/)[0].length;
        s = s.slice(n)
        if (s.slice(0,w.length) === w) {
            return {a:w, s:s.slice(w.length)};
	}    
        return undefined;
    });	



const pattern = re =>
    newParser(function (s) {
        const n = s.match(/^\s*/)[0].length;
        s = s.slice(n)
        const r = s.match(new RegExp('^' + re))
            if (r) {
	        const w = r[0]
	    return {a:w, s:s.slice(w.length)};
	}
        return undefined;
    });


const empty = unit([]);


const cat = (p1, p2) =>
    bind(toParser(p1), a1 => 
    bind(toParser(p2), a2 => 
    unit((a1 instanceof Array ? a1 : [a1]).concat(a2))));


const seq = (...args) => args.reduce(cat,empty);


const or = (p1, p2) => plus(toParser(p1), toParser(p2));


const oneOf = (...args) => args.reduce(or,fail);


const not = p => newParser(s => toParser(p)(s) ? fail(s) : empty(s))


const amp = p => not(not(p));


const optional = p => or(p, empty);


const moreThan0 = p => {
    // Consume at least one character; fails otherwise
    const q = function (s) {
	    const n = s.length;
	    r = p(s);
	    if (r && r.s.length < n) return r
	    return undefined
    };
    // Need a thunk to avoid infinite recursive call
    const p_star = s => oneOf(seq(q, p_star), empty)(s);
    return newParser(p_star);
};


const moreThan1 = p => cat(p, moreThan0(p));


const sepBy = (p, sep) => cat(p, moreThan0(cat(sep, p)));


exports.pattern = exports.pat = pattern;
exports.word = exports.w = word;
exports.fail = fail;
exports.empty = empty;
exports.seq = seq;
exports.oneOf = oneOf;
exports.optional = exports.opt = optional;
exports.moreThan0 = moreThan0;
exports.moreThan1 = moreThan1;   
exports.sepBy = sepBy;
exports.not = not;
exports.amp = amp;
exports.newParser = newParser;
exports.silent = silent;
