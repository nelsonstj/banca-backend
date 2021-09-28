
const joi = require('joi');
const _   = require('lodash');


const quotaItemSchema = joi.object().keys({
  type: joi.number().integer(),
  value: joi.number().precision(2),
  area: joi.string(),
  name: joi.string().empty({}),
}).empty({});

const sponsorSchema = joi.object().keys({
  name: joi.string(),
  market_category: joi.number().integer(),
}).empty({});

const comercialSchema = joi.object().keys({
  type: joi.number().integer(),
  value: joi.number().integer(),
}).empty({});

const price_tables_items = joi.object({
  reference: joi.string(),
  quota_items: joi.array().items(quotaItemSchema)
})

const national_sponsorship = joi.object().keys({
  program_initials: joi.string(),
  hide_price: joi.bool(),
  price_tables: joi.array().items(price_tables_items).empty({}),
  exhibitors: joi.array().items(joi.string()),
  start_time: joi.string(),
  observation: joi.string().required(),
  gender: joi.string(),
  synopsis: joi.string().required(),
  assumes_price_of: joi.string().required(),
  has_digital_media: joi.bool(),
  comercial_scheme: joi.array().items(comercialSchema),
  cross_media: joi.object().keys({
    merchandising: joi.bool(),
    globo_news_value: joi.number().precision(2)
  })
}).empty({});


const digital_media = joi.object().keys({
  vertical: joi.array().items(joi.string()),
  support_media: joi.bool(),
  formats: joi.object().keys({
    display: joi.object().keys({
      active: joi.bool(),
      estimated_impressions: joi.number(),
      determined_impressions: joi.number(),
      total_impressions: joi.number()
    }),
    video: joi.object().keys({
      active: joi.bool(),
      total_views: joi.number()
    })
  }),
  tags: joi.array().items(joi.string()),
  sites: joi.array().items(joi.string())
})

const sponsorshipSchema = {
  name: joi.string(),
  quota_quantity: joi.number().integer(),
  quota_items: joi.array().items(quotaItemSchema),
  published: joi.bool(),
  already_published: joi.bool(),
  holder: joi.string(),
  send_push_notification: joi.bool(),
  push_message: joi.string(),
  price_list: joi.object().keys({
    limit: joi.string().isoDate().allow(null),
    fixed_price: joi.bool()
  }).empty({}),
  sponsors: joi.array().items(sponsorSchema).empty({}),
  commercialization_limit: joi.string().isoDate(),
  renew_limit_date: joi.string().isoDate(),
  siscom_id: joi.number().integer().allow(null),
  holder_changed: joi.bool(),
  digital_media_done: joi.bool(),
};

const exhibitionSchema = joi.object().keys({
  format: joi.string(),
  start: joi.string().isoDate(),
  duration: joi.number().integer(), // in hours
}).empty({});

const insertionSchema = joi.object().keys({
  type: joi.number().integer(),
  value: joi.number().integer(),
}).empty({});


const displayFormatSchema = joi.object().keys({
  active: joi.bool(),
  estimated_impressions: joi.number().integer(),
  determined_impressions: joi.number().integer(),
  total_impressions: joi.number().integer(),
}).empty({});


const videoFormatSchema = joi.object().keys({
  active: joi.bool(),
  total_views: joi.number().integer(),
}).empty({});

const contentFormatSchema = joi.object().keys({
  active: joi.bool(),
  total_impact: joi.number().integer(),
}).empty({});


const nestedSchemas = {

  // national sponsorships
  national_sponsorship: {
    hide_price: joi.bool(),
    program_days: joi.array().items(joi.number().integer().min(0).max(6)),
    price_tables: joi.array().items(price_tables_items).empty({}),
    program_initials: joi.string(),
    exhibitors: joi.array().items(joi.string()),
    already_published: joi.bool(),
    start_time: joi.string(),
    observation: joi.string(),
    gender: joi.string(),
    synopsis: joi.string(),
    assumes_price_of: joi.string(),
    has_digital_media: joi.bool(),
    commercial_scheme: joi.array().items(comercialSchema),
    cross_media: joi.object().keys({
      merchandising: joi.bool(),
      globo_news_value: joi.number().precision(2)
    })
  },

  //  local sponsorships
  local: {
    minimum_quota: joi.number().integer(),
    quota_quantity: joi.number().integer(),
    exhibitors: joi.array().items(joi.string()),
    quotas: joi.array().items(joi.object().keys({
      exhibitors: joi.array().items(joi.string()),
      quota_items: joi.array().items(quotaItemSchema),
      sponsors: joi.array().items(sponsorSchema)
    })).empty({}),
    type: joi.number().integer(),
    already_published: joi.bool(),
    associated_to: joi.string(),
    program_days: joi.array().items(joi.number().integer().min(0).max(6)),
    program_initials: joi.string(),
    exhibition: exhibitionSchema,
    insertions: joi.array().items(insertionSchema),
    support_media: joi.bool(),
    gender: joi.number().integer(),
    renew_limit_date: joi.string().isoDate(),
    has_digital_media: joi.bool(),
  },

  //  sponsorships with digital media
  digital_media: {
    vertical: joi.array().items(joi.string()),
    sites: joi.array().items(joi.string()).allow(''),
    support_media: joi.bool(),
    exhibition: exhibitionSchema,
    formats: joi.object().keys({
      display: displayFormatSchema,
      video: videoFormatSchema,
      content: contentFormatSchema,
    }),
    tags: joi.array().items(joi.string()).allow(''),
    sites: joi.array().items(joi.string()).allow('')
  },
};

const weekDaySchema = joi.string().only('int', 'string').default('int');

exports.makeSponsorshipSchema = function makeSponsorshipSchema(types) {
  const schema = _.cloneDeep(sponsorshipSchema);
  if (types === '*') {
    return _.assign(schema, nestedSchemas);
  }
  return types.reduce((resultSchema, type) => _.assign(resultSchema,
        { [type]: nestedSchemas[type] }), schema);
};

exports.sponsorshipSearchQuerySchema = {
  q: joi.string(),
  search_method: joi.string().default('match'),
  ft_published: joi.boolean(),
  ft_sponsorship_range: joi.string(),
  ft_sponsorship_type: joi.string(),
  ft_exhibition_start_gte: joi.string().isoDate(),
  ft_exhibition_end_lte: joi.string().isoDate(),
  ft_available_quota: joi.boolean(),
  ft_region: joi.string(),
  ft_state: joi.string(),
  ft_exhibitor: joi.string(),
  ft_gender: joi.string(),
  ft_vertical: joi.string(),
  ft_tag: joi.string(),
  week_day_fmt: weekDaySchema,
  page: joi.number(),
  limit: joi.number(),
  offset: joi.number()
};

exports.sponsorship_id_query_schema = {
  week_day_fmt: weekDaySchema,
  page: joi.number(),
  limit: joi.number()
};

exports.sponsorshipPostQuerySchema = {
  main_type: joi.string().required(),
  extra_type: [
    joi.string(),
    joi.array().items(joi.string()),
  ],
};
