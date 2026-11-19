// Tikání pro plánovač. Worker prohlížeč na pozadí tolik nebrzdí jako setInterval na stránce.

let id = null;

self.onmessage = (e) => {
  if (e.data === 'start') {
    clearInterval(id);
    id = setInterval(() => self.postMessage('tick'), 25);
  } else if (e.data === 'stop') {
    clearInterval(id);
    id = null;
  }
};
