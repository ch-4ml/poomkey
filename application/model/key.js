const db = require('./connect');

// 제품키에 관련된 소스코드 작성 필요
class Key {
    // 제품키 등록
    setKey(keyData) {
        return new Promise(async (resolve, reject) => {
           let sql = 'INSERT INTO poomkey SET ?';
           try {
               let result = await db.query(sql, keyData);
               console.log(result)
               resolve(result);
           } catch(err) {
               reject(err);
           }
        });
    }
    
    // 제품키 조회      
    getKeysByOwner(keyData) {
        return new Promise(async (resolve, reject) => {
            let sql = 'SELECT * FROM poomkey WHERE owner = ?';
            try {
                let result = await db.query(sql, keyData);
                resolve(result);
            } catch(err) {
                reject(err);
            }
        });
    }

    // 전체 키 조회
    getAllKeys() {
        return new Promise(async (resolve, reject) => {
            let sql = 'SELECT * FROM poomkey';
            try {
                let result = await db.query(sql);
                resolve(result);
            } catch(err) {
                reject(err);
            }
        });
    }

    // 제품키 소유권 이전 , 로직을 짜야됌
    changeKeyOwner(key) {
        return new Promise(async (resolve, reject) => {
            let sql = 'UPDATE poomkey SET owner = ? WHERE poomkey.index = ?';
            try {
                let result = await db.query(sql, [key.owner, key.keyIndex]);
                resolve(result);
            } catch(err) {
                reject(err);
            }
         });
    }
    
}

module.exports = new Key();