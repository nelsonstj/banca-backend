var func = require('./dumpProgramData');

func.handler(null, null, (err, res) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log(res);
    }
});