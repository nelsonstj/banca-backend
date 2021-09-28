const app 		= require('../../app');
const request 	= require('supertest');
var   chai 		= require('chai');
const expect  	= chai.expect;
const inspect = require('eyes').inspector({ maxLength: 200000 });
const _       = require('lodash');

// TODO: Criar um LoginUSer e buscar o token dinamicamente
const token     = '7b2270617373706f7274223a7b2275736572223a2265794a68624763694f694a49557a49314e694973496e523563434936496b705856434a392e65794a3163325679626d46745a534936496d566b645746795a4738755a326c68626d357664485276496977695a334a76645841694f694a42566a64764f474e6a59566377597a463652465a54634452304f434973496d4e7359584e7a546d46745a534936496c567a64574679615739486247396962794973496d6c68644349364d5455774e7a49794f5463794e5377695a586877496a6f784e5441334d7a45324d54493166512e394d6c3444577358586e716f3237707750314364392d5f644e473846792d446154386b7038465a50523045227d7d';

describe('Products Search - API Integration Tests', function() {

  describe('GET /products/search com client = app', function() { 

    it('Obter dados com client = app ordenados por purchaseStatus com ft_product_type = sponsorship e ft_product_range = national', function(done) { 
      request(app)
        .get('/api/v1/products/search')
        .set('Authorization', token)
        .query({ 
          ft_published: true, 
          limit: 10, 
          offset: 0, 
          week_day_fmt: 'string', 
          ft_product_type: 'sponsorship', 
          ft_product_range: 'national', 
          client: 'app'
        })
        .end(function(err, res) { 
          let purchaseStatuses = [];
          expect(res.statusCode).to.equal(200); 
          expect(res.body.result).to.be.an('array'); 
          res.body.result.forEach(function(element, index, array) { purchaseStatuses.push(element.siscom_data.purchaseStatus) });
          expect(isArrayOrdered(purchaseStatuses)).to.be.true();
          done(); 
        }); 
    });
    xit('Obter dados com client = app ordenados por purchaseStatus com ft_product_type = project', function(done) { 
      request(app)
        .get('/api/v1/products/search')
        .set('Authorization', token)
        .query({ 
          ft_published: true, 
          limit: 10, 
          offset: 0, 
          week_day_fmt: 'string', 
          ft_product_type: 'project', 
          ft_product_range: 'national', 
          client: 'app'
        })
        .end(function(err, res) { 
          expect(res.statusCode).to.equal(200); 
          expect(res.body.result).to.be.an('array'); 
          done(); 
        }); 
    });
    xit('Obter dados em enviar client = app ordenados por purchaseStatus com ft_product_range = local', function(done) { 
      request(app)
        .get('/api/v1/products/search')
        .set('Authorization', token)
        .query({ 
          ft_published: true, 
          limit: 10, 
          offset: 0, 
          week_day_fmt: 'string',
          ft_product_type: 'project',  
          ft_product_range: 'local'
        })
        .end(function(err, res) { 
          expect(res.statusCode).to.equal(200); 
          expect(res.body.result).to.be.an('array'); 
          done(); 
        }); 
    });
  });

  describe('GET /products/search com client = cms', function() { 
    xit('Obter dados com client = cms ordenados por priorityDate com ft_product_type = sponsorship e ft_product_range = national', function(done) { 
      request(app)
        .get('/api/v1/products/search')
        .set('Authorization', token)
        .query({ 
          ft_published: true, 
          limit: 10, 
          offset: 0, 
          week_day_fmt: 'string', 
          ft_product_type: 'sponsorship', 
          ft_product_range: 'national', 
          client: 'cms'
        })
        .end(function(err, res) { 
          expect(res.statusCode).to.equal(200); 
          expect(res.body.result).to.be.an('array'); 
          done(); 
        }); 
    });
    xit('Obter dados com client = cms ordenados por priorityDate com ft_product_type = project', function(done) { 
      request(app)
        .get('/api/v1/products/search')
        .set('Authorization', token)
        .query({ 
          ft_published: true, 
          limit: 10, 
          offset: 0, 
          week_day_fmt: 'string', 
          ft_product_type: 'project', 
          ft_product_range: 'national', 
          client: 'cms'
        })
        .end(function(err, res) { 
          expect(res.statusCode).to.equal(200); 
          expect(res.body.result).to.be.an('array'); 
          done(); 
        }); 
    });
    xit('Obter dados com client = cms ordenados por priorityDate com ft_product_range = local', function(done) { 
      request(app)
        .get('/api/v1/products/search')
        .set('Authorization', token)
        .query({ 
          ft_published: true, 
          limit: 10, 
          offset: 0, 
          week_day_fmt: 'string',
          ft_product_type: 'project',  
          ft_product_range: 'local',
          client: 'cms'
        })
        .end(function(err, res) { 
          expect(res.statusCode).to.equal(200); 
          expect(res.body.result).to.be.an('array'); 
          done(); 
        }); 
    });
  });
});

function isArrayOrdered(arr){
  return _.every(arr, function(value, index, array) {
    // either it is the first element, or otherwise this element should
    // not be smaller than the previous element.
    // spec requires string conversion
    return index === 0 || String(array[index - 1]) <= String(value);
  });
}

function isArraySameValue(arr, valor){
  return arr.every(function(element, index, array){ return element == valor })
}
