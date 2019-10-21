const express = require('express');
const userRouter = express.Router();
const userModel = require('../model/user');

userRouter.get('/user/signup', (req, res) => {
    let data;
    data = { result: true, user: req.session.user };
    res.render('signup', {data: data}); 
 });

userRouter.post('/user/signup', async (req, res) => {
    let data;
    const user = {
        id: req.body.id,
        pw: req.body.pw
    };
    try {
        await userModel.register(user);
        data = { result: true, msg: user.id + "님 환영합니다. 회원가입이 완료되었습니다.", user: req.session.user };
        res.render('login', { data: data });
    } catch(err) {
        res.status(500).send(err);
    }
});

userRouter.get('/user/login', (req, res) => {
    let data;
    data = { result: true, user: req.session.user }
    res.render('login', {data: data});
 });

userRouter.post('/user/login', async (req, res) => {
    const user = {
        id: req.body.id,
        pw: req.body.pw
    };
    console.log("로그인 정보", user);
    let data;
    try {
        let result = await userModel.login(user);
        if(result[0].length > 0) {
            req.session.user = {
                index: result[0][0].index,
                id: result[0][0].id
            }
            data = { result: true, msg: user.id + "님 반갑습니다.", user: req.session.user }
        } else {
            data = { result: false, msg: "로그인 정보가 일치하지 않습니다.", user: req.session.user }
        }
        res.render('index', { data: data });
    } catch(err) {
        res.status(500).send(err);
    }
});

userRouter.get('/user/logout', async (req, res) => {
    let data;
    if(req.session.user) {
        req.session.destroy(err => {
            console.log('세션 삭제 실패: ', err);
            return;
        });
        console.log('세션 삭제 성공');
        data = { result: true, msg: "세션 삭제 성공" }
        res.render('index', { data: data });
    } else {
        data = { result: false, msg: "로그인 정보가 없습니다." }
        res.render('index', { data: data });
    }
})

module.exports = userRouter;