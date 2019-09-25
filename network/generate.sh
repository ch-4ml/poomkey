#!/bin/sh
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# * 아직 공부 중인 학생이 작성한 주석입니다.
# * 설명에 오류가 많을 수 있습니다.
#
# 가장 초기에 실행해야 하는 Shell Script로,
# 네트워크 구성에 필요한 cryptogen, configtxgen 유틸리티를
# crypto-config.yaml, configtx.yaml 속성 파일을 가지고 실행하여
# ./crypto-config, ./config 디렉토리 내부에 각각 생성합니다.
#

# export: 환경 변수(운영체제 전반에 적용)
# 유틸리티 파일이 있는 경로
export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH
# 설정 파일(crypto-config.yaml)이 있는 경로
export FABRIC_CFG_PATH=${PWD}
# connection.yaml
CHANNEL_NAME=mychannel

# remove previous crypto material and config transactions
# config, crypto-config 디렉토리 하위 항목들을 모두 삭제합니다.
rm -fr config/*
rm -fr crypto-config/*

# * 수정 중. 테스트 필요 ######################
# crypto-config 디렉토리가 없는 경우 생성합니다.
if [ ! -d "./crypto-config" ]; then
    mkdir crypto-config
fi
#############################################

# generate crypto material
# * GOPATH 경로를 정확하게 알고 나서 안에 ShellScript 분석한 다음 마저 작성
cryptogen generate --config=./crypto-config.yaml
# * 마지막 명령 줄 결과가 0이 아닌 경우
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi
# config 디렉토리가 없는 경우 생성합니다.
if [ ! -d "./config" ]; then
    mkdir config
fi
######################################

# generate genesis block for orderer
# configtx.yaml 속성 파일 내 정의됨.
# 제네시스 블록을 생성합니다.
configtxgen -profile ThreeOrgOrdererGenesis -outputBlock ./config/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
configtxgen -profile ThreeOrgChannel -outputCreateChannelTx ./config/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer1 transaction
configtxgen -profile ThreeOrgChannel -outputAnchorPeersUpdate ./config/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi

# generate anchor peer2 transaction
configtxgen -profile ThreeOrgChannel -outputAnchorPeersUpdate ./config/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi

# generate anchor peer3 transaction
configtxgen -profile ThreeOrgChannel -outputAnchorPeersUpdate ./config/Org3MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org3MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi
