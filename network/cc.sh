#chaincode install
docker exec cli peer chaincode install -n sacc -v 0.3 -p github.com/sacc
#chaincode instatiate
docker exec cli peer chaincode instantiate -n sacc -v 0.3 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
# docker exec cli peer chaincode upgrade -n sacc -v 0.2 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
# sleep 5
# # echo '-------------------------------------Upgrade END-------------------------------------'
# docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","1","1234567","제품1","박찬형","2019-10-01"]}'
# sleep 2
# echo '-------------------------------------Set Key END-------------------------------------'
# #chaincode query a
# docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["getAllKeys"]}'
# sleep 2
# # echo '-------------------------------------GetKeyById END-------------------------------------'
# #chaincode invoke b
# docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","2","1234568","61번제품","qqqqqq","2019-09-03"]}'
# sleep 2
# #chaincode invoke b
# docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","3","1234569","62번제품","abce","2019-09-04"]}'
# sleep 2
# #chaincode invoke b
# docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","4","1234560","63번제품","abce","2019-09-02"]}'
# sleep 2
# #chaincode invoke b
# docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["setKey","5","1234561","64번제품","abcd","2019-09-01"]}'
# sleep 2
# echo '-------------------------------------Invoke END-------------------------------------'
# #chaincode query b
# docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["getHistoryByKey","52"]}'
# docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["getAllKeys"]}'
# sleep 2
# echo '-------------------------------------END-------------------------------------'