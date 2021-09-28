const _ = require('lodash');
const AWS = require('aws-sdk');
const bodybuilder = require('bodybuilder');
const moment = require('moment');

AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.Credentials(
    '???',
    '???'
  )
});

const hostName = process.env.HOSTNAME;
const UNAVAILABLE_STATUS = 2;
const BANCA_INDEX = 'banca';

const _client = require('elasticsearch').Client({
  hosts: [hostName],
  connectionClass: require('http-aws-es'),
  log: 'error',
  requestTimeout: 90000
});

function queryLocalSponsorships(client) {
  const promise = new Promise((resolve, reject) => {
    const sponsorshipResolutions = [];

    console.log('Consultando patrocínios registrados no ES', hostName);

    return client.search(
      {
        index: 'banca',
        type: 'local_sponsorships',
        scroll: '3m',
        size: 100
      },
      function getMoreUntilDone(error, response) {
        if (error) {
          reject(error);
          return;
        }
        response.hits.hits.forEach((hit) => {
          sponsorshipResolutions.push(_.assign(hit._source, { id: hit._id }));
        });

        if (response.hits.total > sponsorshipResolutions.length) {
          client.scroll(
            {
              scrollId: response._scroll_id,
              scroll: '3m'
            },
              getMoreUntilDone
            );
        } else {
          console.log('Consulta de patrocínios locais finalizada');
          resolve(sponsorshipResolutions);
        }
      }
    );
  });

  return promise;
}

exports.handler = (context, event, callback) =>
  queryLocalSponsorships(_client).then((data) => {
    const promises = [];

    data.forEach((element) => {
      promises.push(
        getSiscomData(element)
          .then((siscomData) => {
            updateSponsorshipData(element, siscomData[0]);
          })
          .then(() => console.log('Updated element:', element.id))
          .catch((err) => {
            const errorMessage = `Something went wrong for element ${element.id}: ${err}`;
            callback(errorMessage);
          })
      );
    });

    return Promise.all(promises)
      .then(() => callback(null, 'done'))
      .catch(err => callback(err));
  });

function getSiscomData(element) {
  return getSiscomPlans(element.local_sponsorship.program_initials, 'L');
}

function updateSponsorshipData(localSponsorship, siscomData) {
  const updateData = {
    index: BANCA_INDEX,
    type: 'local_sponsorships',
    id: localSponsorship.id,
    body: {
      doc: {},
      doc_as_upsert: true
    }
  };

  if (siscomData) {
    updateData.body.doc.siscom_data = fixSiscomQuotaData(siscomData);
    updateData.body.doc.priorityDate = calculateEarliestPriorityDate(siscomData);
    updateData.body.doc.availability = siscomData.availability;
  } else {
    updateData.body.doc.availability = UNAVAILABLE_STATUS;
  }

  return new Promise((resolve, reject) => {
    _client.update(updateData, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

let getSiscomPlans = (initials, marketType) => {
  const bob = bodybuilder();

  bob.sort('purchaseLimitEnd', 'desc');
  bob.query('match', 'programInitials', initials);

  if (marketType !== null && typeof marketType !== 'undefined') {
    bob.andQuery('match', 'marketType', marketType);
  }

  return _client
    .search({
      index: 'siscom_plans',
      type: 'siscom_plan',
      body: bob
        .from(0)
        .size(40)
        .build()
    })
    .then(result =>
      result.hits.hits.map((value) => {
        const quotaQuantity = _.keys(_.groupBy(value._source.quotas, f => f.number)).length;
        return _.assign(value._source, { quotaQuantity });
      })
    );
};

let calculateEarliestPriorityDate = (siscomData) => {
  // Se o siscom_data não estiver disponível, não podemos fazer nada.
  if (siscomData === null) {
    return null;
  }

  // A regra é que se houver prazo de renovação, temos que usar o mais novo. Se não houver a informação, usar a data de exibição final
  if (!!siscomData && siscomData.quotas.length > 0) {
    const quotasRenewLimit = _.map(siscomData.quotas, (c) => {
      let renewLimit = null;
      let exhibitionEnd = null;

      if (c.renewLimit) {
        renewLimit = new Date(c.renewLimit).getTime();
      }
      if (c.exhibitionEnd) {
        exhibitionEnd = new Date(c.exhibitionEnd).getTime();
      }

      if (renewLimit === null && exhibitionEnd !== null) {
        return exhibitionEnd;
      } else if (renewLimit !== null && exhibitionEnd === null) {
        return renewLimit;
      }

      if (renewLimit > exhibitionEnd) {
        return exhibitionEnd;
      } else if (renewLimit < exhibitionEnd) {
        return renewLimit;
      } else if (renewLimit === exhibitionEnd) {
        return renewLimit;
      }
      return null;
    });

    const renewLimits = _.compact(
      _.orderBy(
        quotasRenewLimit,
        element => element,
        'asc'
      )
    );

    // If first value is null, everyone is null!
    if (renewLimits[0] === null) {
      return null;
    }

    if (renewLimits.length === 1) {
      return moment.utc(renewLimits[0]).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    }

    const today = new Date().getTime();

    for (let index = 0; index < renewLimits.length; index++) {
      const element = renewLimits[index];

      if (element >= today) {
        return moment.utc(element).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      }
      if (element === null) {
        return moment.utc(renewLimits[index - 1]).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      }
    }

    const result = moment.utc(renewLimits[renewLimits.length - 1]).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    return result === 'Invalid date' ? null : result;
  }
};

let fixSiscomQuotaData = (quotaData) => {
  const finalData = {};
  finalData.quotas = [];

  const availableQuotas = [];
  const quotaSource = quotaData;

  // Agrupamento de cotas por exibidora para contagem de acordo com o número
  const quotaQuantity = _.uniq(
    _.map(quotaSource.quotas, m => m.number)
  ).length;

  quotaSource.quotas = quotaSource.quotas.filter(value => !_isExcludedExhibitor(value.exhibitedAt));

  finalData.quotas = _dataTransformation(quotaSource, availableQuotas);
  finalData.quotas = _.orderBy(
    finalData.quotas,
    ['availableQuota.length', 'location'],
    ['desc', 'asc']
  );

  finalData.marketType = quotaSource.marketType;
  finalData.updatedAt = moment(quotaSource.updatedAt)
    .utcOffset(0, true)
    .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  finalData.purchaseLimitStart = moment(quotaSource.purchaseLimitStart)
    .utcOffset(0, true)
    .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  finalData.purchaseLimitEnd = moment(quotaSource.purchaseLimitEnd)
    .utcOffset(0, true)
    .format('YYYY-MM-DDTHH:mm:ss.SSSZ');

  finalData.availabilityStart = moment(quotaSource.availabilityStart)
    .utcOffset(0, true)
    .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  finalData.availabilityEnd = moment(quotaSource.availabilityEnd)
    .utcOffset(0, true)
    .format('YYYY-MM-DDTHH:mm:ss.SSSZ');

  finalData.queueCode = quotaSource.queueCode;
  finalData.purchaseStatus = quotaSource.purchaseStatus;
  finalData.status = quotaSource.status;
  finalData.availableExhibitors = quotaSource.availableExhibitors;
  finalData.queueExhibitors = quotaSource.queueExhibitors;
  finalData.unavailableExhibitors = quotaSource.unavailableExhibitors;
  finalData.isAvailable = quotaSource.isAvailable === 0;

  const availableQuotaCount = availableQuotas.reduce((p, c) => c === true ? p + 1 : p, 0);

  _.assign(
    finalData,
    { availableQuotas: availableQuotaCount },
    { soldQuotas: quotaQuantity - availableQuotaCount }
  );

  return finalData;
};

let _isExcludedExhibitor = exhibitor => ['sup', 'val', 'aca'].indexOf(exhibitor.toLowerCase()) !== -1;

let _dataTransformation = (quotaSource, availableQuotas) => _.map(_.groupBy(quotaSource.quotas, g => g.exhibitedAt), (quotas) => {
  const locationData = {};

  locationData.availableQuota = [];
  locationData.soldQuota = [];

  _.map(_.groupBy(quotas, q => q.number), (quotaNumberArray) => {
      // Consideração somente da última cota, tendo em vista que os outros valores são de patrocinadores anteriores
    const quotaInformation = _.orderBy(quotaNumberArray, 'exhibitionEnd', 'asc');
    const lastQuota = _.takeRight(quotaInformation)[0];
    locationData.location = lastQuota.exhibitedAt;

    let renewLimit = null;
    let exhibitionStart = null;
    let exhibitionEnd = null;

    if (lastQuota.exhibitionStart !== null) {
      exhibitionStart = moment(lastQuota.exhibitionStart)
          .utcOffset(0, true)
          .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    }

    if (lastQuota.exhibitionEnd !== null) {
      exhibitionEnd = moment(lastQuota.exhibitionEnd)
          .utcOffset(0, true)
          .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    }

    if (lastQuota.renewLimit !== null) {
      renewLimit = moment(lastQuota.renewLimit)
          .utcOffset(0, true)
          .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    }

    if (_isQuotaSold(lastQuota.clientName)) {
        // Eventualmente teremos os clientes que estão na fila (queuedClients)
      locationData.soldQuota.push({
        clientName: lastQuota.clientName,
        number: lastQuota.number,
        renewLimit,
        exhibitionStart,
        exhibitionEnd,
        availability: lastQuota.availability === 0,
        queuedClients: [],
        queue: lastQuota.queue
      });

        // Precisamos verificar se há disponibilidade para venda por causa do prazo de renovação
      if (_checkRenewLimitForAvailability(lastQuota.renewLimit)) {
        _defineAsAvailable(quotaSource, lastQuota.exhibitedAt);
      }
    } else {
      locationData.availableQuota.push(lastQuota.number);
      availableQuotas[lastQuota.number - 1] = true;
    }

    locationData.hasQueue = lastQuota.queue > 0;
  });

  return locationData;
});

let _isQuotaSold = clientName => clientName !== null && typeof clientName !== 'undefined' && clientName !== '';

let _checkRenewLimitForAvailability = (renewLimit) => {
  if (renewLimit === null || typeof renewLimit === 'undefined') {
    return false;
  }
  return +moment().toDate() > +moment(renewLimit).toDate();
};

let _defineAsAvailable = (quotaSource, exhibitedAt) => {
  const queueExhibitorIndex = quotaSource.queueExhibitors.indexOf(exhibitedAt);
  if (queueExhibitorIndex > -1) {
    quotaSource.queueExhibitors.splice(queueExhibitorIndex, 1);
  }

  const unavailableExhibitorIndex = quotaSource.unavailableExhibitors.indexOf(exhibitedAt);
  if (unavailableExhibitorIndex > -1) {
    quotaSource.unavailableExhibitors.splice(unavailableExhibitorIndex, 1);
  }

  quotaSource.availableExhibitors.push(exhibitedAt);
};
