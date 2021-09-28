const router = require('express').Router();

//business
const GroupBusiness = require('../business/group');
const ActivityBusiness = require('../business/activity');

router.post('', (req, res) => {
    let groupBusiness = new GroupBusiness({});
    groupBusiness.createGroup(req)
        .then((scope) => groupBusiness.enviarResposta(res, 201, scope.resultCreatedGroup))
        .catch((err) => groupBusiness.groupErrorHandler(err, res));
});

router.get('/:id/activity', (req, res) => {
    let activityBusiness = new ActivityBusiness({});
    activityBusiness.activityList(req)
        .then((scope) => activityBusiness.enviarResposta(res, 200, scope.resultActivityList))
        .catch((err) => activityBusiness.activityErrorHandler(err, res));
});

router.get('', (req, res) => {
    let groupBusiness = new GroupBusiness({});
    groupBusiness.getAllGroup()
        .then((scope) => groupBusiness.enviarResposta(res, 200, scope.group))
        .catch((err) => groupBusiness.groupErrorHandler(err, res));
});

module.exports = router;
