const _ = require('lodash');

function queryProductType(bob) {
  return function query(productRange, productType, associatedTo) {
    let isProject = false;
    let innerBob = bob;

    // filter searches based on project "type" from now on
    if (_.indexOf(productType, "project") !== -1) {
      isProject = true;
    }

    let queryIndexes = [];
    let components = [];

    if (isProject) {
      if (productRange.length === 1) {
        components.push({ 'match': { 'main_type': productRange[0] } });
      }
      else {
        productRange.forEach((value) => {
          components.push({ "match": { "main_type": value } });
        });
      }

      queryIndexes.push({ "type": { "value": "projects" } });
    }

    if (_.indexOf(productType, "sponsorship") !== -1 ||
      (!!associatedTo && associatedTo.toLowerCase() === "programa")) {
        
        let sponsorshipRanges = [];
        _.forEach(productRange, range => {
          switch (range) {
            case "national":
              sponsorshipRanges.push("national_sponsorship");
              break;
            case "local":
              sponsorshipRanges.push("net_sponsorship");
              sponsorshipRanges.push("local_sponsorship");
              break;
            default:
              break;
          }
        });

      if (sponsorshipRanges.length === 1) {
        components.push({ 'match': { 'main_type': sponsorshipRanges[0] } });
      }
      else {
        sponsorshipRanges.forEach((value) => {
          components.push({ "match": { "main_type": value } });
        });
      }

      queryIndexes.push({ "type": { "value": "net_sponsorships" } });
      queryIndexes.push({ "type": { "value": "sponsorships" } });
      queryIndexes.push({ "type": { "value": "local_sponsorships" } });
    }

    if (!!associatedTo) {
      innerBob.query("bool", "should", [{
        'match': { 'local.associated_to': associatedTo }
      }, {
        "type":
          { "value": "net_sponsorships" }
      }, {
        "type": { "value": "sponsorships" }
      }, {
        "type": { "value": "local_sponsorships" },
      }]);

      queryIndexes.push({ "type": { "value": "net_sponsorships" } });
      queryIndexes.push({ "type": { "value": "sponsorships" } });
      queryIndexes.push({ "type": { "value": "local_sponsorships" } });
    }

    if (components.length > 0) {
      innerBob.query("bool", "should", components);
    }

    if (queryIndexes.length > 0) {
      innerBob.filter("bool", "should", queryIndexes);
    }

    return innerBob;
  }
}

exports.queryProductType = queryProductType;