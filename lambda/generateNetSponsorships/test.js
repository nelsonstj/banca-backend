let generate = require('./generateNetSponsorships');

generate.handler({
    "competence": new Date(),
    "esHost": "https://search-bancadev-???.us-east-1.es.amazonaws.com",
}, null, (err, data) => {
    if (err) {
        console.log("error", err);
    }
    else {
        console.log("Sucesso:", data);
    }
});