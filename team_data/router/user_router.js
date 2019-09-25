const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const userRouter = express.Router();
const userModel = require('../model/user_model');

userRouter.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
}));

userRouter.post('/user', async (req, res) => {
    const user = {
        id: req.body.id,
        pw: req.body.pw
    };
    console.log(user);
    try {
        await userModel.register(user);
        let data = { result: true, msg: user.id + "님 환영합니다. 회원가입이 완료되었습니다." }
        console.log(data);
        res.status(200).send(data); 
    } catch(err) {
        res.status(500).send(err);
    }
});


userRouter.post('/login', async (req, res) => {
    const user = {
        id: req.body.id,
        pw: req.body.pw
    };
    console.log("로그인 정보",user);
    let data;
    try {
        let result = await userModel.login(user);
        if(result[0].length > 0) {
            req.session.user = {
                index: result[0][0].index
            }
            data = { msg: user.id + "님 반갑습니다." }
        } else {
            data = { msg: "로그인 정보가 일치하지 않습니다." }
        }
        console.log(data);
        res.status(200).send(data)
    } catch(err) {
        res.status(500).send(err);
    }
});
module.exports = userRouter;