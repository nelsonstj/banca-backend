function queryCurrentOwnership(bob) {
  return function query(published, group) {
    let innerBob = bob;
    let ownership = [];

    if (!!group) {
      ownership = [{
        "match": { "owner": group }
      }, {
        "match": { "holder": group }
      }];
    }

    if (!!published) {
      ownership.push({
        "match": { "published": published }
      });
    }

    if (ownership.length > 0) {
      innerBob.filter("bool", "should", ownership);
    }

    return innerBob;
  }
}

exports.queryCurrentOwnership = queryCurrentOwnership;