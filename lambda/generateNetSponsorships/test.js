let generate = require('./generateNetSponsorships');

generate.handler({
    "competence": new Date(),
    "esHost": "https://search-bancadev-???",
}, null, (err, data) => {
    if (err) {
        console.log("error", err);
    }
    else {
        console.log("Sucesso:", data);
    }
});