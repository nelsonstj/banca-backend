function sortResultBySource(bob) {
  return function sort(source) {
    let innerBob = bob;

    if (source == 'cms') {
      innerBob.sort('updated_at', 'desc');
    }
    else {
      innerBob.sort('priorityDate');
      innerBob.sort('main_type');
    }

    return innerBob;
  }
}

function sortResultByAvailability(bob) {
  let innerBob = bob;
  return innerBob.sort('siscom_data.availabilityStart', 'desc');
}

exports.sortResultBySource = sortResultBySource;
exports.sortResultByAvailability = sortResultByAvailability;