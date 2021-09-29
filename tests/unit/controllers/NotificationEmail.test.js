const notificationEmailController = require('../../../controllers/notificationEmail.js');
const assert = require('chai').assert;

describe("Notification Email", () => {
    describe("Send", () => {
        it("Should send CCO e-mails to development team", () => {
            let notificationEmail = new notificationEmailController({
                "config": {}
            });

            notificationEmail.send({
                "owner": "Grupo de testes",
                "projectName": "Projeto de testes",
                "users": [
                    "email@email.com.br"
                ]
            });
        });
    });
});