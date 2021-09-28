const ServiceBus = require('./serviceBus');
const log = require('../helpers/log').logger;

const _enviar = (item) => {
  log.info('Integration Helpers -> enviar');
  return new Promise((resolve, reject) => {
    const msg = preparaMensagem(item);
    const serviceBus = new ServiceBus();
    serviceBus.sendQueueMessage(msg, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

function preparaMensagem(msg) {
  const mensagem = msg;

  // colocar HEADER DE IDENTIFICACAO
  mensagem.header = "PROJETO";
  /*
  if (mensagem.main_type === 'national' || mensagem.main_type === 'local') {
    mensagem.header = 'PROJETO';
  } else if (mensagem.main_type === 'net_sponsorship' || mensagem.main_type === 'national_sponsorship' || mensagem.main_type === 'local_sponsorship') {
    mensagem.header = 'PATROCÍNIO';
  } else if (mensagem.main_type === 'digital_media') {
    mensagem.header = 'DIGITAL';
  }
  */
/*
  // DELETAR NATIONAL EXHIBITION
  if (mensagem.national !== undefined) {
    delete mensagem.national.exhibition;
  }
*/
  // DELETAR ALREADY PUBLISHED
  if (mensagem.already_published !== undefined) {
    delete mensagem.already_published;
  }

  // DELETAR attachments
  if (mensagem.attachments !== undefined) {
    delete mensagem.attachments;
  }

  // DELETAR created_at
  if (mensagem.created_at !== undefined) {
    delete mensagem.created_at;
  }

  // DELETAR created_by
  if (mensagem.created_by !== undefined) {
    delete mensagem.created_by;
  }
/*
  // DELETAR digital_media EXHIBITION
  if (mensagem.digital_media !== undefined) {
    delete mensagem.digital_media.exhibition;
  }
*/
  // DELETAR owner
  if (mensagem.owner !== undefined) {
    delete mensagem.owner;
  }

  // DELETAR SISCOM_DATA
  if (mensagem.siscom_data !== undefined) {
    delete mensagem.siscom_data;
  }

  // DELETAR updated_at
  if (mensagem.updated_at !== undefined) {
    delete mensagem.updated_at;
  }

  return mensagem;
}

module.exports = {
  enviar: _enviar
};
