#chaincode insall
docker exec cli peer chaincode install -n sacc -v 0.1 -p github.com/sacc
#chaincode instatiate
docker exec cli peer chaincode instantiate -n sacc -v 0.1 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
# docker exec cli peer chaincode upgrade -n sacc -v 0.2 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
sleep 5
echo '-------------------------------------Upgrade END-------------------------------------'
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","1","1234abci","1번제품,","소유1","2019-09-01"]}'
sleep 2
echo '-------------------------------------Set Key END-------------------------------------'
#chaincode query a
docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["getKeysById"]}'
sleep 2
echo '-------------------------------------GetKeyById END-------------------------------------'
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","2","1234abcj","2번제품,","소유1","2019-09-03"]}'
sleep 2
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","3","1234abck","3번제품,","소유2","2019-09-04"]}'
sleep 2
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","4","1234abcl","4번제품,","소유3","2019-09-02"]}'
sleep 2
#chaincode invoke b
docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","5","1234abcn","5번제품,","소유1","2019-09-01"]}'
sleep 2
echo '-------------------------------------Invoke END-------------------------------------'
#chaincode query b
docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["getKeysByOwner","소유1"]}'
sleep 2
echo '-------------------------------------END-------------------------------------'