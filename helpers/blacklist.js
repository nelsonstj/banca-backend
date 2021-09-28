const _ = require('lodash');
const inspect = require('eyes').inspector({ maxLength: 20000000 });

module.exports = function(data){ 
	//se availability for 2 siscom_data.availableQuotas = 0, siscom_data.quotas.availableQuota = [], 
	  if (data.availability == 2){
	  	 if (data.siscom_data){
	  	 	data.siscom_data.availableQuotas = 0
	  	 	data.siscom_data.quotas.forEach((element, index, array) => {
	  	 		element.availableQuota = [];
	  	 	})
	  	 }
	  }
	  return data
	}
