const expect = require('chai').expect;
const path = require('path');

const localSponsorshipBusiness = require('../../../business/local_sponsorships');

describe('Local Sponsorships business testes', () => {
    it('should return valid local sponsorship object from excel data', () => {
        let biz = new localSponsorshipBusiness({
            excelFilesResult: [path.join(__dirname, 'handlerExcelFileTest.xlsx')]
        });

        let req = {
            query: {
                referenceDate: '2017-10-10T00:00:00Z'
            }
        };

        biz.handlerExcelFile(req).then(actualResultData => {
            expect(actualResultData.handlerExcelFileResult[0][0].name).to.equal("Bom Dia Praça");
            expect(actualResultData.handlerExcelFileResult[0][0].local_sponsorship.program_initials).to.equal("BPRA\'");

            expect(actualResultData.handlerExcelFileResult[0][1].name).to.equal("Praça TV 1ª Edição");
            expect(actualResultData.handlerExcelFileResult[0][1].local_sponsorship.program_initials).to.equal("PTV1");

            expect(actualResultData.handlerExcelFileResult[0][2].name).to.equal("Praça TV 2ª Edição");
            expect(actualResultData.handlerExcelFileResult[0][2].local_sponsorship.program_initials).to.equal("PTV2");

            expect(actualResultData.handlerExcelFileResult[0][3].name).to.equal("Globo Horizonte");
            expect(actualResultData.handlerExcelFileResult[0][3].local_sponsorship.program_initials).to.equal("GLHO\'");

            expect(actualResultData.handlerExcelFileResult[0][4].name).to.equal("Bom Dia Praça (Local)");
            expect(actualResultData.handlerExcelFileResult[0][4].local_sponsorship.program_initials).to.equal("BPLO");

            expect(actualResultData.handlerExcelFileResult[0][5].name).to.equal("Mais Caminhos");
            expect(actualResultData.handlerExcelFileResult[0][5].local_sponsorship.program_initials).to.equal("MAIS\'");

            expect(actualResultData.handlerExcelFileResult[0][6].name).to.equal("Terra da Gente");
            expect(actualResultData.handlerExcelFileResult[0][6].local_sponsorship.program_initials).to.equal("TRGE\'");


        }).catch((err) => {
            console.log(err);
            expect(true).to.equal(false);
        });
    })
});