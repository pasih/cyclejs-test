
export function extractSubstreams(stream, childStreams) {
  return childStreams.reduce((obj, current) => {
    obj[current] = stream.flatMapLatest(s => s[current]);
    return obj;
  }, {});
}
