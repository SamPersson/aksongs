interface KnockoutUtils {
  canSetPrototype;
  setPrototypeOfOrExtend;
}

ko.utils.canSetPrototype = false;
ko.utils.setPrototypeOfOrExtend = ko.utils.extend;

declare function ga(field: string, ...parameters: any[]): void;

function slug(s: string) {
  return s.toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

function request(
  method: string,
  url: string,
  data: any,
  onSuccess: (data: string) => void,
  onError: (error: any) => void = undefined) {
  var r = new XMLHttpRequest();
  r.open(method, url, true);

  var password = localStorage.getItem("password");
  if (password) {
    r.setRequestHeader("Authorization", "SECRET " + password);
  }
  r.setRequestHeader("Accept", "application/json");
  r.setRequestHeader("Content-Type", "application/json");

  r.onload = () => {
    if (r.status >= 200 && r.status < 400) {
      onSuccess(r.responseText);
    } else if (onError) {
      onError(r);
    }
  }

  if (onError) {
    r.onerror = () => {
      onError(r);
    }
  }

  if (data !== undefined && data !== null) {
    r.send(JSON.stringify(data));
  } else {
    r.send();
  }

  return r;
}

function formatDate(d: Date) {
  var curr_year = d.getFullYear();
  var curr_month = (d.getMonth() + 1).toString(); //Months are zero based
  if (curr_month.length < 2) curr_month = "0" + curr_month;
  var curr_date = d.getDate().toString();
  if (curr_date.length < 2) curr_date = "0" + curr_date;
  var curr_hour = d.getHours().toString();
  if (curr_hour.length < 2) curr_hour = "0" + curr_hour;
  var curr_min = d.getMinutes().toString();
  if (curr_min.length < 2) curr_min = "0" + curr_min;
  var curr_sec = d.getSeconds().toString();
  if (curr_sec.length < 2) curr_sec = "0" + curr_sec;

  return curr_year + "-" + curr_month + "-" + curr_date + " " + curr_hour + ":" + curr_min + ":" + curr_sec;
}

interface KnockoutSubscribable<T> extends KnockoutSubscribableFunctions<T> {
  limit(c: Function);
}

interface MSStyleCSSProperties {
  webkitFilter;
  webkitTransform;
}

function startsWith(s: string, searchString: string) {
  return s.lastIndexOf(searchString, 0) === 0;
}

function getLocation(href: string) {
  var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
    protocol: match[1],
    host: match[2],
    hostname: match[3],
    port: match[4],
    pathname: match[5],
    search: match[6],
    hash: match[7]
  }
}

interface JQueryStatic {
  connection;
}
