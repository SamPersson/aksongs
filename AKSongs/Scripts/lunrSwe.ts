
declare var lunr: any;

module LunrSwe {
  var step1alist = "a arna erna heterna orna ad e ade ande arne are aste en anden aren heten ern ar er heter or as arnas ernas ornas es ades andes ens arens hetens erns at andet het ast".split(" ");
  step1alist = _.sortBy(step1alist, w => -w.length);

  var step1sending = "bcdfghjklmnoprtvy".split("");

  var step2list = ["dd", "gd", "nn", "dt", "gt", "kt", "tt"];

  var r1re = /[aouåeiyäö][^aouåeiyäö](.*)$/;

  var step3a = ["fullt", "löst"];
  var step3b = ["lig", "ig", "els"];

  function endsWith(w, su) {
    return w.indexOf(su, w.length - su.length) !== -1;
  }

  function trimEnd(w, n) {
    return w.substring(0, w.length - n);
  }

  /**
   * swedish stemmer based on http://snowball.tartarus.org/algorithms/swedish/stemmer.html
   *
   * @module
   * @param {String} str The string to stem
   * @returns {String}
   * @see lunr.Pipeline
   */
  function stemmer(w:string) {
    var m = w.match(r1re);
    var r1 = "";
    if (m) {
      r1 = m[1];
      if (w.length - r1.length < 3) {
        r1 = w.substring(3);
      }
    }

    if (r1.length === 0) {
      return w;
    }

    var prefix = trimEnd(w, r1.length);

    // Step 1
    var suffix = _.find(step1alist, su => endsWith(r1, su));
    if (suffix) {
      r1 = trimEnd(r1, suffix.length);
    } else if (endsWith(r1, "s") && _.any(step1sending, su => endsWith(w, su + "s"))) {
      r1 = trimEnd(r1, 1);
    }

    // Step 2
    if (_.any(step2list, su => endsWith(r1, su))) {
      r1 = trimEnd(r1, 1);
    }

    // Step 3
    if (_.any(step3a, su => endsWith(r1, su))) {
      r1 = trimEnd(r1, 1);
    } else {
      suffix = _.find(step3b, su => endsWith(r1, su));
      if (suffix) {
        r1 = trimEnd(r1, suffix.length);
      }
    }

    return prefix + r1;
  }

  var stopWords = new lunr.SortedSet();
  stopWords.elements = ["", "alla", "allt", "att", "av", "blev", "bli", "blir", "blivit", "de", "dem", "den", "denna", "deras", "dess", "dessa", "det", "detta", "dig", "din", "dina", "ditt", "du", "då", "där", "efter", "ej", "eller", "en", "er", "era", "ert", "ett", "från", "för", "ha", "hade", "han", "hans", "har", "henne", "hennes", "hon", "honom", "hur", "här", "i", "icke", "ingen", "inom", "inte", "jag", "ju", "kan", "kunde", "man", "med", "mellan", "men", "mig", "min", "mina", "mitt", "mot", "mycket", "ni", "nu", "någon", "något", "några", "när", "och", "om", "oss", "på", "samma", "sedan", "sig", "sin", "sina", "sitta", "själv", "skulle", "som", "så", "sådan", "sådana", "sådant", "till", "under", "upp", "ut", "utan", "vad", "var", "vara", "varför", "varit", "varje", "vars", "vart", "vem", "vi", "vid", "vilka", "vilkas", "vilken", "vilket", "vår", "våra", "vårt", "åt", "än", "är", "över"];
  stopWords.length = lunr.stopWordFilter.stopWords.elements.length; 

  function stopWordFilter(token:string) {
    if (stopWords.indexOf(token) === -1) return token;
    return undefined;
  }

  lunr.Pipeline.registerFunction(stemmer, "stemmerSwe");
  lunr.Pipeline.registerFunction(stopWordFilter, "stopWordFilterSwe");

  export function create(config: (idx:any) => void) {
    var idx = new lunr.Index();

    idx.pipeline.add(
      lunr.trimmer,
      stopWordFilter,
      stemmer
    );

    if (config) config.call(idx, idx);

    return idx;
  }
}




