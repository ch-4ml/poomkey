#chaincode insall
docker exec cli peer chaincode install -n sacc -v 0.2 -p github.com/sacc
#chaincode instatiate
# docker exec cli peer chaincode instantiate -n sacc -v 0.1 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
docker exec cli peer chaincode upgrade -n sacc -v 0.2 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
sleep 5
echo '-------------------------------------Upgrade END-------------------------------------'
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","6","5234abca","6번제품,","abcd","2019-09-01"]}'
sleep 2
echo '-------------------------------------Set Key END-------------------------------------'
#chaincode query a
docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["getKeysById"]}'
sleep 2
echo '-------------------------------------GetKeyById END-------------------------------------'
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","7","6234abcb","7번제품,","abcd","2019-09-03"]}'
sleep 2
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","8","7234abcc","8번제품,","abce","2019-09-04"]}'
sleep 2
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","999","bbbbbbbbb","9번제품,","qqqqqq","2019-09-02"]}'
sleep 2
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","1000","aaaaaaaaaa","10번제품,","qqqqqq","2019-09-01"]}'
sleep 2
echo '-------------------------------------Invoke END-------------------------------------'
#chaincode query b
docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["getKeysById"}'
sleep 2
echo '-------------------------------------END-------------------------------------'