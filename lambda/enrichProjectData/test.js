var func = require("./enrichProjectData");

func.handler(null, null, (err, data) => {
    if (err) console.log(err);
    else {
        console.log("success:", data);
    }
})