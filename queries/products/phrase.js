function queryPhrase(bob) {
  return function query(phrase) {
    let innerBob = bob;

    if (phrase) {
      // Campos que devem ser considerados na consulta devem ser incluídos aqui!
      // Adicionar campos: patrocinadores anteriores, sigla do programa
      const fields = ["name", "description", "siscom_data.soldQuota.clientName",
        "local.program_initials", "national.program_initials", 
        "national_sponsorship.program_initials", "net_sponsorship.program_initials", "local_sponsorship.program_initials",
        "sponsors"]

      // Montagem dos elementos para inserção no "should" do ES para consulta por termo.
      const searchFields = fields.reduce((prev, current) => {
        let element = {};
        element[current] = phrase;
        return prev.concat([{ "match_phrase_prefix": element }]);
      }, []);

      innerBob.query('bool', 'must', [{
        "bool": {
          "should": searchFields
        }
      }]);
    }

    return innerBob;
  }
}

exports.queryPhrase = queryPhrase;