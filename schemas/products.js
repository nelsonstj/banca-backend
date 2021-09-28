const joi = require('joi');
const _ = require('lodash');


const quotaItemSchema = joi.object().keys({
  type: joi.number().integer(),
  value: joi.number().precision(2),
  area: joi.string(),
  name: joi.string().empty(),
}).empty({});

const sponsorSchema = joi.object().keys({
  name: joi.string(),
  market_category: joi.number().integer(),
}).empty({});


const projectSchema = {
  name: joi.string(),
  description: joi.string(),
  quota_quantity: joi.number().integer(),
  quota_items: joi.array().items(quotaItemSchema),
  published: joi.bool(),
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
  siscom_id: joi.number().integer(),
  holder_changed: joi.bool(),
  digital_media_done: joi.bool()
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

  // national projects
  national: {
    type: joi.number().integer(),
    associated_to: joi.string(),
    program_days: joi.array().items(joi.number().integer().min(0).max(6)),
    program_initials: joi.string(),
    exhibition: exhibitionSchema,
    insertions: joi.array().items(insertionSchema),
    support_media: joi.bool(),
    gender: joi.number().integer(),
    has_digital_media: joi.bool(),

  },

  //  local projects
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

  //  projects with digital media
  digital_media: {
    isAvailable: joi.bool(),
    vertical: joi.array().items(joi.string()),
    sites: joi.array().items(joi.string()).empty(),
    support_media: joi.bool(),
    exhibition: exhibitionSchema,
    formats: joi.object().keys({
      display: displayFormatSchema,
      video: videoFormatSchema,
      content: contentFormatSchema,
    }),
    tags: joi.array().items(joi.string()).empty(),
    current_sponsors: joi.array().items(joi.object().keys({
      name: joi.string().allow(''),
      market_category: joi.number().integer().allow('')
    }))
  },

};

const weekDaySchema = joi.string().only('int', 'string').default('int');

exports.makeProjectSchema = function makeProjectSchema(types) {
  const schema = _.cloneDeep(projectSchema);
  if (types === '*') {
    return _.assign(schema, nestedSchemas);
  }
  return types.reduce((resultSchema, type) => _.assign(resultSchema,
        { [type]: nestedSchemas[type] }), schema);
};

exports.productSearchQuerySchema = {
  q: joi.string(),
  client: joi.string().empty(),
  search_method: joi.string().default('match'),
  ft_published: joi.boolean(),
  ft_product_range: joi.string(),
  ft_project_type: joi.number(),
  ft_product_type: joi.string(),
  ft_exhibition_start_gte: joi.string().isoDate(),
  ft_exhibition_end_lte: joi.string().isoDate(),
  ft_available_quota: joi.boolean(),
  ft_associated_to: joi.string(),
  ft_region: joi.string(),
  ft_state: joi.string(),
  ft_exhibitor: joi.string(),  
  ft_exhibition_type: joi.string(),
  ft_gender: joi.string(),
  ft_vertical: joi.string(),
  ft_tag: joi.string(),
  ft_start_date: joi.string().isoDate(),
  ft_end_date: joi.string().isoDate(),
  week_day_fmt: weekDaySchema,
  page: joi.number(),
  limit: joi.number(),
  offset: joi.number(),
  start_date: joi.string().isoDate(),
  end_date: joi.string().isoDate(),
  exhibitors: joi.string(),
  initials: joi.string()
};

exports.product_id_query_schema = {
  week_day_fmt: weekDaySchema,
  id: joi.number(),
  page: joi.number(),
  limit: joi.number()
};

exports.projectPostQuerySchema = {
  main_type: joi.string().required(),
  extra_type: [
    joi.string(),
    joi.array().items(joi.string()),
  ],
};
