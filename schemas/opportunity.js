const joi = require('joi');
const _ = require('lodash');

exports.opportunityPostSchema = {
  titulo: joi.string().required(),
  anuncianteId: joi.string().required(),
  agenciaId: joi.string().allow(""),
  produtoId: joi.number().integer().required(),
  valorNegociado: joi.number().precision(2).allow("0").required(),
  periodoExibIni: joi.date().allow(""),
  periodoExibFim: joi.date().min(Date.now()).allow(""),
  tipoProduto: joi.string().allow(""),
  origem: joi.string().allow("")
};

exports.opportunityProductSchema = {
  produtoId: joi.string().required(),
  periodoIni: joi.date().allow(""),
  periodoFim: joi.date().min(Date.now()).allow("")
};