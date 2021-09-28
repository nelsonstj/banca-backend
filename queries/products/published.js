function queryPublishedStatus(bob) {
  return function query(published) {
    let innerBob = bob;
    innerBob.query("bool", "must", { "match": { "published": published } });
    return innerBob;
  }
}

exports.queryPublishedStatus = queryPublishedStatus;